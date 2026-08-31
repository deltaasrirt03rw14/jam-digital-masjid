import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { MediaService } from "./media.service";
import { CreateMediaDto, UpdateMediaDto } from "./dto/media.dto";
import { AdminAuthGuard } from "../auth/guards/admin.guard";

@Controller("media")
@UseGuards(AdminAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  private getMosqueId(req: any): string {
    return req.user.mosque.id;
  }

  @Post()
  create(@Request() req: any, @Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(this.getMosqueId(req), createMediaDto);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|mp4|webm)$/)) {
          return cb(new BadRequestException("Only images and videos are allowed!"), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const url = `/uploads/${file.filename}`;
    const createMediaDto: CreateMediaDto = {
      filename: file.filename,
      mime_type: file.mimetype,
      url: url,
      size: file.size,
    };

    return this.mediaService.create(this.getMosqueId(req), createMediaDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.mediaService.findAll(this.getMosqueId(req));
  }

  @Get(":id")
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.mediaService.findOne(this.getMosqueId(req), id);
  }

  @Put(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(this.getMosqueId(req), id, updateMediaDto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.mediaService.remove(this.getMosqueId(req), id);
  }
}
