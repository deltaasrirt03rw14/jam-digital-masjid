import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Headers,
} from "@nestjs/common";
import { Response } from "express";
import { SyncService } from "./sync.service";
import { DeviceGuard } from "../auth/guards/device.guard";

@Controller("devices")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get(":deviceId/sync")
  @UseGuards(DeviceGuard)
  async sync(
    @Request() req: any,
    @Res() res: Response,
    @Headers("if-none-match") ifNoneMatch?: string,
  ) {
    const device = req.device;
    const syncData = await this.syncService.getSyncData(device.mosque_id);

    const etag = `W/"${syncData.mosque.config_version}"`;

    res.setHeader("ETag", etag);

    if (ifNoneMatch === etag) {
      return res.status(HttpStatus.NOT_MODIFIED).send();
    }

    return res.status(HttpStatus.OK).json(syncData);
  }
}
