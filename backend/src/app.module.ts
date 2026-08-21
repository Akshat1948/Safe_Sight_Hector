import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ZonesModule } from './modules/zones/zones.module';
import { GeofencesModule } from './modules/geofences/geofences.module';
import { WeatherModule } from './modules/weather/weather.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SosModule } from './modules/sos/sos.module';
import { TransportModule } from './modules/transport/transport.module';
import { GatewayModule } from './gateway/gateway.module';

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
    IncidentsModule,
    AlertsModule,
    SosModule,
    TransportModule,
    GatewayModule,
  ],
})
export class AppModule {}
