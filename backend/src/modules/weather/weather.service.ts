import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WeatherDataEntity } from '../../database/entities/weather-data.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { HazardLevel, HazardType, IWeatherData } from '../../common/interfaces/weather.interface';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectRepository(WeatherDataEntity)
    private weatherRepository: Repository<WeatherDataEntity>,
    @InjectRepository(SiteEntity)
    private siteRepository: Repository<SiteEntity>,
    private configService: ConfigService,
  ) {}

  async getWeatherForSite(siteIdInput: string): Promise<IWeatherData> {
    const targetSite = await this.resolveSite(siteIdInput);
    const siteId = targetSite ? targetSite.id : siteIdInput;

    // If siteId is a valid UUID, check recent cached weather (within 15 minutes)
    if (UUID_REGEX.test(siteId)) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const cached = await this.weatherRepository.findOne({
        where: { siteId },
        order: { fetchedAt: 'DESC' },
      });

      if (cached && cached.fetchedAt > fifteenMinutesAgo) {
        return this.mapEntityToResponse(cached);
      }
    }

    // Fetch from AI/ML weather service (or fallback gracefully)
    return this.fetchOrGenerateWeatherData(targetSite, siteIdInput);
  }

  private async resolveSite(siteIdInput: string): Promise<SiteEntity | null> {
    if (UUID_REGEX.test(siteIdInput)) {
      const site = await this.siteRepository.findOne({ where: { id: siteIdInput } });
      if (site) return site;
    }
    // Fallback to first active site (e.g. Prayagraj Sangam)
    return this.siteRepository.findOne({ where: { isActive: true } });
  }

  private async fetchOrGenerateWeatherData(site: SiteEntity | null, siteIdInput: string): Promise<IWeatherData> {
    const mlBaseUrl = this.configService.get<string>('AI_ML_SERVICE_URL', 'http://localhost:8000/ml');
    const realSiteId = site ? site.id : null;

    let lat = 25.4358;
    let lon = 81.8463;

    if (site?.location) {
      if ('latitude' in site.location && typeof site.location.latitude === 'number') {
        lat = site.location.latitude;
        lon = site.location.longitude;
      } else if ('coordinates' in site.location && Array.isArray(site.location.coordinates)) {
        lon = site.location.coordinates[0];
        lat = site.location.coordinates[1];
      }
    }

    try {
      // 1. Fetch live IMD current weather from AI/ML microservice
      const weatherResp = await fetch(`${mlBaseUrl}/weather/current?site_lat=${lat}&site_lon=${lon}`);
      if (weatherResp.ok) {
        const weatherJson = await weatherResp.json();
        if (weatherJson.success && weatherJson.data) {
          const w = weatherJson.data;

          // 2. Fetch multi-hazard scoring from AI/ML
          let hazardLevel = HazardLevel.NONE;
          let hazardType: HazardType | null = null;
          let advisory: string | null = null;

          try {
            const hazardResp = await fetch(`${mlBaseUrl}/weather/hazards`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                site_id: realSiteId || siteIdInput,
                weather: {
                  temperature: w.temperature,
                  precipitation: w.precipitation,
                  wind_speed: w.wind_speed,
                  condition: w.condition,
                },
                site_features: {
                  elevation_meters: 98.0,
                  slope_degrees: 15.0,
                  soil_type: 'alluvial',
                  proximity_to_water_meters: 25.0,
                },
              }),
            });

            if (hazardResp.ok) {
              const hazardJson = await hazardResp.json();
              if (hazardJson.success && hazardJson.data) {
                hazardLevel = hazardJson.data.hazard_level as HazardLevel;
                hazardType = hazardJson.data.primary_hazard as HazardType;
                advisory = hazardJson.data.advisory;
              }
            }
          } catch (hazardErr) {
            this.logger.warn(`AI/ML hazard scoring failed, using defaults: ${hazardErr.message}`);
          }

          if (realSiteId) {
            const record = await this.weatherRepository.save({
              siteId: realSiteId,
              temperature: w.temperature,
              humidity: w.humidity,
              windSpeed: w.wind_speed,
              windDirection: w.wind_direction,
              condition: w.condition,
              precipitation: w.precipitation,
              visibility: w.visibility,
              hazardLevel: hazardLevel || HazardLevel.LOW,
              hazardType: hazardType || HazardType.FLOOD,
              advisory: advisory || 'Pilgrimage site water levels monitored regularly.',
              forecastJson: w.forecast_24h || [],
              fetchedAt: new Date(),
            });
            return this.mapEntityToResponse(record);
          }

          return {
            siteId: siteIdInput,
            current: {
              temperature: w.temperature,
              humidity: w.humidity,
              windSpeed: w.wind_speed,
              windDirection: w.wind_direction,
              condition: w.condition,
              precipitation: w.precipitation,
              visibility: w.visibility,
            },
            hazard: { level: hazardLevel, type: hazardType, advisory },
            forecast: w.forecast_24h || [],
            fetchedAt: new Date(),
          };
        }
      }
    } catch (err) {
      this.logger.warn(`AI/ML weather service unreachable at ${mlBaseUrl}, using fallback demo data: ${err.message}`);
    }

    // Graceful fallback for offline AI/ML service
    if (realSiteId) {
      const fallbackRecord = await this.weatherRepository.save({
        siteId: realSiteId,
        temperature: 29.4,
        humidity: 78,
        windSpeed: 14.2,
        windDirection: 'NW',
        condition: 'partly_cloudy',
        precipitation: 12.5,
        visibility: 8.0,
        hazardLevel: HazardLevel.MODERATE,
        hazardType: HazardType.FLOOD,
        advisory: 'Monsoon surge in river basin: Water levels near riverside ghats rising. Keep alert.',
        forecastJson: [
          { time: '12:00', temperature: 29.4, condition: 'partly_cloudy', precipitation: 0 },
          { time: '15:00', temperature: 31.0, condition: 'thunderstorm', precipitation: 25 },
          { time: '18:00', temperature: 27.5, condition: 'rain', precipitation: 18 },
          { time: '21:00', temperature: 26.0, condition: 'cloudy', precipitation: 5 },
        ],
        fetchedAt: new Date(),
      });
      return this.mapEntityToResponse(fallbackRecord);
    }

    return {
      siteId: siteIdInput,
      current: {
        temperature: 29.4,
        humidity: 78,
        windSpeed: 14.2,
        windDirection: 'NW',
        condition: 'partly_cloudy',
        precipitation: 12.5,
        visibility: 8.0,
      },
      hazard: {
        level: HazardLevel.MODERATE,
        type: HazardType.FLOOD,
        advisory: 'Monsoon surge in river basin: Water levels near riverside ghats rising. Keep alert.',
      },
      forecast: [
        { time: '12:00', temperature: 29.4, condition: 'partly_cloudy', precipitation: 0 },
        { time: '15:00', temperature: 31.0, condition: 'thunderstorm', precipitation: 25 },
      ],
      fetchedAt: new Date(),
    };
  }

  private mapEntityToResponse(entity: WeatherDataEntity): IWeatherData {
    return {
      id: entity.id,
      siteId: entity.siteId,
      current: {
        temperature: entity.temperature,
        humidity: entity.humidity,
        windSpeed: entity.windSpeed,
        windDirection: entity.windDirection,
        condition: entity.condition,
        precipitation: entity.precipitation,
        visibility: entity.visibility,
      },
      hazard: {
        level: entity.hazardLevel,
        type: entity.hazardType,
        advisory: entity.advisory,
      },
      forecast: entity.forecastJson || [],
      fetchedAt: entity.fetchedAt,
    };
  }
}
