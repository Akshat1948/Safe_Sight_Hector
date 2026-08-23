import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateDensityDto, UpdateZoneDto } from '../../common/dto';
import { ApiResponse, UserRole } from '../../common/interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active zones, optionally filtered by siteId' })
  @ApiQuery({ name: 'siteId', required: false })
  async getZones(@Query('siteId') siteId?: string): Promise<ApiResponse<any>> {
    const zones = await this.zonesService.getZonesBySite(siteId);
    return {
      success: true,
      data: zones,
      message: 'Zones retrieved',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single zone details by ID' })
  async getZone(@Param('id') id: string): Promise<ApiResponse<any>> {
    const zone = await this.zonesService.getZoneById(id);
    return {
      success: true,
      data: zone,
      message: 'Zone retrieved',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new zone (Manager/Admin only)' })
  async createZone(@Body() createZoneDto: CreateZoneDto): Promise<ApiResponse<any>> {
    const zone = await this.zonesService.createZone(createZoneDto);
    return {
      success: true,
      data: zone,
      message: 'Zone created',
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a zone (Manager/Admin only)' })
  async updateZone(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ): Promise<ApiResponse<any>> {
    const zone = await this.zonesService.updateZone(id, updateZoneDto);
    return {
      success: true,
      data: zone,
      message: 'Zone updated',
    };
  }

  @Get(':id/density')
  @ApiOperation({ summary: 'Get recent density time-series history for a zone' })
  @ApiQuery({ name: 'limit', required: false })
  async getZoneDensity(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<ApiResponse<any>> {
    const data = await this.zonesService.getZoneDensityHistory(id, limit ? Number(limit) : 100);
    return {
      success: true,
      data,
      message: 'Density readings retrieved',
    };
  }

  @Patch(':id/density')
  @ApiOperation({ summary: 'Update zone density / headcount in real-time' })
  async updateDensity(
    @Param('id') id: string,
    @Body() dto: UpdateDensityDto,
  ): Promise<ApiResponse<any>> {
    const zone = await this.zonesService.updateZoneDensity(id, dto);
    return {
      success: true,
      data: zone,
      message: 'Zone density updated',
    };
  }

  @Get(':id/forecast')
  @ApiOperation({ summary: 'Get AI/ML crowd density forecast for a zone (6 to 24 hours ahead)' })
  @ApiQuery({ name: 'hoursAhead', required: false, description: 'Hours to forecast ahead (default 6, max 24)' })
  async getZoneForecast(
    @Param('id') id: string,
    @Query('hoursAhead') hoursAhead?: number,
  ): Promise<ApiResponse<any>> {
    const forecast = await this.zonesService.getZoneForecast(id, hoursAhead ? Number(hoursAhead) : 6);
    return {
      success: true,
      data: forecast,
      message: 'Crowd density forecast generated',
    };
  }
}
