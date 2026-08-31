import { Test, TestingModule } from "@nestjs/testing";
import { DevicesController } from "./devices.controller";
import { DevicesService } from "./devices.service";
import { DeviceGuard } from "../auth/guards/device.guard";

describe("DevicesController", () => {
  let controller: DevicesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      pairDevice: jest.fn(),
      processHeartbeat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [{ provide: DevicesService, useValue: serviceMock }],
    })
      .overrideGuard(DeviceGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DevicesController>(DevicesController);
  });

  describe("pairDevice", () => {
    it("should call pairDevice service", async () => {
      const dto = { deviceIdentifier: "uuid", token: "123456" };
      serviceMock.pairDevice.mockResolvedValue({
        apiKey: "key",
        mosqueId: "id",
      });
      const result = await controller.pairDevice(dto);
      expect(result).toEqual({ apiKey: "key", mosqueId: "id" });
      expect(serviceMock.pairDevice).toHaveBeenCalledWith(
        "uuid",
        "123456",
        undefined,
      );
    });
  });

  describe("heartbeat", () => {
    it("should process heartbeat", async () => {
      serviceMock.processHeartbeat.mockResolvedValue({
        configVersion: 2,
        syncRequired: false,
      });
      const result = await controller.heartbeat("device-1");
      expect(result).toEqual({ configVersion: 2, syncRequired: false });
      expect(serviceMock.processHeartbeat).toHaveBeenCalledWith("device-1");
    });
  });
});
