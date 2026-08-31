import { Test, TestingModule } from "@nestjs/testing";
import { EventsService } from "./events.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Event } from "./entities/event.entity";
import { MosquesService } from "../mosques/mosques.service";

describe("EventsService", () => {
  let service: EventsService;
  let repositoryMock: any;
  let mosquesServiceMock: any;

  beforeEach(async () => {
    repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mosquesServiceMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: repositoryMock },
        { provide: MosquesService, useValue: mosquesServiceMock },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it("should create event and increment mosque config_version", async () => {
    mosquesServiceMock.findOne.mockResolvedValue({ id: "m1", config_version: 1 });
    repositoryMock.create.mockReturnValue({ title: "Event 1", mosque: { id: "m1" } });
    repositoryMock.save.mockResolvedValue({ id: "e1", title: "Event 1" });

    const result = await service.create("m1", { title: "Event 1", start_time: new Date() });
    
    expect(mosquesServiceMock.update).toHaveBeenCalled();
    expect(result.id).toBe("e1");
  });
});
