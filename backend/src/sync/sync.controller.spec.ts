import { Test, TestingModule } from "@nestjs/testing";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";
import { DeviceGuard } from "../auth/guards/device.guard";

describe("SyncController", () => {
  let controller: SyncController;
  let serviceMock: any;
  let deviceGuardMock: any;

  beforeEach(async () => {
    serviceMock = {
      getSyncData: jest.fn(),
    };

    deviceGuardMock = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [{ provide: SyncService, useValue: serviceMock }],
    })
      .overrideGuard(DeviceGuard)
      .useValue(deviceGuardMock)
      .compile();

    controller = module.get<SyncController>(SyncController);
  });

  it("should return sync data with etag", async () => {
    const req = { device: { mosque_id: "m1" } };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    serviceMock.getSyncData.mockResolvedValue({
      mosque: { config_version: 5 },
      contents: [],
      media: [],
      events: [],
    });

    await controller.sync(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("ETag", 'W/"5"');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 304 if etag matches", async () => {
    const req = { device: { mosque_id: "m1" } };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    serviceMock.getSyncData.mockResolvedValue({
      mosque: { config_version: 5 },
    });

    await controller.sync(req, res, 'W/"5"');

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.send).toHaveBeenCalled();
  });
});
