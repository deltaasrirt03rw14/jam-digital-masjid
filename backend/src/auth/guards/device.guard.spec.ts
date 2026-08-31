import { Test, TestingModule } from "@nestjs/testing";
import { DeviceGuard } from "./device.guard";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Device } from "../../devices/entities/device.entity";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

describe("DeviceGuard", () => {
  let guard: DeviceGuard;
  let devicesRepoMock: any;

  beforeEach(async () => {
    devicesRepoMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceGuard,
        { provide: getRepositoryToken(Device), useValue: devicesRepoMock },
      ],
    }).compile();

    guard = module.get<DeviceGuard>(DeviceGuard);
  });

  it("should throw Unauthorized if no token provided", async () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, params: { deviceId: "123" } }),
      }),
    } as any;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw Unauthorized if device revoked", async () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: "Bearer token" },
          params: { deviceId: "123" },
        }),
      }),
    } as any;

    devicesRepoMock.findOne.mockResolvedValue({ status: "REVOKED" });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw Forbidden if device disabled (after checking key)", async () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: "Bearer token123" },
          params: { deviceId: "123" },
        }),
      }),
    } as any;

    const keyHash = await bcrypt.hash("token123", 10);
    devicesRepoMock.findOne.mockResolvedValue({
      status: "DISABLED",
      api_key_hash: keyHash,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("should allow if ACTIVE and key is valid", async () => {
    const req = {
      headers: { authorization: "Bearer token123" },
      params: { deviceId: "123" },
      device: null,
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;

    const keyHash = await bcrypt.hash("token123", 10);
    devicesRepoMock.findOne.mockResolvedValue({
      id: "123",
      status: "ACTIVE",
      api_key_hash: keyHash,
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.device).toBeDefined();
  });
});
