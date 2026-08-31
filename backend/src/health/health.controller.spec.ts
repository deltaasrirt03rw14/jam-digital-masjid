import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus";

describe("HealthController", () => {
  let controller: HealthController;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("checkHealth", () => {
    it("should return ok status", () => {
      expect(controller.checkHealth()).toEqual({ status: "ok" });
    });
  });

  describe("checkReadiness", () => {
    it("should check database readiness", async () => {
      mockHealthCheckService.check.mockResolvedValue({
        status: "ok",
        info: { database: { status: "up" } },
        error: {},
        details: { database: { status: "up" } },
      });
      const result = await controller.checkReadiness();
      expect(result.status).toBe("ok");
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });
  });
});
