import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TransportStatus } from '../../interfaces/transport.interface';

export class UpdateTransportDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentOccupancy?: number;

  @IsEnum(TransportStatus)
  @IsOptional()
  status?: TransportStatus;

  @IsDateString()
  @IsOptional()
  nextDeparture?: string;
}
