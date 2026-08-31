import { Test, TestingModule } from "@nestjs/testing";
import { ContentsService } from "./contents.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Content, ContentType, ContentStatus } from "./entities/content.entity";
import { MosquesService } from "../mosques/mosques.service";

describe("ContentsService", () => {
  let service: ContentsService;
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
        ContentsService,
        { provide: getRepositoryToken(Content), useValue: repositoryMock },
        { provide: MosquesService, useValue: mosquesServiceMock },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
  });

  it("should create content and increment mosque config_version", async () => {
    mosquesServiceMock.findOne.mockResolvedValue({ id: "m1", config_version: 1 });
    repositoryMock.create.mockReturnValue({ title: "Test", mosque: { id: "m1" } });
    repositoryMock.save.mockResolvedValue({ id: "c1", title: "Test" });

    const result = await service.create("m1", { title: "Test", type: ContentType.TEXT });
    
    expect(mosquesServiceMock.update).toHaveBeenCalled();
    expect(result.id).toBe("c1");
  });
});
