import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DevicesService } from "./devices.service";
import { DevicesController } from "./devices.controller";
import { AdminDevicesController } from "./admin-devices.controller";
import { Device } from "./entities/device.entity";
import { DevicePairingToken } from "./entities/device-pairing-token.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DevicePairingToken, Mosque]),
    AuthModule,
  ],
  controllers: [DevicesController, AdminDevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
