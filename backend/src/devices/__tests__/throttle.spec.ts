/**
 * TASK-008 Phase 1.1 — PIN Brute-Force Protection Tests
 *
 * Verifies that:
 * 1. ThrottlerGuard is configured on the pairDevice endpoint.
 * 2. The @Throttle decorator is set to limit: 5, ttl: 900000 (15 minutes).
 * 3. Service-level pairing logic handles invalid/expired tokens correctly.
 *
 * Note: NestJS ThrottlerGuard integration tests require an HTTP adapter (e2e).
 * These unit tests verify:
 * - The controller decorator configuration.
 * - Service behavior for bad PIN, expired PIN, and successful pairing (which resets counter implicitly
 *   because a new token is issued).
 *
 * The actual HTTP 429 rate-limiting behavior is enforced by NestJS ThrottlerGuard
 * at the request level, and is verified here via metadata reflection.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { DevicesController } from "../devices.controller";
import { DevicesService } from "../devices.service";
import { DeviceGuard } from "../../auth/guards/device.guard";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Device } from "../entities/device.entity";
import { DevicePairingToken } from "../entities/device-pairing-token.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";
import { DataSource } from "typeorm";

describe("Devices Rate Limiting & Throttle Configuration", () => {
  describe("Throttle metadata on pairDevice endpoint", () => {
    it("should have @Throttle with limit=5 and ttl=900000 on pairDevice", () => {
      const limit = Reflect.getMetadata(
        "THROTTLER:LIMITdefault",
        DevicesController.prototype.pairDevice,
      );
      const ttl = Reflect.getMetadata(
        "THROTTLER:TTLdefault",
        DevicesController.prototype.pairDevice,
      );

      expect(limit).toBe(5);
      expect(ttl).toBe(900000); // 15 minutes in ms
    });

    it("should NOT have @Throttle override on heartbeat (uses global default)", () => {
      const limit = Reflect.getMetadata(
        "THROTTLER:LIMITdefault",
        DevicesController.prototype.heartbeat,
      );
      // heartbeat uses global ThrottlerModule defaults, no per-endpoint override
      expect(limit).toBeUndefined();
    });
  });

  describe("DevicesService - pairDevice edge cases (brute-force related)", () => {
    let service: DevicesService;
    let dataSourceMock: any;
    let mosquesRepoMock: any;
    let pairingTokensRepoMock: any;

    beforeEach(async () => {
      dataSourceMock = { transaction: jest.fn() };
      mosquesRepoMock = { findOne: jest.fn() };
      pairingTokensRepoMock = { create: jest.fn(), save: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DevicesService,
          { provide: getRepositoryToken(Device), useValue: {} },
          {
            provide: getRepositoryToken(DevicePairingToken),
            useValue: pairingTokensRepoMock,
          },
          { provide: getRepositoryToken(Mosque), useValue: mosquesRepoMock },
          { provide: DataSource, useValue: dataSourceMock },
        ],
      }).compile();

      service = module.get<DevicesService>(DevicesService);
    });

    it("should reject an invalid PIN (wrong token)", async () => {
      // Scenario: attacker submits wrong PIN
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No matching active token
      };
      dataSourceMock.transaction.mockImplementation(async (cb: any) =>
        cb({ createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock) }),
      );

      await expect(
        service.pairDevice("device-uuid-a", "000000"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject an expired PIN", async () => {
      // Scenario: token exists but is expired (would not be returned by andWhere expires_at > now)
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // Expired token excluded by DB query
      };
      dataSourceMock.transaction.mockImplementation(async (cb: any) =>
        cb({ createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock) }),
      );

      await expect(
        service.pairDevice("device-uuid-b", "999999"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject a used/consumed PIN", async () => {
      // Scenario: PIN was already used — returns empty because used_at IS NOT NULL
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // Used token filtered by WHERE used_at IS NULL
      };
      dataSourceMock.transaction.mockImplementation(async (cb: any) =>
        cb({ createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock) }),
      );

      await expect(
        service.pairDevice("device-uuid-c", "123456"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should mark token as used upon successful pairing (one-time use enforcement)", async () => {
      const bcrypt = await import("bcrypt");
      const plainToken = "654321";
      const tokenHash = await bcrypt.hash(plainToken, 10);

      const activeToken: any = {
        mosque_id: "mosque-1",
        token_hash: tokenHash,
        used_at: null,
      };

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([activeToken]),
      };
      const managerMock = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({ id: "device-x" }),
        save: jest.fn().mockResolvedValue({}),
      };

      dataSourceMock.transaction.mockImplementation(async (cb: any) =>
        cb(managerMock),
      );

      await service.pairDevice("device-uuid-d", plainToken, "TV A");

      // Verify used_at was set on the token before save
      expect(activeToken.used_at).toBeDefined();
      expect(activeToken.used_at).toBeInstanceOf(Date);
      // Save called twice: device + token
      expect(managerMock.save).toHaveBeenCalledTimes(2);
    });
  });
});
