import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiResponse } from '../../common/interfaces';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':siteId')
  async getWeather(@Param('siteId') siteId: string): Promise<ApiResponse<any>> {
    const data = await this.weatherService.getWeatherForSite(siteId);
    return {
      success: true,
      data,
      message: 'Weather data retrieved',
    };
  }
}
