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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, VerifyIncidentDto, UpdateIncidentStatusDto } from '../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, IUser } from '../../common/interfaces';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.RESPONDER)
  async getIncidents(
    @Query('siteId') siteId: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 50;
    const numOffset = offset ? parseInt(offset, 10) : 0;

    const data = await this.incidentsService.getIncidents(
      siteId,
      status,
      severity,
      numLimit,
      numOffset,
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
