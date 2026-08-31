import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Mosque } from "./entities/mosque.entity";
import { UpdateMosqueDto } from "./dto/update-mosque.dto";

@Injectable()
export class MosquesService {
  constructor(
    @InjectRepository(Mosque)
    private readonly mosqueRepository: Repository<Mosque>,
  ) {}

  async findOne(id: string): Promise<Mosque> {
    const mosque = await this.mosqueRepository.findOne({ where: { id } });
    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${id} not found`);
    }
    return mosque;
  }

  async update(id: string, updateMosqueDto: UpdateMosqueDto): Promise<Mosque> {
    const mosque = await this.findOne(id);
    
    Object.assign(mosque, updateMosqueDto);
    mosque.config_version += 1; // Increment config version on update
    
    return this.mosqueRepository.save(mosque);
  }
}
