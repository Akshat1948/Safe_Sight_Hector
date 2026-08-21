import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeofenceEntity } from '../../database/entities/geofence.entity';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { CreateGeofenceDto, UpdateGeofenceDto } from '../../common/dto';

@Injectable()
export class GeofencesService {
  constructor(
    @InjectRepository(GeofenceEntity)
    private geofenceRepository: Repository<GeofenceEntity>,
    @InjectRepository(ZoneEntity)
    private zoneRepository: Repository<ZoneEntity>,
  ) {}

  async getGeofences(siteId?: string, zoneId?: string): Promise<GeofenceEntity[]> {
    const query = this.geofenceRepository
      .createQueryBuilder('geofence')
      .leftJoinAndSelect('geofence.zone', 'zone')
      .where('geofence.isActive = :isActive', { isActive: true });

    if (zoneId) {
      query.andWhere('geofence.zoneId = :zoneId', { zoneId });
    }

    if (siteId) {
      query.andWhere('zone.siteId = :siteId', { siteId });
    }

    return query.getMany();
  }

  async getGeofenceById(id: string): Promise<GeofenceEntity> {
    const geofence = await this.geofenceRepository.findOne({
      where: { id, isActive: true },
      relations: ['zone'],
    });

    if (!geofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }

    return geofence;
  }

  async createGeofence(dto: CreateGeofenceDto): Promise<GeofenceEntity> {
    const zone = await this.zoneRepository.findOne({
      where: { id: dto.zoneId },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${dto.zoneId} not found`);
    }

    const geofence = this.geofenceRepository.create({
      ...dto,
      isActive: true,
    });

    return this.geofenceRepository.save(geofence);
  }

  async updateGeofence(id: string, dto: UpdateGeofenceDto): Promise<GeofenceEntity> {
    const geofence = await this.getGeofenceById(id);
    Object.assign(geofence, dto);
    return this.geofenceRepository.save(geofence);
  }

  async deleteGeofence(id: string): Promise<void> {
    const geofence = await this.getGeofenceById(id);
    geofence.isActive = false;
    await this.geofenceRepository.save(geofence);
  }
}
