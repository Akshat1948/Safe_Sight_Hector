import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertEntity } from '../../database/entities';
import { GatewayModule } from '../../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    GatewayModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
