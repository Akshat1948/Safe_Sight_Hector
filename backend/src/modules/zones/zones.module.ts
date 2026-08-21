import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneEntity } from '../../database/entities/zone.entity';
import { DensityReadingEntity } from '../../database/entities/density-reading.entity';
import { SiteEntity } from '../../database/entities/site.entity';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneEntity, DensityReadingEntity, SiteEntity])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
