import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ZoneEntity } from './zone.entity';

@Entity('density_readings')
@Index(['zoneId', 'recordedAt'])
export class DensityReadingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => ZoneEntity, (zone) => zone.densityReadings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity;

  @Column({ type: 'int' })
  headcount: number;

  @Column({ type: 'float', name: 'flow_rate', nullable: true })
  flowRate: number | null;

  @Column({ type: 'float', name: 'flow_velocity', nullable: true })
  flowVelocity: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'sensor',
  })
  source: 'sensor' | 'simulation' | 'manual';

  @CreateDateColumn({ type: 'timestamptz', name: 'recorded_at' })
  recordedAt: Date;
}
