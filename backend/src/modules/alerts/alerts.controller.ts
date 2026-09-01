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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from '../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, IUser } from '../../common/interfaces';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiQuery({ name: 'siteId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'severity', required: false, type: String })
  async getAlerts(
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    const data = await this.alertsService.getAlerts(siteId, status, severity);
    return { success: true, data, message: 'Alerts retrieved' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAlert(
    @Body() createAlertDto: CreateAlertDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.alertsService.createAlert(createAlertDto, user);
    return { success: true, data, message: 'Alert created and dispatched' };
  }

  @Patch(':id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.RESPONDER, UserRole.ADMIN)
  async acknowledgeAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.alertsService.acknowledgeAlert(id, user);
    return { success: true, data, message: 'Alert acknowledged' };
  }
}
