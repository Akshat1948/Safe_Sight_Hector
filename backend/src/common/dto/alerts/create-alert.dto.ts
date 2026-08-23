import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AlertChannel, AlertSeverity } from '../../interfaces/alert.interface';

export class CreateAlertDto {
  @IsUUID(4)
  @IsOptional()
  incidentId?: string;

  @IsUUID(4)
  @IsNotEmpty()
  siteId: string;

  @IsUUID(4)
  @IsOptional()
  targetZoneId?: string;

  @IsEnum(AlertSeverity)
  @IsNotEmpty()
  severity: AlertSeverity;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsEnum(AlertChannel, { each: true })
  @IsOptional()
  channels?: AlertChannel[];
}
