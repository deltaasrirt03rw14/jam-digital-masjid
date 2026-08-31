import { Test, TestingModule } from "@nestjs/testing";
import { MosquesService } from "./mosques.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Mosque } from "./entities/mosque.entity";

describe("MosquesService", () => {
  let service: MosquesService;
  let repositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MosquesService,
        { provide: getRepositoryToken(Mosque), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<MosquesService>(MosquesService);
  });

  it("should find one mosque", async () => {
    repositoryMock.findOne.mockResolvedValue({ id: "m1", name: "Masjid" });
    const result = await service.findOne("m1");
    expect(result.name).toBe("Masjid");
  });

  it("should update mosque config and increment version", async () => {
    const existingMosque = { id: "m1", config_version: 1, timezone: "Asia/Jakarta" };
    repositoryMock.findOne.mockResolvedValue(existingMosque);
    repositoryMock.save.mockImplementation((m) => Promise.resolve(m));

    const result = await service.update("m1", { timezone: "Asia/Makassar" });
    expect(result.timezone).toBe("Asia/Makassar");
    expect(result.config_version).toBe(2);
  });
});
