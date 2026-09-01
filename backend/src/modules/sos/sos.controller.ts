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
import { SosService } from './sos.service';
import { CreateSosDto, UpdateSosStatusDto } from '../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, IUser } from '../../common/interfaces';

@ApiTags('sos')
@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSos(@Body() createSosDto: CreateSosDto) {
    const data = await this.sosService.createSos(createSosDto);
    return {
      success: true,
      data,
      message: 'SOS request created',
    };
  }

  @Get()
  @ApiQuery({ name: 'siteId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getSosRequests(
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.sosService.getSosRequests(siteId, status);
    return {
      success: true,
      data,
      message: 'SOS requests retrieved',
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONDER, UserRole.MANAGER, UserRole.ADMIN)
  async updateSosStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSosStatusDto: UpdateSosStatusDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.sosService.updateSosStatus(id, updateSosStatusDto, user);
    return {
      success: true,
      data,
      message: 'SOS request status updated',
    };
  }
}
