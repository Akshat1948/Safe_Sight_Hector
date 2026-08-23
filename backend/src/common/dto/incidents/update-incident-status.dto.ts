import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateIncidentStatusDto {
  @IsIn(['responding', 'resolved'], { message: 'Status must be either "responding" or "resolved"' })
  @IsNotEmpty({ message: 'Status is required' })
  status: 'responding' | 'resolved';
}
