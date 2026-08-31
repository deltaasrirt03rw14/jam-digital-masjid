import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrayerProvider } from "./prayer-provider.interface";
import { PrayerSchedule } from "../entities/prayer-schedule.entity";
import { PrayerConfig } from "../entities/prayer-config.entity";
import { firstValueFrom } from "rxjs";

@Injectable()
export class MyQuranProvider implements PrayerProvider {
  private readonly logger = new Logger(MyQuranProvider.name);
  private readonly baseUrl = "https://api.myquran.com/v3/sholat/jadwal";

  constructor(private readonly httpService: HttpService) {}

  async getMonthlySchedule(
    mosqueId: string,
    config: PrayerConfig,
    year: number,
    month: number,
  ): Promise<Partial<PrayerSchedule>[]> {
    if (!config.myquran_location_id) {
      throw new HttpException(
        "myQuran location ID is not configured",
        HttpStatus.BAD_REQUEST,
      );
    }

    const monthStr = month.toString().padStart(2, "0");
    const url = `${this.baseUrl}/${config.myquran_location_id}/${year}/${monthStr}`;

    try {
      this.logger.debug(`Fetching from myQuran: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 }),
      );

      const data = response.data;
      if (!data || !data.status || !data.data || !data.data.jadwal) {
        throw new Error("Invalid response format from myQuran API");
      }

      const jadwals = data.data.jadwal;
      const schedules: Partial<PrayerSchedule>[] = [];
      const retrievedAt = new Date();

      if (Array.isArray(jadwals)) {
        for (const entry of jadwals) {
          // If it's an array, it often has a 'date' field YYYY-MM-DD
          const scheduleDate =
            entry.date || this.parseTanggal(entry.tanggal);
          if (scheduleDate) {
            schedules.push(
              this.mapToEntity(mosqueId, scheduleDate, entry, retrievedAt),
            );
          }
        }
      } else if (typeof jadwals === "object") {
        // If it's an object keyed by YYYY-MM-DD
        for (const [dateStr, entry] of Object.entries(jadwals)) {
          schedules.push(
            this.mapToEntity(mosqueId, dateStr, entry, retrievedAt),
          );
        }
      }

      return schedules;
    } catch (error) {
      this.logger.error(`myQuran Provider Error: ${error.message}`);
      throw error;
    }
  }

  private parseTanggal(tanggal: string): string | null {
    // Attempt to parse 'Selasa, 23/06/2026' -> '2026-06-23'
    if (!tanggal) return null;
    const parts = tanggal.split(",");
    if (parts.length > 1) {
      const datePart = parts[1].trim(); // '23/06/2026'
      const [d, m, y] = datePart.split("/");
      if (d && m && y) {
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }
    return null;
  }

  private mapToEntity(
    mosqueId: string,
    scheduleDate: string,
    raw: any,
    retrievedAt: Date,
  ): Partial<PrayerSchedule> {
    return {
      mosque_id: mosqueId,
      schedule_date: scheduleDate,
      imsak: raw.imsak ? `${raw.imsak}:00` : null,
      subuh: raw.subuh ? `${raw.subuh}:00` : null,
      syuruq: raw.terbit ? `${raw.terbit}:00` : null,
      dzuhur: raw.dzuhur ? `${raw.dzuhur}:00` : null,
      ashar: raw.ashar ? `${raw.ashar}:00` : null,
      maghrib: raw.maghrib ? `${raw.maghrib}:00` : null,
      isya: raw.isya ? `${raw.isya}:00` : null,
      source_provider: "myQuran",
      retrieved_at: retrievedAt,
    };
  }
}
