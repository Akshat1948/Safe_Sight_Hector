import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GeofencesService } from './geofences.service';
import { CreateGeofenceDto, UpdateGeofenceDto } from '../../common/dto';
import { ApiResponse, UserRole } from '../../common/interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('geofences')
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Get()
  async getGeofences(
    @Query('siteId') siteId?: string,
    @Query('zoneId') zoneId?: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.geofencesService.getGeofences(siteId, zoneId);
    return {
      success: true,
      data,
      message: 'Geofences retrieved',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async createGeofence(@Body() dto: CreateGeofenceDto): Promise<ApiResponse<any>> {
    const data = await this.geofencesService.createGeofence(dto);
    return {
      success: true,
      data,
      message: 'Geofence created',
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async updateGeofence(
    @Param('id') id: string,
    @Body() dto: UpdateGeofenceDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.geofencesService.updateGeofence(id, dto);
    return {
      success: true,
      data,
      message: 'Geofence updated',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async deleteGeofence(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.geofencesService.deleteGeofence(id);
    return {
      success: true,
      data: null,
      message: 'Geofence deleted',
    };
  }
}
