import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Content } from "./entities/content.entity";
import { CreateContentDto, UpdateContentDto } from "./dto/content.dto";
import { MosquesService } from "../mosques/mosques.service";

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly mosquesService: MosquesService,
  ) {}

  async create(mosqueId: string, createContentDto: CreateContentDto): Promise<Content> {
    const mosque = await this.mosquesService.findOne(mosqueId);
    const content = this.contentRepository.create({
      ...createContentDto,
      mosque,
    });
    
    // Increment config version to notify devices of changes
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.contentRepository.save(content);
  }

  async findAll(mosqueId: string): Promise<Content[]> {
    return this.contentRepository.find({
      where: { mosque: { id: mosqueId } },
      order: { created_at: "DESC" },
    });
  }

  async findOne(mosqueId: string, id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id, mosque: { id: mosqueId } },
    });
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found in this mosque`);
    }
    return content;
  }

  async update(mosqueId: string, id: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(mosqueId, id);
    Object.assign(content, updateContentDto);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.contentRepository.save(content);
  }

  async remove(mosqueId: string, id: string): Promise<void> {
    const content = await this.findOne(mosqueId, id);
    await this.contentRepository.remove(content);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
  }
}
