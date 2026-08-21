import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { GeofenceType } from '../../interfaces/zone.interface';

export class CreateGeofenceDto {
  @IsUUID(4, { message: 'zoneId must be a valid UUID' })
  @IsNotEmpty({ message: 'zoneId is required' })
  zoneId: string;

  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsEnum(GeofenceType, { message: 'fenceType must be a valid GeofenceType' })
  @IsNotEmpty({ message: 'fenceType is required' })
  fenceType: GeofenceType;

  @IsObject({ message: 'polygon must be a valid GeoJSON Polygon object' })
  @IsNotEmpty({ message: 'polygon is required' })
  polygon: GeoJSON.Polygon;

  @IsBoolean()
  @IsOptional()
  alertOnEntry?: boolean;

  @IsBoolean()
  @IsOptional()
  alertOnExit?: boolean;
}
