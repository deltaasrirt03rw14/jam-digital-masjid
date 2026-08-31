import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Content } from "./entities/content.entity";
import { ContentsService } from "./contents.service";
import { ContentsController } from "./contents.controller";
import { MosquesModule } from "../mosques/mosques.module";

@Module({
  imports: [TypeOrmModule.forFeature([Content]), MosquesModule],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [TypeOrmModule, ContentsService],
})
export class ContentsModule {}
