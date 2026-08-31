import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Device } from "../../devices/entities/device.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Bearer token");
    }

    const apiKey = authHeader.substring(7);
    const deviceId = request.params.deviceId || request.headers['x-device-id'];

    if (!deviceId) {
      throw new UnauthorizedException("Device ID is required in URL or X-Device-Id header");
    }

    const device = await this.devicesRepository.findOne({
      where: { device_identifier: deviceId },
    });
    console.log(
      "DeviceGuard deviceId:",
      deviceId,
      "found device:",
      device ? device.id : null,
    );

    if (!device) {
      throw new UnauthorizedException("Invalid device");
    }

    if (device.status === "REVOKED") {
      throw new UnauthorizedException("Device is revoked");
    }

    const isMatch = await bcrypt.compare(apiKey, device.api_key_hash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid API Key");
    }

    if (device.status === "DISABLED") {
      throw new ForbiddenException("Device is disabled");
    }

    // Attach device to request for subsequent use
    request.device = device;
    return true;
  }
}
