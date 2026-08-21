import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SosStatus } from '../../common/interfaces/sos.interface';
import { SiteEntity } from './site.entity';
import { UserEntity } from './user.entity';

@Entity('sos_requests')
export class SosRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id', nullable: true })
  siteId: string | null;

  @ManyToOne(() => SiteEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity | null;

  @Column({ type: 'jsonb', nullable: true })
  location: { latitude: number; longitude: number } | GeoJSON.Point | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 20, name: 'contact_phone', nullable: true })
  contactPhone: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: SosStatus,
    default: SosStatus.PENDING,
  })
  status: SosStatus;

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignee: UserEntity | null;

  @Column({ type: 'varchar', length: 255, name: 'session_token', nullable: true })
  sessionToken: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
