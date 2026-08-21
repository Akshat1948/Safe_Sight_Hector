import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {
  DetectionSource,
  IncidentStatus,
  IncidentType,
  Severity,
} from '../../common/interfaces/incident.interface';
import { SiteEntity } from './site.entity';
import { ZoneEntity } from './zone.entity';
import { UserEntity } from './user.entity';
import { AlertEntity } from './alert.entity';

@Entity('incidents')
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => SiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Column({ type: 'uuid', name: 'zone_id', nullable: true })
  zoneId: string | null;

  @ManyToOne(() => ZoneEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'incident_type',
  })
  incidentType: IncidentType;

  @Column({
    type: 'varchar',
    length: 10,
    enum: Severity,
    default: Severity.MEDIUM,
  })
  severity: Severity;

  @Column({
    type: 'varchar',
    length: 20,
    enum: IncidentStatus,
    default: IncidentStatus.FLAGGED,
  })
  status: IncidentStatus;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  location: { latitude: number; longitude: number } | GeoJSON.Point | null;

  @Column({ type: 'float', name: 'confidence_score', nullable: true })
  confidenceScore: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'detection_source',
    enum: DetectionSource,
    default: DetectionSource.AI,
  })
  detectionSource: DetectionSource;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier: UserEntity | null;

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;

  @OneToMany(() => AlertEntity, (alert) => alert.incident)
  alerts: AlertEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
