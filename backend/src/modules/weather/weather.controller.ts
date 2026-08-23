import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { ApiResponse, IWeatherData } from '../../common/interfaces';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':siteId')
  @ApiOperation({ summary: 'Get current weather, 24h forecast and hazard advisory for a site' })
  async getWeather(@Param('siteId') siteId: string): Promise<ApiResponse<IWeatherData>> {
    const weather = await this.weatherService.getWeatherForSite(siteId);
    return {
      success: true,
      data: weather,
      message: 'Weather data retrieved',
    };
  }
}
