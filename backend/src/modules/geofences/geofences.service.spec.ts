import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GeofencesService } from './geofences.service';
import { GeofenceEntity } from '../../database/entities/geofence.entity';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { GeofenceType } from '../../common/interfaces/zone.interface';

describe('GeofencesService (Ayush Module)', () => {
  let service: GeofencesService;
  let geofenceRepository: any;
  let zoneRepository: any;

  beforeEach(async () => {
    geofenceRepository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((geo) => Promise.resolve({ id: 'geo-1', ...geo })),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    zoneRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeofencesService,
        {
          provide: getRepositoryToken(GeofenceEntity),
          useValue: geofenceRepository,
        },
        {
          provide: getRepositoryToken(ZoneEntity),
          useValue: zoneRepository,
        },
      ],
    }).compile();

    service = module.get<GeofencesService>(GeofencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGeofence', () => {
    it('should create a geofence when zone exists', async () => {
      zoneRepository.findOne.mockResolvedValue({ id: 'zone-1' });

      const dto = {
        zoneId: 'zone-1',
        name: 'Staircase Safety Perimeter',
        fenceType: GeofenceType.ALERT_RADIUS,
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
        alertOnEntry: true,
        alertOnExit: false,
      };

      const result = await service.createGeofence(dto);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Staircase Safety Perimeter');
    });

    it('should throw NotFoundException if zone does not exist', async () => {
      zoneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createGeofence({
          zoneId: 'invalid-zone',
          name: 'Test',
          fenceType: GeofenceType.BOUNDARY,
          polygon: { type: 'Polygon', coordinates: [] },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
