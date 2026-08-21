import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  UserEntity,
  SiteEntity,
  ZoneEntity,
  GeofenceEntity,
  DensityReadingEntity,
  IncidentEntity,
  AlertEntity,
  SosRequestEntity,
  WeatherDataEntity,
  TransportStatusEntity,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'safesight'),
        password: configService.get<string>('DB_PASSWORD', 'safesight_dev'),
        database: configService.get<string>('DB_NAME', 'safesight'),
        entities: [
          UserEntity,
          SiteEntity,
          ZoneEntity,
          GeofenceEntity,
          DensityReadingEntity,
          IncidentEntity,
          AlertEntity,
          SosRequestEntity,
          WeatherDataEntity,
          TransportStatusEntity,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // auto-sync schema in dev
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
