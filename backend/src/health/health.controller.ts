import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
} from "@nestjs/terminus";

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get("health")
  @HealthCheck()
  checkHealth() {
    return { status: "ok" };
  }

  @Get("ready")
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      () => this.db.pingCheck("database", { timeout: 1000 }),
    ]);
  }
}
