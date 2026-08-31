import { Test, TestingModule } from "@nestjs/testing";
import { AdminDevicesController } from "./admin-devices.controller";
import { DevicesService } from "./devices.service";

describe("AdminDevicesController", () => {
  let controller: AdminDevicesController;
  let devicesServiceMock: any;

  beforeEach(async () => {
    devicesServiceMock = {
      findAllForMosque: jest.fn(),
      generatePairingToken: jest.fn(),
      removeDevice: jest.fn(),
      revokeDevice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDevicesController],
      providers: [{ provide: DevicesService, useValue: devicesServiceMock }],
    }).compile();

    controller = module.get<AdminDevicesController>(AdminDevicesController);
  });

  it("should get all devices for a mosque", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    devicesServiceMock.findAllForMosque.mockResolvedValue([{ id: "d1" }]);
    
    const result = await controller.findAll(req);
    expect(result.length).toBe(1);
    expect(devicesServiceMock.findAllForMosque).toHaveBeenCalledWith("m1");
  });

  it("should generate a pairing token", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    devicesServiceMock.generatePairingToken.mockResolvedValue({ token: "123456" });
    
    const result = await controller.generateToken(req);
    expect(result.token).toBe("123456");
  });

  it("should revoke a device", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    devicesServiceMock.revokeDevice.mockResolvedValue({ id: "d1", status: "REVOKED" });
    
    const result = await controller.revoke(req, "d1");
    expect(result.status).toBe("REVOKED");
  });
});
