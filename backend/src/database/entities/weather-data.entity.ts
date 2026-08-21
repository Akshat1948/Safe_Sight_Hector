import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HazardLevel, HazardType } from '../../common/interfaces/weather.interface';
import { SiteEntity } from './site.entity';

@Entity('weather_data')
export class WeatherDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => SiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column({ type: 'float', nullable: true })
  humidity: number;

  @Column({ type: 'float', name: 'wind_speed', nullable: true })
  windSpeed: number;

  @Column({ type: 'varchar', length: 10, name: 'wind_direction', nullable: true })
  windDirection: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition: string;

  @Column({ type: 'float', nullable: true })
  precipitation: number;

  @Column({ type: 'float', nullable: true })
  visibility: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'hazard_level',
    enum: HazardLevel,
    default: HazardLevel.NONE,
  })
  hazardLevel: HazardLevel;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'hazard_type',
    nullable: true,
  })
  hazardType: HazardType | null;

  @Column({ type: 'text', nullable: true })
  advisory: string | null;

  @Column({ type: 'jsonb', name: 'forecast_json', nullable: true })
  forecastJson: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'fetched_at' })
  fetchedAt: Date;
}
