import { IsString, IsNumber, IsOptional, IsNotEmpty } from "class-validator";

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsOptional()
  size?: number;
}

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  size?: number;
}
