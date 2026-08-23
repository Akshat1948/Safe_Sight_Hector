import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DensityStatus, ZoneType } from '../../common/interfaces/zone.interface';
import { SiteEntity } from './site.entity';
import { GeofenceEntity } from './geofence.entity';
import { DensityReadingEntity } from './density-reading.entity';

@Entity('zones')
export class ZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => SiteEntity, (site) => site.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'zone_type',
    default: ZoneType.GENERAL,
  })
  zoneType: ZoneType;

  @Column({ type: 'jsonb' })
  polygon: GeoJSON.Polygon;

  @Column({ type: 'int', name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'int', name: 'current_density', default: 0 })
  currentDensity: number;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'density_status',
    default: DensityStatus.GREEN,
  })
  densityStatus: DensityStatus;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => GeofenceEntity, (geofence) => geofence.zone)
  geofences: GeofenceEntity[];

  @OneToMany(() => DensityReadingEntity, (reading) => reading.zone)
  densityReadings: DensityReadingEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
