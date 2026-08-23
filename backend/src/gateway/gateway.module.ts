import { Module } from '@nestjs/common';
import { SafeSightGateway } from './safesight.gateway';

@Module({
  providers: [SafeSightGateway],
  exports: [SafeSightGateway],
})
export class GatewayModule {}
