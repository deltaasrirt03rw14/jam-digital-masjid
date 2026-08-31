import { Test, TestingModule } from "@nestjs/testing";
import { MediaService } from "./media.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Media } from "./entities/media.entity";
import { MosquesService } from "../mosques/mosques.service";

describe("MediaService", () => {
  let service: MediaService;
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
        MediaService,
        { provide: getRepositoryToken(Media), useValue: repositoryMock },
        { provide: MosquesService, useValue: mosquesServiceMock },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it("should create media and increment mosque config_version", async () => {
    mosquesServiceMock.findOne.mockResolvedValue({ id: "m1", config_version: 1 });
    repositoryMock.create.mockReturnValue({ filename: "test.jpg", mosque: { id: "m1" } });
    repositoryMock.save.mockResolvedValue({ id: "med1", filename: "test.jpg" });

    const result = await service.create("m1", { filename: "test.jpg", mime_type: "image/jpeg", url: "http://test" });
    
    expect(mosquesServiceMock.update).toHaveBeenCalled();
    expect(result.id).toBe("med1");
  });
});
