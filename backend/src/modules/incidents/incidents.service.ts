import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentEntity } from '../../database/entities';
import { CreateIncidentDto, VerifyIncidentDto, UpdateIncidentStatusDto } from '../../common/dto';
import { SafeSightGateway } from '../../gateway/safesight.gateway';
import { IncidentStatus, DetectionSource } from '../../common/interfaces';
import { IUser } from '../../common/interfaces';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    private readonly gateway: SafeSightGateway,
  ) {}

  async getIncidents(
    siteId?: string,
    status?: string,
    severity?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const query = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.zone', 'zone');

    if (siteId && siteId.trim().length > 0) {
      query.andWhere('incident.siteId = :siteId', { siteId: siteId.trim() });
    }

    if (status) {
      query.andWhere('incident.status = :status', { status });
    }

    if (severity) {
      query.andWhere('incident.severity = :severity', { severity });
    }

    const [entities, total] = await query
      .take(limit)
      .skip(offset)
      .orderBy('incident.createdAt', 'DESC')
      .getManyAndCount();

    const incidents = entities.map((inc) => ({
      ...inc,
      zoneName: inc.zone?.name ?? null,
      zone: undefined,
    }));

    return { incidents, total, limit, offset };
  }

  async getIncidentById(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['zone'],
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return {
      ...incident,
      zoneName: incident.zone?.name ?? null,
      zone: undefined,
    };
  }

  async createIncident(dto: CreateIncidentDto) {
    const incident = this.incidentRepository.create({
      ...dto,
      status: IncidentStatus.FLAGGED,
      detectionSource: dto.detectionSource || DetectionSource.AI,
    });

    const saved = await this.incidentRepository.save(incident);
    this.logger.log(`Incident created: ${saved.id} [${saved.incidentType}] severity=${saved.severity}`);

    const incidentWithZone = await this.getIncidentById(saved.id);

    this.gateway.emitIncidentNew(saved.siteId, incidentWithZone);

    return incidentWithZone;
  }

  async verifyIncident(id: string, dto: VerifyIncidentDto, user: IUser) {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    if (dto.action === 'verify') {
      incident.status = IncidentStatus.VERIFIED;
      incident.verifiedBy = user.id;
      incident.verifiedAt = new Date();
    } else {
      incident.status = IncidentStatus.DISMISSED;
    }

    const saved = await this.incidentRepository.save(incident);
    this.logger.log(`Incident ${id} ${dto.action}ed by ${user.id}`);

    if (dto.action === 'verify') {
      this.gateway.emitIncidentVerified(saved.siteId, {
        incidentId: saved.id,
        verifiedBy: saved.verifiedBy,
        verifiedAt: saved.verifiedAt,
        status: saved.status,
      });
    }

    return saved;
  }

  async updateIncidentStatus(id: string, dto: UpdateIncidentStatusDto, user: IUser) {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    incident.status = dto.status as IncidentStatus;
    if (dto.status === 'resolved') {
      incident.resolvedAt = new Date();
    }

    const saved = await this.incidentRepository.save(incident);
    this.logger.log(`Incident ${id} status updated to ${dto.status} by ${user.id}`);

    this.gateway.emitIncidentStatusUpdate(saved.siteId, {
      incidentId: saved.id,
      status: saved.status,
      updatedAt: saved.updatedAt,
    });

    this.gateway.emitResponderStatusUpdate(saved.siteId, {
      incidentId: saved.id,
      responderId: user.id,
      status: saved.status,
      updatedAt: saved.updatedAt,
    });

    return saved;
  }
}
