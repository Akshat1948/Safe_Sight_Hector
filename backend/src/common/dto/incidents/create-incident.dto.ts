import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { DetectionSource, IncidentType, Severity } from '../../interfaces/incident.interface';

export class CreateIncidentDto {
  @IsUUID(4)
  @IsNotEmpty()
  siteId: string;

  @IsUUID(4)
  @IsOptional()
  zoneId?: string;

  @IsEnum(IncidentType)
  @IsNotEmpty()
  incidentType: IncidentType;

  @IsEnum(Severity)
  @IsNotEmpty()
  severity: Severity;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  location?: { latitude: number; longitude: number } | GeoJSON.Point;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidenceScore?: number;

  @IsEnum(DetectionSource)
  @IsOptional()
  detectionSource?: DetectionSource;
}
