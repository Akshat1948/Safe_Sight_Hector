import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ZoneType } from '../../interfaces/zone.interface';

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ZoneType)
  @IsOptional()
  zoneType?: ZoneType;

  @IsObject()
  @IsOptional()
  polygon?: GeoJSON.Polygon;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
