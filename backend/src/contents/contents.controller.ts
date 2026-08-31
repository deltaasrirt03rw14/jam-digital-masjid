import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { ContentsService } from "./contents.service";
import { CreateContentDto, UpdateContentDto } from "./dto/content.dto";
import { AdminAuthGuard } from "../auth/guards/admin.guard";

@Controller("contents")
@UseGuards(AdminAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  private getMosqueId(req: any): string {
    return req.user.mosque.id;
  }

  @Post()
  create(@Request() req: any, @Body() createContentDto: CreateContentDto) {
    return this.contentsService.create(this.getMosqueId(req), createContentDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.contentsService.findAll(this.getMosqueId(req));
  }

  @Get(":id")
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.contentsService.findOne(this.getMosqueId(req), id);
  }

  @Put(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentsService.update(this.getMosqueId(req), id, updateContentDto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.contentsService.remove(this.getMosqueId(req), id);
  }
}
