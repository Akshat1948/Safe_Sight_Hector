import { IsIn, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateDensityDto {
  @IsNumber()
  @Min(0, { message: 'headcount cannot be negative' })
  @IsNotEmpty({ message: 'headcount is required' })
  headcount: number;

  @IsNumber()
  @IsOptional()
  flowRate?: number;

  @IsNumber()
  @IsOptional()
  flowVelocity?: number;

  @IsIn(['sensor', 'simulation', 'manual'])
  @IsOptional()
  source?: 'sensor' | 'simulation' | 'manual';
}
