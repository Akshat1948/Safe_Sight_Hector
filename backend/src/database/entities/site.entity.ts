import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ZoneEntity } from './zone.entity';

@Entity('sites')
export class SiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'jsonb',
    nullable: false,
    comment: 'GeoJSON Point or coordinates { latitude, longitude }',
  })
  location: { latitude: number; longitude: number } | GeoJSON.Point;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'GeoJSON Polygon for boundary',
  })
  bounds: GeoJSON.Polygon | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'site_type',
    default: 'pilgrimage',
  })
  siteType: 'pilgrimage' | 'eco_tourism' | 'mixed';

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ZoneEntity, (zone) => zone.site)
  zones: ZoneEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
