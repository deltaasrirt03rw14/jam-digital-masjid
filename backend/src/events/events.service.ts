import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Event } from "./entities/event.entity";
import { CreateEventDto, UpdateEventDto } from "./dto/event.dto";
import { MosquesService } from "../mosques/mosques.service";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly mosquesService: MosquesService,
  ) {}

  async create(mosqueId: string, createEventDto: CreateEventDto): Promise<Event> {
    const mosque = await this.mosquesService.findOne(mosqueId);
    const event = this.eventRepository.create({
      ...createEventDto,
      mosque,
    });
    
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.eventRepository.save(event);
  }

  async findAll(mosqueId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { mosque: { id: mosqueId } },
      order: { start_time: "ASC" },
    });
  }

  async findOne(mosqueId: string, id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, mosque: { id: mosqueId } },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found in this mosque`);
    }
    return event;
  }

  async update(mosqueId: string, id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(mosqueId, id);
    Object.assign(event, updateEventDto);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
    
    return this.eventRepository.save(event);
  }

  async remove(mosqueId: string, id: string): Promise<void> {
    const event = await this.findOne(mosqueId, id);
    await this.eventRepository.remove(event);
    
    const mosque = await this.mosquesService.findOne(mosqueId);
    mosque.config_version += 1;
    await this.mosquesService.update(mosque.id, mosque);
  }
}
