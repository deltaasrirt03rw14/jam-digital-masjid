import { PrayerSchedule } from "../entities/prayer-schedule.entity";
import { PrayerConfig } from "../entities/prayer-config.entity";

export interface PrayerProvider {
  /**
   * Retrieves the prayer schedule for the given month and year.
   * Returns an array of PrayerSchedule objects.
   */
  getMonthlySchedule(
    mosqueId: string,
    config: PrayerConfig,
    year: number,
    month: number,
  ): Promise<Partial<PrayerSchedule>[]>;
}
