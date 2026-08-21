import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ZonesService } from './zones.service';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { DensityReadingEntity } from '../../database/entities/density-reading.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { DensityStatus, ZoneType } from '../../common/interfaces/zone.interface';

describe('ZonesService (Ayush Module)', () => {
  let service: ZonesService;
  let zoneRepository: any;
  let densityRepository: any;
  let siteRepository: any;

  beforeEach(async () => {
    zoneRepository = {
      count: jest.fn().mockResolvedValue(4),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((zone) => Promise.resolve({ id: 'zone-1', ...zone })),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    densityRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((reading) => Promise.resolve({ id: 'reading-1', ...reading })),
    };

    siteRepository = {
      count: jest.fn().mockResolvedValue(1),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        {
          provide: getRepositoryToken(ZoneEntity),
          useValue: zoneRepository,
        },
        {
          provide: getRepositoryToken(DensityReadingEntity),
          useValue: densityRepository,
        },
        {
          provide: getRepositoryToken(SiteEntity),
          useValue: siteRepository,
        },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDensityStatus', () => {
    it('should return GREEN for density <= 50%', () => {
      expect(service.calculateDensityStatus(200, 500)).toBe(DensityStatus.GREEN);
      expect(service.calculateDensityStatus(250, 500)).toBe(DensityStatus.GREEN);
    });

    it('should return YELLOW for density > 50% and <= 70%', () => {
      expect(service.calculateDensityStatus(251, 500)).toBe(DensityStatus.YELLOW);
      expect(service.calculateDensityStatus(350, 500)).toBe(DensityStatus.YELLOW);
    });

    it('should return ORANGE for density > 70% and <= 90%', () => {
      expect(service.calculateDensityStatus(351, 500)).toBe(DensityStatus.ORANGE);
      expect(service.calculateDensityStatus(450, 500)).toBe(DensityStatus.ORANGE);
    });

    it('should return RED for density > 90%', () => {
      expect(service.calculateDensityStatus(451, 500)).toBe(DensityStatus.RED);
      expect(service.calculateDensityStatus(500, 500)).toBe(DensityStatus.RED);
      expect(service.calculateDensityStatus(600, 500)).toBe(DensityStatus.RED);
    });
  });

  describe('updateZoneDensity', () => {
    it('should update zone currentDensity and recalculate status', async () => {
      const mockZone = {
        id: 'zone-1',
        name: 'Zone C — Staircase',
        maxCapacity: 500,
        currentDensity: 200,
        densityStatus: DensityStatus.GREEN,
      };

      zoneRepository.findOne.mockResolvedValue(mockZone);

      const result = await service.updateZoneDensity('zone-1', {
        headcount: 460,
        flowRate: 35.0,
        flowVelocity: 0.4,
      });

      expect(mockZone.currentDensity).toBe(460);
      expect(mockZone.densityStatus).toBe(DensityStatus.RED);
      expect(densityRepository.save).toHaveBeenCalled();
    });
  });
});
