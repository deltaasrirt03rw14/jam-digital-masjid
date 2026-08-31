import { Module } from "@nestjs/common";
import { SyncService } from "./sync.service";
import { SyncController } from "./sync.controller";
import { MosquesModule } from "../mosques/mosques.module";
import { ContentsModule } from "../contents/contents.module";
import { MediaModule } from "../media/media.module";
import { EventsModule } from "../events/events.module";
import { AuthModule } from "../auth/auth.module";
import { DevicesModule } from "../devices/devices.module";

@Module({
  imports: [
    MosquesModule,
    ContentsModule,
    MediaModule,
    EventsModule,
    AuthModule,
    DevicesModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
