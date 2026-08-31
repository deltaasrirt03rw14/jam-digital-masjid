import { Test, TestingModule } from "@nestjs/testing";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

describe("MediaController", () => {
  let controller: MediaController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it("should find all media for a mosque", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    serviceMock.findAll.mockResolvedValue([{ id: "med1", filename: "test.jpg" }]);
    
    const result = await controller.findAll(req);
    expect(result.length).toBe(1);
    expect(serviceMock.findAll).toHaveBeenCalledWith("m1");
  });
});
