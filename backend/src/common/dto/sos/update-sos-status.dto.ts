import { IsEnum, IsNotEmpty } from 'class-validator';
import { SosStatus } from '../../interfaces/sos.interface';

export class UpdateSosStatusDto {
  @IsEnum(SosStatus)
  @IsNotEmpty()
  status: SosStatus;
}
