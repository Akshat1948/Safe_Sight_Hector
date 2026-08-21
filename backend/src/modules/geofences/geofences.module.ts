import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofenceEntity } from '../../database/entities/geofence.entity';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { GeofencesService } from './geofences.service';
import { GeofencesController } from './geofences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GeofenceEntity, ZoneEntity])],
  controllers: [GeofencesController],
  providers: [GeofencesService],
  exports: [GeofencesService],
})
export class GeofencesModule {}
