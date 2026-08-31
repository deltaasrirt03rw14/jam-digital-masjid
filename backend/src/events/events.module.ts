import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "./entities/event.entity";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";
import { MosquesModule } from "../mosques/mosques.module";

@Module({
  imports: [TypeOrmModule.forFeature([Event]), MosquesModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [TypeOrmModule, EventsService],
})
export class EventsModule {}
