import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { WeatherDataEntity } from '../../database/entities/weather-data.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { HazardLevel, HazardType } from '../../common/interfaces/weather.interface';

describe('WeatherService (Ayush Module)', () => {
  let service: WeatherService;
  let weatherRepository: any;
  let siteRepository: any;
  let configService: any;

  beforeEach(async () => {
    weatherRepository = {
      findOne: jest.fn(),
      save: jest.fn((data) => Promise.resolve({ id: 'weather-1', ...data })),
    };

    siteRepository = {
      findOne: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:8000/ml'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: getRepositoryToken(WeatherDataEntity),
          useValue: weatherRepository,
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

    service = module.get<WeatherService>(WeatherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWeatherForSite', () => {
    it('should return cached weather if fetched recently (<15 mins)', async () => {
      const recentDate = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago

      const cachedEntity = {
        id: 'weather-1',
        siteId: 'site-123',
        temperature: 30.2,
        humidity: 70,
        windSpeed: 10,
        windDirection: 'NW',
        condition: 'clear',
        precipitation: 0,
        visibility: 10,
        hazardLevel: HazardLevel.NONE,
        hazardType: null,
        advisory: null,
        forecastJson: [],
        fetchedAt: recentDate,
      };

      weatherRepository.findOne.mockResolvedValue(cachedEntity);

      const result = await service.getWeatherForSite('site-123');
      expect(result.current.temperature).toBe(30.2);
      expect(result.hazard.level).toBe(HazardLevel.NONE);
    });

    it('should generate/fetch fresh weather if no cache exists', async () => {
      weatherRepository.findOne.mockResolvedValue(null);

      const result = await service.getWeatherForSite('site-123');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('hazard');
      expect(weatherRepository.save).toHaveBeenCalled();
    });
  });
});
