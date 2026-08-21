import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSosDto {
  @IsUUID(4)
  @IsOptional()
  siteId?: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
