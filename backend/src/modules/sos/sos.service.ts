import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosRequestEntity } from '../../database/entities';
import { CreateSosDto, UpdateSosStatusDto } from '../../common/dto';
import { SafeSightGateway } from '../../gateway/safesight.gateway';
import { IncidentsService } from '../incidents/incidents.service';
import { SosStatus, IncidentType, Severity, DetectionSource } from '../../common/interfaces';
import { IUser } from '../../common/interfaces';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);

  constructor(
    @InjectRepository(SosRequestEntity)
    private readonly sosRepository: Repository<SosRequestEntity>,
    private readonly gateway: SafeSightGateway,
    private readonly incidentsService: IncidentsService,
  ) {}

  async createSos(dto: CreateSosDto) {
    const sosRequest = this.sosRepository.create({
      siteId: dto.siteId || null,
      location: { latitude: dto.latitude, longitude: dto.longitude },
      message: dto.message || null,
      contactPhone: dto.contactPhone || null,
      status: SosStatus.PENDING,
    });

    const saved = await this.sosRepository.save(sosRequest);
    this.logger.log(`SOS request created: ${saved.id} at [${dto.latitude}, ${dto.longitude}]`);

    // Auto-create an incident from this SOS
    try {
      await this.incidentsService.createIncident({
        siteId: dto.siteId,
        incidentType: IncidentType.OTHER,
        severity: Severity.HIGH,
        title: 'SOS Emergency Request',
        description: dto.message || 'Emergency SOS request received',
        location: { latitude: dto.latitude, longitude: dto.longitude },
        detectionSource: DetectionSource.SOS,
        confidenceScore: 1.0,
      });
      this.logger.log(`Auto-created incident from SOS ${saved.id}`);
    } catch (error) {
      this.logger.error(`Failed to auto-create incident from SOS ${saved.id}: ${error.message}`);
    }

    // Emit via WebSocket
    this.gateway.emitSosNew(dto.siteId || 'all', {
      id: saved.id,
      siteId: saved.siteId,
      location: saved.location,
      message: saved.message,
      contactPhone: saved.contactPhone,
      status: saved.status,
      assignedTo: saved.assignedTo || null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });

    return {
      id: saved.id,
      status: saved.status,
      message: 'SOS received. Help is on the way.',
      createdAt: saved.createdAt,
    };
  }

  async getSosRequests(siteId?: string, status?: string) {
    const where: any = {};
    if (siteId && siteId.trim().length > 0 && UUID_REGEX.test(siteId.trim())) {
      where.siteId = siteId.trim();
    }
    if (status) {
      where.status = status;
    }

    return this.sosRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async updateSosStatus(id: string, dto: UpdateSosStatusDto, user: IUser) {
    const sosRequest = await this.sosRepository.findOne({ where: { id } });
    if (!sosRequest) {
      throw new NotFoundException(`SOS request with ID ${id} not found`);
    }

    sosRequest.status = dto.status;

    // Auto-assign responder when acknowledged
    if (dto.status === SosStatus.ACKNOWLEDGED) {
      sosRequest.assignedTo = user.id;
    }

    const saved = await this.sosRepository.save(sosRequest);
    this.logger.log(`SOS ${id} status updated to ${dto.status} by ${user.id}`);

    return saved;
  }
}
