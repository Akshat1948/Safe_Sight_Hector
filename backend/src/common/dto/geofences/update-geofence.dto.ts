import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { GeofenceType } from '../../interfaces/zone.interface';

export class UpdateGeofenceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(GeofenceType)
  @IsOptional()
  fenceType?: GeofenceType;

  @IsObject()
  @IsOptional()
  polygon?: GeoJSON.Polygon;

  @IsBoolean()
  @IsOptional()
  alertOnEntry?: boolean;

  @IsBoolean()
  @IsOptional()
  alertOnExit?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
