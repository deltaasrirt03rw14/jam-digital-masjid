import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Device } from "./entities/device.entity";
import { DevicePairingToken } from "./entities/device-pairing-token.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(DevicePairingToken)
    private pairingTokensRepository: Repository<DevicePairingToken>,
    @InjectRepository(Mosque)
    private mosquesRepository: Repository<Mosque>,
    private dataSource: DataSource,
  ) {}

  async generatePairingToken(
    mosqueId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const mosque = await this.mosquesRepository.findOne({
      where: { id: mosqueId },
    });
    if (!mosque) {
      throw new BadRequestException("Mosque not found");
    }

    // Generate 6-digit numeric PIN
    const token = crypto.randomInt(100000, 999999).toString();
    const tokenHash = await bcrypt.hash(token, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

    const pairingToken = this.pairingTokensRepository.create({
      mosque_id: mosqueId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    await this.pairingTokensRepository.save(pairingToken);

    return { token, expiresAt };
  }

  async pairDevice(
    deviceIdentifier: string,
    token: string,
    deviceName?: string,
  ): Promise<{ apiKey: string; mosqueId: string }> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Locate pairing tokens that are not used and not expired
      // Note: In a real app we might need the mosqueId to find the right token quickly,
      // but if the token is globally unique (or we check all active tokens), it's fine.
      // Since it's a 6-digit PIN, it might collide across mosques, so ideally the request would include mosqueId.
      // However, the spec says POST /devices/pair Request conceptually contains: deviceIdentifier, pairing token/PIN, optional device name.
      // So we have to search across all unused, unexpired tokens.
      // Because we use bcrypt, we cannot query by `token_hash` directly! We must fetch all active tokens and compare.
      // Since there shouldn't be many active tokens at any given time, this is acceptable.

      const activeTokens = await manager
        .createQueryBuilder(DevicePairingToken, "token")
        .where("token.used_at IS NULL")
        .andWhere("token.expires_at > :now", { now: new Date() })
        .setLock("pessimistic_write") // 2. Lock tokens to prevent concurrent consumption
        .getMany();

      let matchedToken: DevicePairingToken | null = null;
      for (const t of activeTokens) {
        if (await bcrypt.compare(token, t.token_hash)) {
          matchedToken = t;
          break;
        }
      }

      if (!matchedToken) {
        throw new BadRequestException(
          "Invalid, expired, or already used pairing token",
        );
      }

      // 5. Verify device_identifier uniqueness
      const existingDevice = await manager.findOne(Device, {
        where: { device_identifier: deviceIdentifier },
      });
      if (existingDevice) {
        throw new ConflictException("Device identifier already registered");
      }

      // 6. Generate a cryptographically secure 256-bit Device API Key
      const apiKey = crypto.randomBytes(32).toString("hex");

      // 7. Hash the API Key with bcrypt
      const apiKeyHash = await bcrypt.hash(apiKey, 10);

      // 8. Create the Device record
      const device = manager.create(Device, {
        device_identifier: deviceIdentifier,
        mosque_id: matchedToken.mosque_id,
        name: deviceName || null,
        status: "ACTIVE",
        api_key_hash: apiKeyHash,
      });

      await manager.save(device);

      // 9. Mark pairing token used
      matchedToken.used_at = new Date();
      await manager.save(matchedToken);

      // 10. Commit atomically (handled by transaction manager)
      return { apiKey, mosqueId: matchedToken.mosque_id };
    });
  }

  async processHeartbeat(
    deviceId: string,
  ): Promise<{ configVersion: number; syncRequired: boolean }> {
    // deviceId is validated in DeviceGuard
    const device = await this.devicesRepository.findOne({
      where: { device_identifier: deviceId },
      relations: ["mosque"],
    });

    if (!device) {
      throw new BadRequestException("Device not found");
    }

    device.last_heartbeat_at = new Date();
    await this.devicesRepository.save(device);

    return {
      configVersion: device.mosque.config_version,
      syncRequired: false, // sync not implemented yet
    };
  }

  async findAllForMosque(mosqueId: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { mosque_id: mosqueId },
      order: { created_at: "DESC" },
    });
  }

  async removeDevice(mosqueId: string, id: string): Promise<void> {
    const device = await this.devicesRepository.findOne({
      where: { id, mosque_id: mosqueId },
    });
    if (!device) throw new BadRequestException("Device not found");
    
    await this.devicesRepository.remove(device);
  }

  async revokeDevice(mosqueId: string, id: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id, mosque_id: mosqueId },
    });
    if (!device) throw new BadRequestException("Device not found");
    
    device.status = "REVOKED";
    device.revoked_at = new Date();
    return this.devicesRepository.save(device);
  }
}
