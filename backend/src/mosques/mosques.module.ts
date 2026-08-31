import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Mosque } from "./entities/mosque.entity";
import { MosquesService } from "./mosques.service";
import { MosquesController } from "./mosques.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Mosque])],
  controllers: [MosquesController],
  providers: [MosquesService],
  exports: [TypeOrmModule, MosquesService],
})
export class MosquesModule {}
