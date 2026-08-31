import { Module } from "@nestjs/common";
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike("JamDigitalMasjid", {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
  ],
})
export class LoggerModule {}
