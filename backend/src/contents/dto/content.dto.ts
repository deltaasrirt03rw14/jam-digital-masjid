import { IsString, IsEnum, IsOptional, IsNotEmpty } from "class-validator";
import { ContentType, ContentStatus } from "../entities/content.entity";

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @IsString()
  @IsOptional()
  scheduling?: string;

  @IsOptional()
  content_data?: any;
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @IsString()
  @IsOptional()
  scheduling?: string;

  @IsOptional()
  content_data?: any;
}
