import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TransportStatusEntity } from '../../database/entities';
import { UpdateTransportDto } from '../../common/dto';
import { TransportType } from '../../common/interfaces/transport.interface';

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(
    @InjectRepository(TransportStatusEntity)
    private readonly transportRepository: Repository<TransportStatusEntity>,
  ) {}

  async getParkingStatus(siteId: string) {
    const records = await this.transportRepository.find({
      where: {
        siteId,
        transportType: TransportType.PARKING,
      },
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

  async getShuttleStatus(siteId: string) {
    const records = await this.transportRepository.find({
      where: {
        siteId,
        transportType: In([TransportType.SHUTTLE, TransportType.BUS]),
      },
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
