import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { MosquesService } from "./mosques.service";
import { UpdateMosqueDto } from "./dto/update-mosque.dto";
import { AdminAuthGuard } from "../auth/guards/admin.guard";

@Controller("mosques")
@UseGuards(AdminAuthGuard)
export class MosquesController {
  constructor(private readonly mosquesService: MosquesService) {}

  private checkMosqueOwnership(req: any, mosqueId: string) {
    if (req.user.mosque.id !== mosqueId) {
      throw new ForbiddenException("You do not have access to this mosque");
    }
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    this.checkMosqueOwnership(req, id);
    return this.mosquesService.findOne(id);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateMosqueDto: UpdateMosqueDto,
  ) {
    this.checkMosqueOwnership(req, id);
    return this.mosquesService.update(id, updateMosqueDto);
  }
}
