import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, VerifyIncidentDto, UpdateIncidentStatusDto } from '../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, IUser } from '../../common/interfaces';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.RESPONDER)
  @ApiQuery({ name: 'siteId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'severity', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getIncidents(
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit && !isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 50;
    const parsedOffset = offset && !isNaN(parseInt(offset, 10)) ? parseInt(offset, 10) : 0;

    const data = await this.incidentsService.getIncidents(
      siteId,
      status,
      severity,
      parsedLimit,
      parsedOffset,
    );
    return { success: true, data, message: 'Incidents retrieved' };
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.RESPONDER)
  async getIncidentById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.incidentsService.getIncidentById(id);
    return { success: true, data, message: 'Incident retrieved' };
  }

  @Post()
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createIncident(@Body() createIncidentDto: CreateIncidentDto) {
    const data = await this.incidentsService.createIncident(createIncidentDto);
    return { success: true, data, message: 'Incident created' };
  }

  @Patch(':id/verify')
  @Roles(UserRole.MANAGER)
  async verifyIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyIncidentDto: VerifyIncidentDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.incidentsService.verifyIncident(id, verifyIncidentDto, user);
    return { success: true, data, message: `Incident ${verifyIncidentDto.action}ed` };
  }

  @Patch(':id/status')
  @Roles(UserRole.RESPONDER, UserRole.MANAGER)
  async updateIncidentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateIncidentStatusDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.incidentsService.updateIncidentStatus(id, updateStatusDto, user);
    return { success: true, data, message: 'Incident status updated' };
  }
}
