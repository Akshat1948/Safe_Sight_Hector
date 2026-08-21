import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../../database/entities';
import { CreateAlertDto } from '../../common/dto';
import { SafeSightGateway } from '../../gateway/safesight.gateway';
import { AlertStatus } from '../../common/interfaces';
import { IUser } from '../../common/interfaces';
import { AI_ML_SERVICE_URL, ALERT_ESCALATION_TIMEOUT_MS } from '../../common/constants';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    private readonly gateway: SafeSightGateway,
  ) {}

  async getAlerts(siteId: string, status?: string, severity?: string) {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.targetZone', 'zone')
      .where('alert.siteId = :siteId', { siteId });

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    if (severity) {
      query.andWhere('alert.severity = :severity', { severity });
    }

    const entities = await query
      .orderBy('alert.createdAt', 'DESC')
      .getMany();

    return entities.map((alert) => ({
      ...alert,
      targetZoneName: alert.targetZone?.name ?? null,
      targetZone: undefined,
    }));
  }

  async createAlert(dto: CreateAlertDto, user: IUser) {
    // Attempt Hindi translation via AI/ML Bhashini service
    let messageHi: string | null = null;
    try {
      const response = await fetch(`${AI_ML_SERVICE_URL}/bhashini/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: dto.message,
          source_language: 'en',
          target_language: 'hi',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        messageHi = result?.data?.translated_text ?? null;
        this.logger.log('Alert message translated to Hindi successfully');
      }
    } catch (error) {
      this.logger.warn(`Translation to Hindi failed, proceeding without: ${error.message}`);
    }

    const alert = this.alertRepository.create({
      ...dto,
      messageHi,
      status: AlertStatus.DISPATCHED,
      createdBy: user.id,
    });

    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Alert created: ${saved.id} [${saved.severity}] dispatched to site ${saved.siteId}`);

    // Load zone relation for the response
    const alertWithZone = await this.alertRepository.findOne({
      where: { id: saved.id },
      relations: ['targetZone'],
    });

    const alertResponse = {
      ...alertWithZone,
      targetZoneName: alertWithZone?.targetZone?.name ?? null,
      targetZone: undefined,
    };

    // Emit via WebSocket
    this.gateway.emitAlertNew(saved.siteId, alertResponse);

    // Set up auto-escalation timer
    this.setupEscalationTimer(saved.id, saved.siteId);

    return alertResponse;
  }

  async acknowledgeAlert(id: string, user: IUser) {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    alert.acknowledgedBy = user.id;
    alert.acknowledgedAt = new Date();
    alert.status = AlertStatus.ACKNOWLEDGED;

    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Alert ${id} acknowledged by ${user.id}`);

    this.gateway.emitAlertAcknowledged(saved.siteId, {
      alertId: saved.id,
      acknowledgedBy: saved.acknowledgedBy,
      acknowledgedAt: saved.acknowledgedAt,
    });

    return saved;
  }

  private setupEscalationTimer(alertId: string, siteId: string) {
    setTimeout(async () => {
      try {
        const alert = await this.alertRepository.findOne({ where: { id: alertId } });
        if (alert && alert.status === AlertStatus.DISPATCHED) {
          alert.status = AlertStatus.ESCALATED;
          alert.escalatedAt = new Date();
          await this.alertRepository.save(alert);
          this.logger.warn(`Alert ${alertId} auto-escalated — not acknowledged within ${ALERT_ESCALATION_TIMEOUT_MS / 1000}s`);

          this.gateway.emitToSite(siteId, 'alert:escalated', {
            alertId: alert.id,
            escalatedAt: alert.escalatedAt,
            status: alert.status,
          });
        }
      } catch (error) {
        this.logger.error(`Escalation check failed for alert ${alertId}: ${error.message}`);
      }
    }, ALERT_ESCALATION_TIMEOUT_MS);
  }
}
