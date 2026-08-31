import { Test, TestingModule } from "@nestjs/testing";
import { SyncService } from "./sync.service";
import { MosquesService } from "../mosques/mosques.service";
import { ContentsService } from "../contents/contents.service";
import { MediaService } from "../media/media.service";
import { EventsService } from "../events/events.service";

describe("SyncService", () => {
  let service: SyncService;
  let mosquesServiceMock: any;
  let contentsServiceMock: any;
  let mediaServiceMock: any;
  let eventsServiceMock: any;

  beforeEach(async () => {
    mosquesServiceMock = { findOne: jest.fn() };
    contentsServiceMock = { findAll: jest.fn() };
    mediaServiceMock = { findAll: jest.fn() };
    eventsServiceMock = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: MosquesService, useValue: mosquesServiceMock },
        { provide: ContentsService, useValue: contentsServiceMock },
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: EventsService, useValue: eventsServiceMock },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  it("should compile sync data successfully", async () => {
    mosquesServiceMock.findOne.mockResolvedValue({ id: "m1", config_version: 2 });
    contentsServiceMock.findAll.mockResolvedValue([]);
    mediaServiceMock.findAll.mockResolvedValue([]);
    eventsServiceMock.findAll.mockResolvedValue([]);

    const result = await service.getSyncData("m1");
    expect(result.mosque.config_version).toBe(2);
    expect(result.contents).toEqual([]);
  });
});
