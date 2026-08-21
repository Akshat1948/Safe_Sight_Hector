import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  AlertChannel,
  AlertSeverity,
  AlertStatus,
} from '../../common/interfaces/alert.interface';
import { IncidentEntity } from './incident.entity';
import { SiteEntity } from './site.entity';
import { ZoneEntity } from './zone.entity';
import { UserEntity } from './user.entity';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'incident_id', nullable: true })
  incidentId: string | null;

  @ManyToOne(() => IncidentEntity, (inc) => inc.alerts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'incident_id' })
  incident: IncidentEntity | null;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => SiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Column({ type: 'uuid', name: 'target_zone_id', nullable: true })
  targetZoneId: string | null;

  @ManyToOne(() => ZoneEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_zone_id' })
  targetZone: ZoneEntity | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
  })
  severity: AlertSeverity;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', name: 'message_hi', nullable: true })
  messageHi: string | null;

  @Column({
    type: 'text',
    array: true,
    default: () => "ARRAY['push']::text[]",
  })
  channels: AlertChannel[];

  @Column({
    type: 'varchar',
    length: 20,
    enum: AlertStatus,
    default: AlertStatus.DISPATCHED,
  })
  status: AlertStatus;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @Column({ type: 'uuid', name: 'acknowledged_by', nullable: true })
  acknowledgedBy: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledger: UserEntity | null;

  @Column({ type: 'timestamptz', name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'escalated_at', nullable: true })
  escalatedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
