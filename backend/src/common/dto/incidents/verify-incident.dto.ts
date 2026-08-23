import { IsIn, IsNotEmpty } from 'class-validator';

export class VerifyIncidentDto {
  @IsIn(['verify', 'dismiss'], { message: 'Action must be either "verify" or "dismiss"' })
  @IsNotEmpty({ message: 'Action is required' })
  action: 'verify' | 'dismiss';
}
