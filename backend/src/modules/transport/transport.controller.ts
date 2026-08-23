import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { UpdateTransportDto } from '../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/interfaces';

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('parking')
  async getParkingStatus(@Query('siteId') siteId?: string) {
    const data = await this.transportService.getParkingStatus(siteId);
    return {
      success: true,
      data,
      message: 'Parking status retrieved',
    };
  }

  @Get('shuttles')
  async getShuttleStatus(@Query('siteId') siteId?: string) {
    const data = await this.transportService.getShuttleStatus(siteId);
    return {
      success: true,
      data,
      message: 'Shuttle status retrieved',
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  async updateTransport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransportDto: UpdateTransportDto,
  ) {
    const data = await this.transportService.updateTransport(id, updateTransportDto);
    return {
      success: true,
      data,
      message: 'Transport status updated',
    };
  }
}
