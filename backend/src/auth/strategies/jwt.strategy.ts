import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "../entities/admin-user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt-admin") {
  constructor(
    private configService: ConfigService,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "secret",
    });
  }

  async validate(payload: any) {
    const admin = await this.adminUserRepository.findOne({
      where: { id: payload.sub },
      relations: ["mosque"],
    });

    if (!admin) {
      throw new UnauthorizedException();
    }

    return admin;
  }
}
