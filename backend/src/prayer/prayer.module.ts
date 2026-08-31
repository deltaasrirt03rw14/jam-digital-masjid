import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { PrayerConfig } from "./entities/prayer-config.entity";
import { PrayerSchedule } from "./entities/prayer-schedule.entity";
import { PrayerService } from "./prayer.service";
import { PrayerController } from "./prayer.controller";
import { MyQuranProvider } from "./providers/myquran.provider";
import { EQuranProvider } from "./providers/equran.provider";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Device } from "../devices/entities/device.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([PrayerConfig, PrayerSchedule, Mosque, Device]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [PrayerController],
  providers: [PrayerService, MyQuranProvider, EQuranProvider],
  exports: [PrayerService],
})
export class PrayerModule {}
