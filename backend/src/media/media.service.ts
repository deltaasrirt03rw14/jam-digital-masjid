import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Media } from "./entities/media.entity";
import { CreateMediaDto, UpdateMediaDto } from "./dto/media.dto";
import { MosquesService } from "../mosques/mosques.service";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly mosquesService: MosquesService,
  ) {}

  async create(mosqueId: string, createMediaDto: CreateMediaDto): Promise<Media> {
    const mosque = await this.mosquesService.findOne(mosqueId);
    const media = this.mediaRepository.create({
      ...createMediaDto,
      mosque,
    });
    
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.mediaRepository.save(media);
  }

  async findAll(mosqueId: string): Promise<Media[]> {
    return this.mediaRepository.find({
      where: { mosque: { id: mosqueId } },
      order: { created_at: "DESC" },
    });
  }

  async findOne(mosqueId: string, id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id, mosque: { id: mosqueId } },
    });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found in this mosque`);
    }
    return media;
  }

  async update(mosqueId: string, id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(mosqueId, id);
    Object.assign(media, updateMediaDto);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.mediaRepository.save(media);
  }

  async remove(mosqueId: string, id: string): Promise<void> {
    const media = await this.findOne(mosqueId, id);
    await this.mediaRepository.remove(media);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
  }
}
