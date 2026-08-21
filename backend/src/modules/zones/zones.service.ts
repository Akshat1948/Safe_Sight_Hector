import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { DensityReadingEntity } from '../../database/entities/density-reading.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { CreateZoneDto, UpdateDensityDto, UpdateZoneDto } from '../../common/dto';
import { DensityStatus, ZoneType } from '../../common/interfaces/zone.interface';
import { DENSITY_THRESHOLDS } from '../../common/constants';

@Injectable()
export class ZonesService implements OnModuleInit {
  private readonly logger = new Logger(ZonesService.name);

  constructor(
    @InjectRepository(ZoneEntity)
    private zoneRepository: Repository<ZoneEntity>,
    @InjectRepository(DensityReadingEntity)
    private densityRepository: Repository<DensityReadingEntity>,
    @InjectRepository(SiteEntity)
    private siteRepository: Repository<SiteEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultSiteAndZones();
  }

  /**
   * Seed default demo site (e.g., Prayag Sangam / Temple Ghat) and zones for SIH Demo
   */
  private async seedDefaultSiteAndZones() {
    const siteCount = await this.siteRepository.count();
    if (siteCount === 0) {
      this.logger.log('Seeding initial demo site & zones for SafeSight demo scenario...');

      const defaultSite = await this.siteRepository.save({
        name: 'Prayagraj Sangam & Triveni Ghats',
        description: 'Prime pilgrimage confluence site with high density bathing ghats and stairs.',
        location: { latitude: 25.4358, longitude: 81.8463 },
        bounds: {
          type: 'Polygon',
          coordinates: [
            [
              [81.840, 25.430],
              [81.855, 25.430],
              [81.855, 25.445],
              [81.840, 25.445],
              [81.840, 25.430],
            ],
          ],
        },
        address: 'Sangam Marg, Prayagraj, Uttar Pradesh 211005',
        siteType: 'pilgrimage',
        isActive: true,
      });

      const demoZones = [
        {
          siteId: defaultSite.id,
          name: 'Zone A — Main Entry Plaza & Holding Area',
          zoneType: ZoneType.ENTRY_EXIT,
          polygon: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [81.841, 25.432],
                [81.845, 25.432],
                [81.845, 25.436],
                [81.841, 25.436],
                [81.841, 25.432],
              ],
            ],
          },
          maxCapacity: 1500,
          currentDensity: 420,
          densityStatus: DensityStatus.GREEN,
          isActive: true,
        },
        {
          siteId: defaultSite.id,
          name: 'Zone B — Riverside Ghat Corridor',
          zoneType: ZoneType.CORRIDOR,
          polygon: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [81.846, 25.433],
                [81.850, 25.433],
                [81.850, 25.437],
                [81.846, 25.437],
                [81.846, 25.433],
              ],
            ],
          },
          maxCapacity: 800,
          currentDensity: 480,
          densityStatus: DensityStatus.YELLOW,
          isActive: true,
        },
        {
          siteId: defaultSite.id,
          name: 'Zone C — Ghat Staircase & Confluence Chokepoint (Demo Focal)',
          zoneType: ZoneType.HIGH_RISK,
          polygon: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [81.851, 25.434],
                [81.854, 25.434],
                [81.854, 25.438],
                [81.851, 25.438],
                [81.851, 25.434],
              ],
            ],
          },
          maxCapacity: 500,
          currentDensity: 290,
          densityStatus: DensityStatus.YELLOW,
          isActive: true,
        },
        {
          siteId: defaultSite.id,
          name: 'Zone D — Safe Assembly & North Exit Corridor',
          zoneType: ZoneType.SAFE_ASSEMBLY,
          polygon: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [81.842, 25.439],
                [81.848, 25.439],
                [81.848, 25.443],
                [81.842, 25.443],
                [81.842, 25.439],
              ],
            ],
          },
          maxCapacity: 2000,
          currentDensity: 310,
          densityStatus: DensityStatus.GREEN,
          isActive: true,
        },
      ];

      await this.zoneRepository.save(demoZones);
      this.logger.log(`Demo site created (${defaultSite.id}) with 4 initial zones.`);
    }
  }

  async getZonesBySite(siteId?: string): Promise<ZoneEntity[]> {
    const query = this.zoneRepository.createQueryBuilder('zone').where('zone.isActive = :isActive', { isActive: true });

    if (siteId) {
      query.andWhere('zone.siteId = :siteId', { siteId });
    }

    return query.getMany();
  }

  async getZoneById(id: string): Promise<ZoneEntity> {
    const zone = await this.zoneRepository.findOne({
      where: { id, isActive: true },
      relations: ['geofences'],
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  async createZone(dto: CreateZoneDto): Promise<ZoneEntity> {
    const densityStatus = this.calculateDensityStatus(0, dto.maxCapacity);

    const zone = this.zoneRepository.create({
      ...dto,
      currentDensity: 0,
      densityStatus,
      isActive: true,
    });

    return this.zoneRepository.save(zone);
  }

  async updateZone(id: string, dto: UpdateZoneDto): Promise<ZoneEntity> {
    const zone = await this.getZoneById(id);

    Object.assign(zone, dto);

    if (dto.maxCapacity) {
      zone.densityStatus = this.calculateDensityStatus(zone.currentDensity, dto.maxCapacity);
    }

    return this.zoneRepository.save(zone);
  }

  async getZoneDensityHistory(zoneId: string, limit = 100) {
    const zone = await this.getZoneById(zoneId);

    const readings = await this.densityRepository.find({
      where: { zoneId },
      order: { recordedAt: 'DESC' },
      take: Math.min(limit, 500),
    });

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      currentDensity: zone.currentDensity,
      maxCapacity: zone.maxCapacity,
      densityStatus: zone.densityStatus,
      readings: readings.map((r) => ({
        headcount: r.headcount,
        flowRate: r.flowRate,
        flowVelocity: r.flowVelocity,
        source: r.source,
        recordedAt: r.recordedAt,
      })),
    };
  }

  async updateZoneDensity(zoneId: string, dto: UpdateDensityDto): Promise<ZoneEntity> {
    const zone = await this.getZoneById(zoneId);

    zone.currentDensity = dto.headcount;
    zone.densityStatus = this.calculateDensityStatus(dto.headcount, zone.maxCapacity);

    // Save history reading
    await this.densityRepository.save({
      zoneId,
      headcount: dto.headcount,
      flowRate: dto.flowRate ?? null,
      flowVelocity: dto.flowVelocity ?? null,
      source: dto.source ?? 'sensor',
      recordedAt: new Date(),
    });

    return this.zoneRepository.save(zone);
  }

  calculateDensityStatus(headcount: number, maxCapacity: number): DensityStatus {
    if (!maxCapacity || maxCapacity <= 0) return DensityStatus.GREEN;
    const ratio = headcount / maxCapacity;

    if (ratio <= DENSITY_THRESHOLDS.GREEN_MAX) {
      return DensityStatus.GREEN;
    } else if (ratio <= DENSITY_THRESHOLDS.YELLOW_MAX) {
      return DensityStatus.YELLOW;
    } else if (ratio <= DENSITY_THRESHOLDS.ORANGE_MAX) {
      return DensityStatus.ORANGE;
    } else {
      return DensityStatus.RED;
    }
  }
}
