import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PrayerSchedule } from "./entities/prayer-schedule.entity";
import { PrayerConfig } from "./entities/prayer-config.entity";
import { MyQuranProvider } from "./providers/myquran.provider";
import { EQuranProvider } from "./providers/equran.provider";

@Injectable()
export class PrayerService {
  private readonly logger = new Logger(PrayerService.name);

  constructor(
    @InjectRepository(PrayerSchedule)
    private readonly scheduleRepo: Repository<PrayerSchedule>,
    @InjectRepository(PrayerConfig)
    private readonly configRepo: Repository<PrayerConfig>,
    private readonly myQuranProvider: MyQuranProvider,
    private readonly eQuranProvider: EQuranProvider,
  ) {}

  async getPrayerSchedule(
    mosqueId: string,
    dateStr: string,
  ): Promise<PrayerSchedule> {
    // 1. Cek DB cache
    let schedule = await this.scheduleRepo.findOne({
      where: { mosque_id: mosqueId, schedule_date: dateStr },
    });

    if (schedule) {
      this.logger.debug(`Cache hit for ${mosqueId} on ${dateStr}`);
      return schedule;
    }

    this.logger.debug(
      `Cache miss for ${mosqueId} on ${dateStr}. Fetching from providers...`,
    );

    // 2. Load Config
    const config = await this.configRepo.findOne({
      where: { mosque_id: mosqueId },
    });
    if (!config) {
      throw new HttpException(
        "Prayer configuration not found for this mosque",
        HttpStatus.NOT_FOUND,
      );
    }

    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw new HttpException(
        "Invalid date format. Expected YYYY-MM-DD.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    let newSchedules: Partial<PrayerSchedule>[] = [];

    // 3. Try Primary
    try {
      newSchedules = await this.myQuranProvider.getMonthlySchedule(
        mosqueId,
        config,
        year,
        month,
      );
    } catch (error) {
      this.logger.warn(
        `Primary provider (myQuran) failed: ${error.message}. Falling back to EQuran...`,
      );
      // 4. Try Secondary
      try {
        newSchedules = await this.eQuranProvider.getMonthlySchedule(
          mosqueId,
          config,
          year,
          month,
        );
      } catch (fallbackError) {
        this.logger.error(
          `Secondary provider (EQuran) failed: ${fallbackError.message}`,
        );
        throw new HttpException(
          "Bad Gateway: Unable to fetch schedule from any provider",
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    if (newSchedules.length === 0) {
      throw new HttpException(
        "Provider returned empty schedule",
        HttpStatus.BAD_GATEWAY,
      );
    }

    // 5. Save all schedules for the month using upsert
    await this.scheduleRepo.upsert(newSchedules, [
      "mosque_id",
      "schedule_date",
    ]);

    // 6. Fetch again from DB
    schedule = await this.scheduleRepo.findOne({
      where: { mosque_id: mosqueId, schedule_date: dateStr },
    });

    if (!schedule) {
      throw new HttpException(
        "Failed to save or retrieve schedule after fetching",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return schedule;
  }
}
