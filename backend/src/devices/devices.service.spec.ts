import { Test, TestingModule } from "@nestjs/testing";
import { DevicesService } from "./devices.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Device } from "./entities/device.entity";
import { DevicePairingToken } from "./entities/device-pairing-token.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { BadRequestException, ConflictException } from "@nestjs/common";

describe("DevicesService", () => {
  let service: DevicesService;
  let dataSourceMock: any;
  let mosquesRepoMock: any;
  let pairingTokensRepoMock: any;

  beforeEach(async () => {
    dataSourceMock = {
      transaction: jest.fn(),
    };
    mosquesRepoMock = {
      findOne: jest.fn(),
    };
    pairingTokensRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

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

  describe("generatePairingToken", () => {
    it("should generate a 6-digit PIN, hash it, and save", async () => {
      mosquesRepoMock.findOne.mockResolvedValue({ id: "mosque-1" });
      const mockSavedToken = {
        id: "token-1",
        token_hash: "hash",
        expires_at: new Date(),
      };
      pairingTokensRepoMock.create.mockReturnValue(mockSavedToken);
      pairingTokensRepoMock.save.mockResolvedValue(mockSavedToken);

      const result = await service.generatePairingToken("mosque-1");

      expect(result.token).toMatch(/^\d{6}$/); // 6 digits
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now()); // Future expiry
      expect(pairingTokensRepoMock.save).toHaveBeenCalled();
    });

    it("should throw if mosque not found", async () => {
      mosquesRepoMock.findOne.mockResolvedValue(null);
      await expect(service.generatePairingToken("mosque-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("pairDevice", () => {
    it("should execute inside a transaction, verify token, check duplicates, generate 256-bit key", async () => {
      const plainToken = "123456";
      const tokenHash = await bcrypt.hash(plainToken, 10);
      const activeToken = {
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
        findOne: jest.fn().mockResolvedValue(null), // No existing device
        create: jest.fn().mockReturnValue({ id: "device-1" }),
        save: jest.fn().mockResolvedValue({}),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(managerMock);
      });

      const result = await service.pairDevice(
        "device-uuid-1",
        plainToken,
        "Test TV",
      );

      expect(result.apiKey).toBeDefined();
      expect(result.apiKey.length).toBe(64); // 32 bytes hex = 64 chars (256 bits)
      expect(result.mosqueId).toBe("mosque-1");
      expect(managerMock.save).toHaveBeenCalledTimes(2); // Device and Token
    });

    it("should rollback transaction (throw) if token is invalid or used", async () => {
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No active tokens
      };
      const managerMock = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(managerMock);
      });

      await expect(service.pairDevice("uuid", "111111")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should rollback transaction (throw) if duplicate device_identifier", async () => {
      const plainToken = "123456";
      const tokenHash = await bcrypt.hash(plainToken, 10);
      const activeToken = {
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
        findOne: jest.fn().mockResolvedValue({ id: "existing-device" }),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(managerMock);
      });

      await expect(
        service.pairDevice("existing-uuid", plainToken),
      ).rejects.toThrow(ConflictException);
    });
  });
});
