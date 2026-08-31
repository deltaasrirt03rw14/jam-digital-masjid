import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AdminUser } from "./entities/admin-user.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;
  let adminUserRepositoryMock: any;

  beforeEach(async () => {
    adminUserRepositoryMock = {
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mosqueRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const jwtServiceMock = {
      sign: jest.fn().mockReturnValue("signed-token"),
    };

    const configServiceMock = {
      get: jest.fn().mockReturnValue("some-value"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: getRepositoryToken(AdminUser), useValue: adminUserRepositoryMock },
        { provide: getRepositoryToken(Mosque), useValue: mosqueRepositoryMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should throw error if user not found", async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.login("test@test.com", "pass")).rejects.toThrow("Invalid credentials");
    });

    it("should throw error if password does not match", async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: "1",
        email: "test@test.com",
        password_hash: "hashed",
        mosque: { id: "m1" },
      });
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(false));

      await expect(service.login("test@test.com", "pass")).rejects.toThrow("Invalid credentials");
    });

    it("should return token if credentials are valid", async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: "1",
        email: "test@test.com",
        password_hash: "hashed",
        mosque: { id: "m1" },
      });
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(true));

      const result = await service.login("test@test.com", "pass");
      expect(result.access_token).toBe("signed-token");
      expect(result.mosque_id).toBe("m1");
    });
  });
});
