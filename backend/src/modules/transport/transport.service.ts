import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TransportStatusEntity, SiteEntity } from '../../database/entities';
import { UpdateTransportDto } from '../../common/dto';
import { TransportStatus, TransportType } from '../../common/interfaces/transport.interface';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

@Injectable()
export class TransportService implements OnModuleInit {
  private readonly logger = new Logger(TransportService.name);

  constructor(
    @InjectRepository(TransportStatusEntity)
    private readonly transportRepository: Repository<TransportStatusEntity>,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDemoTransport();
  }

  private async seedDemoTransport() {
    const count = await this.transportRepository.count();
    if (count === 0) {
      const site = await this.siteRepository.findOne({ where: {} });
      const siteId = site?.id || 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3';

      this.logger.log('Seeding initial demo transport (parking & shuttles)...');

      await this.transportRepository.save([
        {
          siteId,
          transportType: TransportType.PARKING,
          name: 'Parking Lot A — Sangam North',
          totalCapacity: 500,
          currentOccupancy: 380,
          status: TransportStatus.OPERATIONAL,
          location: { latitude: 25.4380, longitude: 81.8420 },
        },
        {
          siteId,
          transportType: TransportType.PARKING,
          name: 'Parking Lot B — VIP & Emergency Holding',
          totalCapacity: 200,
          currentOccupancy: 195,
          status: TransportStatus.FULL,
          location: { latitude: 25.4340, longitude: 81.8490 },
        },
        {
          siteId,
          transportType: TransportType.SHUTTLE,
          name: 'Shuttle Route 1 (Ghat Express)',
          status: TransportStatus.OPERATIONAL,
          totalCapacity: 50,
          currentOccupancy: 35,
          nextDeparture: new Date(Date.now() + 10 * 60000),
          routeInfo: 'Main Entry Plaza → Sangam Ghat → Medical Center',
        },
        {
          siteId,
          transportType: TransportType.SHUTTLE,
          name: 'Shuttle Route 2 (Circulator)',
          status: TransportStatus.OPERATIONAL,
          totalCapacity: 60,
          currentOccupancy: 50,
          nextDeparture: new Date(Date.now() + 20 * 60000),
          routeInfo: 'Parking Lot A → Corridor B → Railway Link',
        },
      ]);
    }
  }

  async getParkingStatus(siteId?: string) {
    const where: any = { transportType: TransportType.PARKING };
    if (siteId && siteId.trim().length > 0 && UUID_REGEX.test(siteId.trim())) {
      where.siteId = siteId.trim();
    }
    const records = await this.transportRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      totalCapacity: record.totalCapacity,
      currentOccupancy: record.currentOccupancy,
      status: record.status,
      location: record.location,
    }));
  }

  async getShuttleStatus(siteId?: string) {
    const where: any = { transportType: In([TransportType.SHUTTLE, TransportType.BUS]) };
    if (siteId && siteId.trim().length > 0 && UUID_REGEX.test(siteId.trim())) {
      where.siteId = siteId.trim();
    }
    const records = await this.transportRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      status: record.status,
      currentOccupancy: record.currentOccupancy,
      totalCapacity: record.totalCapacity,
      nextDeparture: record.nextDeparture ? record.nextDeparture.toISOString() : null,
      routeInfo: record.routeInfo,
    }));
  }

  async updateTransport(id: string, dto: UpdateTransportDto) {
    const record = await this.transportRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Transport entity with ID ${id} not found`);
    }

    if (dto.currentOccupancy !== undefined) {
      record.currentOccupancy = dto.currentOccupancy;
    }
    if (dto.status !== undefined) {
      record.status = dto.status;
    }
    if (dto.nextDeparture !== undefined) {
      record.nextDeparture = dto.nextDeparture ? new Date(dto.nextDeparture) : null;
    }

    const saved = await this.transportRepository.save(record);
    this.logger.log(`Transport status updated: ${saved.id} (${saved.name})`);
    return saved;
  }
}
