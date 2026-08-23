import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ZoneType } from '../../interfaces/zone.interface';

export class CreateZoneDto {
  @IsUUID(4, { message: 'siteId must be a valid UUID' })
  @IsNotEmpty({ message: 'siteId is required' })
  siteId: string;

  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsEnum(ZoneType, { message: 'zoneType must be a valid ZoneType' })
  @IsNotEmpty({ message: 'zoneType is required' })
  zoneType: ZoneType;

  @IsObject({ message: 'polygon must be a valid GeoJSON Polygon object' })
  @IsNotEmpty({ message: 'polygon is required' })
  polygon: GeoJSON.Polygon;

  @IsNumber()
  @Min(1, { message: 'maxCapacity must be at least 1' })
  maxCapacity: number;
}
