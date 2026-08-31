import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { MosquesModule } from "./mosques/mosques.module";
import { DevicesModule } from "./devices/devices.module";
import { PrayerModule } from "./prayer/prayer.module";
import { ContentsModule } from "./contents/contents.module";
import { MediaModule } from "./media/media.module";
import { EventsModule } from "./events/events.module";
import { SyncModule } from "./sync/sync.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    HealthModule,
    AuthModule,
    MosquesModule,
    DevicesModule,
    PrayerModule,
    ContentsModule,
    MediaModule,
    EventsModule,
    SyncModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
