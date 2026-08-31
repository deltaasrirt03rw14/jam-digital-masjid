import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call authService.login", async () => {
    authService.login.mockResolvedValue({
      access_token: "test_token",
      mosque_id: "test_mosque_id",
      email: "admin@masjid.local",
    });

    const result = await controller.login({
      email: "admin@masjid.local",
      password: "password123",
    });

    expect(authService.login).toHaveBeenCalledWith("admin@masjid.local", "password123");
    expect(result.access_token).toBe("test_token");
  });
});
