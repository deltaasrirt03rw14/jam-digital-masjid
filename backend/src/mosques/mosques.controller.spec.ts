import { Test, TestingModule } from "@nestjs/testing";
import { MosquesController } from "./mosques.controller";
import { MosquesService } from "./mosques.service";
import { ForbiddenException } from "@nestjs/common";

describe("MosquesController", () => {
  let controller: MosquesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MosquesController],
      providers: [{ provide: MosquesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MosquesController>(MosquesController);
  });

  it("should throw ForbiddenException if user mosqueId does not match", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    await expect(controller.findOne(req, "m2")).rejects.toThrow(ForbiddenException);
  });

  it("should return mosque if user mosqueId matches", async () => {
    const req = { user: { mosque: { id: "m1" } } };
    serviceMock.findOne.mockResolvedValue({ id: "m1", name: "Masjid" });
    const result = await controller.findOne(req, "m1");
    expect(result.name).toBe("Masjid");
  });
});
