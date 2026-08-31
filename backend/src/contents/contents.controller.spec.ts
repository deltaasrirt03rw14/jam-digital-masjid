import { Test, TestingModule } from "@nestjs/testing";
import { ContentsController } from "./contents.controller";
import { ContentsService } from "./contents.service";

describe("ContentsController", () => {
  let controller: ContentsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentsController],
      providers: [{ provide: ContentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ContentsController>(ContentsController);
  });

  it("should find all contents for a mosque", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    serviceMock.findAll.mockResolvedValue([{ id: "c1", title: "Test" }]);
    
    const result = await controller.findAll(req);
    expect(result.length).toBe(1);
    expect(serviceMock.findAll).toHaveBeenCalledWith("m1");
  });
});
