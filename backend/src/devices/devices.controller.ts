import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import { DevicesService } from "./devices.service";
import { DeviceGuard } from "../auth/guards/device.guard";
import { Throttle } from "@nestjs/throttler";
import { IsString, IsOptional, IsUUID } from "class-validator";

class PairDeviceDto {
  @IsUUID()
  deviceIdentifier: string;

  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

@Controller("devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post("pair")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 mins (900000 ms)
  async pairDevice(@Body() pairDeviceDto: PairDeviceDto) {
    return this.devicesService.pairDevice(
      pairDeviceDto.deviceIdentifier,
      pairDeviceDto.token,
      pairDeviceDto.deviceName,
    );
  }

  @Post(":deviceId/heartbeat")
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  async heartbeat(@Param("deviceId") deviceId: string) {
    return this.devicesService.processHeartbeat(deviceId);
  }
}
