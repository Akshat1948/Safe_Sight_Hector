import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ZonesService } from './zones.service';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { DensityReadingEntity } from '../../database/entities/density-reading.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { DensityStatus } from '../../common/interfaces/zone.interface';

const VALID_ZONE_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('ZonesService (Ayush Module)', () => {
  let service: ZonesService;
  let zoneRepository: any;
  let densityRepository: any;
  let siteRepository: any;
  let configService: any;

  beforeEach(async () => {
    // Mock global fetch to ensure unit tests run isolated without network calls
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              zone_id: VALID_ZONE_UUID,
              site_id: 'site-1',
              forecast: [
                { timestamp: '2026-08-23T20:00:00Z', predicted_density: 320 },
                { timestamp: '2026-08-23T21:00:00Z', predicted_density: 330 },
                { timestamp: '2026-08-23T22:00:00Z', predicted_density: 340 },
                { timestamp: '2026-08-23T23:00:00Z', predicted_density: 350 },
                { timestamp: '2026-08-24T00:00:00Z', predicted_density: 360 },
                { timestamp: '2026-08-24T01:00:00Z', predicted_density: 370 },
              ],
              model_used: 'prophet',
              generated_at: '2026-08-23T19:00:00Z',
              peak_expected_at: '2026-08-24T01:00:00Z',
              peak_density: 370,
            },
          }),
      }),
    ) as any;

    zoneRepository = {
      count: jest.fn().mockResolvedValue(4),
      findOne: jest.fn().mockResolvedValue({
        id: VALID_ZONE_UUID,
        siteId: 'site-1',
        name: 'Zone C — Staircase',
        maxCapacity: 500,
        currentDensity: 300,
        densityStatus: DensityStatus.YELLOW,
        isActive: true,
      }),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((zone) => Promise.resolve({ id: VALID_ZONE_UUID, ...zone })),
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

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:8000/ml'),
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
        {
          provide: ConfigService,
          useValue: configService,
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
        id: VALID_ZONE_UUID,
        name: 'Zone C — Staircase',
        maxCapacity: 500,
        currentDensity: 200,
        densityStatus: DensityStatus.GREEN,
      };

      zoneRepository.findOne.mockResolvedValue(mockZone);

      const result = await service.updateZoneDensity(VALID_ZONE_UUID, {
        headcount: 460,
        flowRate: 35.0,
        flowVelocity: 0.4,
      });

      expect(mockZone.currentDensity).toBe(460);
      expect(mockZone.densityStatus).toBe(DensityStatus.RED);
      expect(densityRepository.save).toHaveBeenCalled();
    });
  });

  describe('getZoneForecast', () => {
    it('should return a forecast with prediction points', async () => {
      const forecast = await service.getZoneForecast(VALID_ZONE_UUID, 6);
      expect(forecast).toBeDefined();
      expect(forecast.zone_id).toBe(VALID_ZONE_UUID);
      expect(Array.isArray(forecast.forecast)).toBe(true);
      expect(forecast.forecast.length).toBe(6);
    });
  });
});
