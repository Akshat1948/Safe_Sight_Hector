import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransportStatus, TransportType } from '../../common/interfaces/transport.interface';
import { SiteEntity } from './site.entity';

@Entity('transport_status')
export class TransportStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => SiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'transport_type',
    enum: TransportType,
    default: TransportType.PARKING,
  })
  transportType: TransportType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', name: 'total_capacity', nullable: true })
  totalCapacity: number | null;

  @Column({ type: 'int', name: 'current_occupancy', default: 0 })
  currentOccupancy: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: TransportStatus,
    default: TransportStatus.OPERATIONAL,
  })
  status: TransportStatus;

  @Column({ type: 'timestamptz', name: 'next_departure', nullable: true })
  nextDeparture: Date | null;

  @Column({ type: 'text', name: 'route_info', nullable: true })
  routeInfo: string | null;

  @Column({ type: 'jsonb', nullable: true })
  location: { latitude: number; longitude: number } | GeoJSON.Point | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
