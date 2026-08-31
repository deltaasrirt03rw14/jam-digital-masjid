import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "./entities/media.entity";
import { MediaService } from "./media.service";
import { MediaController } from "./media.controller";
import { MosquesModule } from "../mosques/mosques.module";

@Module({
  imports: [TypeOrmModule.forFeature([Media]), MosquesModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [TypeOrmModule, MediaService],
})
export class MediaModule {}
