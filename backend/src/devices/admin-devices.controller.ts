import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { DevicesService } from "./devices.service";
import { AdminAuthGuard } from "../auth/guards/admin.guard";

@Controller("admin/devices")
@UseGuards(AdminAuthGuard)
export class AdminDevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  private getMosqueId(req: any): string {
    return req.user.mosque.id;
  }

  @Get()
  findAll(@Request() req: any) {
    return this.devicesService.findAllForMosque(this.getMosqueId(req));
  }

  @Post("token")
  generateToken(@Request() req: any) {
    return this.devicesService.generatePairingToken(this.getMosqueId(req));
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.devicesService.removeDevice(this.getMosqueId(req), id);
  }

  @Post(":id/revoke")
  revoke(@Request() req: any, @Param("id") id: string) {
    return this.devicesService.revokeDevice(this.getMosqueId(req), id);
  }
}
