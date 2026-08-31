import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrayerProvider } from "./prayer-provider.interface";
import { PrayerSchedule } from "../entities/prayer-schedule.entity";
import { PrayerConfig } from "../entities/prayer-config.entity";
import { firstValueFrom } from "rxjs";

@Injectable()
export class EQuranProvider implements PrayerProvider {
  private readonly logger = new Logger(EQuranProvider.name);
  private readonly baseUrl = "https://equran.id/api/v2/shalat";

  constructor(private readonly httpService: HttpService) {}

  async getMonthlySchedule(
    mosqueId: string,
    config: PrayerConfig,
    year: number,
    month: number,
  ): Promise<Partial<PrayerSchedule>[]> {
    if (!config.equran_provinsi || !config.equran_kabkota) {
      throw new HttpException(
        "EQuran location configuration is missing",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.debug(`Fetching from EQuran for ${config.equran_kabkota}`);
      const payload = {
        provinsi: config.equran_provinsi,
        kabkota: config.equran_kabkota,
        bulan: month,
        tahun: year,
      };

      const response = await firstValueFrom(
        this.httpService.post(this.baseUrl, payload, { timeout: 5000 }),
      );

      const data = response.data;
      if (!data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from EQuran API");
      }

      const jadwals = data.data;
      const schedules: Partial<PrayerSchedule>[] = [];
      const retrievedAt = new Date();

      for (const entry of jadwals) {
        const dateStr = entry.date || this.parseTanggal(entry.tanggal);
        if (dateStr) {
          schedules.push({
            mosque_id: mosqueId,
            schedule_date: dateStr,
            imsak: entry.imsak ? `${entry.imsak}:00` : null,
            subuh: entry.subuh ? `${entry.subuh}:00` : null,
            syuruq: entry.terbit ? `${entry.terbit}:00` : null,
            dzuhur: entry.dzuhur ? `${entry.dzuhur}:00` : null,
            ashar: entry.ashar ? `${entry.ashar}:00` : null,
            maghrib: entry.maghrib ? `${entry.maghrib}:00` : null,
            isya: entry.isya ? `${entry.isya}:00` : null,
            source_provider: "EQuran",
            retrieved_at: retrievedAt,
          });
        }
      }

      return schedules;
    } catch (error) {
      this.logger.error(`EQuran Provider Error: ${error.message}`);
      throw error;
    }
  }

  private parseTanggal(tanggal: string): string | null {
    if (!tanggal) return null;
    const parts = tanggal.split(",");
    if (parts.length > 1) {
      const datePart = parts[1].trim();
      const [d, m, y] = datePart.split("/");
      if (d && m && y) {
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }
    if (tanggal.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return tanggal;
    }
    return null;
  }
}
