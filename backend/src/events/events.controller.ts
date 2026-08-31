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
} from "@nestjs/common";
import { EventsService } from "./events.service";
import { CreateEventDto, UpdateEventDto } from "./dto/event.dto";
import { AdminAuthGuard } from "../auth/guards/admin.guard";

@Controller("events")
@UseGuards(AdminAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  private getMosqueId(req: any): string {
    return req.user.mosque.id;
  }

  @Post()
  create(@Request() req: any, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(this.getMosqueId(req), createEventDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.eventsService.findAll(this.getMosqueId(req));
  }

  @Get(":id")
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.eventsService.findOne(this.getMosqueId(req), id);
  }

  @Put(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(this.getMosqueId(req), id, updateEventDto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.eventsService.remove(this.getMosqueId(req), id);
  }
}
