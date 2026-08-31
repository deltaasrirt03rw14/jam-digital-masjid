import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

describe("EventsController", () => {
  let controller: EventsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it("should find all events for a mosque", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    serviceMock.findAll.mockResolvedValue([{ id: "e1", title: "Event 1" }]);
    
    const result = await controller.findAll(req);
    expect(result.length).toBe(1);
    expect(serviceMock.findAll).toHaveBeenCalledWith("m1");
  });
});
