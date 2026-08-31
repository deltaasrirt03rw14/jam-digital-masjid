import { Injectable, UnauthorizedException, Logger, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { AdminUser } from "./entities/admin-user.entity";
import { Mosque } from "../mosques/entities/mosque.entity";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Mosque)
    private readonly mosqueRepository: Repository<Mosque>,
  ) {}

  async onModuleInit() {
    await this.seedInitialAdmin();
  }

  private async seedInitialAdmin() {
    const adminCount = await this.adminUserRepository.count();
    if (adminCount > 0) {
      return;
    }

    const email = this.configService.get<string>("INITIAL_ADMIN_EMAIL");
    const password = this.configService.get<string>("INITIAL_ADMIN_PASSWORD");

    if (!email || !password) {
      this.logger.warn("INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping initial admin creation.");
      return;
    }

    let mosque = await this.mosqueRepository.findOne({ where: {} });
    if (!mosque) {
      // Create default mosque if none exists
      mosque = this.mosqueRepository.create({
        name: "Default Mosque",
      });
      await this.mosqueRepository.save(mosque);
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = this.adminUserRepository.create({
      email,
      password_hash: passwordHash,
      mosque,
    });

    await this.adminUserRepository.save(admin);
    this.logger.log(`Initial admin created for email: ${email}`);
  }

  async login(email: string, pass: string) {
    const user = await this.adminUserRepository.findOne({
      where: { email },
      relations: ["mosque"],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email, mosqueId: user.mosque.id };
    return {
      access_token: this.jwtService.sign(payload),
      mosque_id: user.mosque.id,
      email: user.email,
    };
  }
}
