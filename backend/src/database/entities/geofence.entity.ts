import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeofenceType } from '../../common/interfaces/zone.interface';
import { ZoneEntity } from './zone.entity';

@Entity('geofences')
export class GeofenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => ZoneEntity, (zone) => zone.geofences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'fence_type',
    default: GeofenceType.BOUNDARY,
  })
  fenceType: GeofenceType;

  @Column({ type: 'jsonb' })
  polygon: GeoJSON.Polygon;

  @Column({ type: 'boolean', name: 'alert_on_entry', default: false })
  alertOnEntry: boolean;

  @Column({ type: 'boolean', name: 'alert_on_exit', default: false })
  alertOnExit: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
