import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportStatusEntity } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([TransportStatusEntity])],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
