import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { PrayerService } from "./prayer.service";
import { DeviceGuard } from "../auth/guards/device.guard";

@Controller("mosques")
@UseGuards(DeviceGuard)
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  @Get(":mosqueId/prayer-schedules")
  async getSchedule(
    @Param("mosqueId") mosqueId: string,
    @Query("date") date: string,
    @Req() req: any,
  ) {
    if (req.device && req.device.mosque_id !== mosqueId) {
      throw new HttpException(
        "Forbidden: Device is not registered to this mosque",
        HttpStatus.FORBIDDEN,
      );
    }

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new HttpException(
        "Invalid date format. Expected YYYY-MM-DD.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prayerService.getPrayerSchedule(mosqueId, date);
  }
}
