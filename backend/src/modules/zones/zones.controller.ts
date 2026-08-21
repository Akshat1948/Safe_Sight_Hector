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
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateDensityDto, UpdateZoneDto } from '../../common/dto';
import { ApiResponse, UserRole } from '../../common/interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  async getZones(@Query('siteId') siteId?: string): Promise<ApiResponse<any>> {
    const zones = await this.zonesService.getZonesBySite(siteId);
    return {
      success: true,
      data: zones,
      message: 'Zones retrieved',
    };
  }

  @Get(':id')
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
}
