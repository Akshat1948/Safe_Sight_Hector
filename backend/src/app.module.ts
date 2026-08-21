import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ZonesModule } from './modules/zones/zones.module';
import { GeofencesModule } from './modules/geofences/geofences.module';
import { WeatherModule } from './modules/weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    AuthModule,
    ZonesModule,
    GeofencesModule,
    WeatherModule,
  ],
})
export class AppModule {}
