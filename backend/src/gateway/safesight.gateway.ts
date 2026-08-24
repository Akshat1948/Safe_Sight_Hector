import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SafeSightGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SafeSightGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:site')
  handleJoinSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { siteId: string },
  ) {
    this.logger.log(`Client ${client.id} joining room: site_${payload.siteId}`);
    client.join(`site_${payload.siteId}`);
  }

  @SubscribeMessage('leave:site')
  handleLeaveSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { siteId: string },
  ) {
    this.logger.log(`Client ${client.id} leaving room: site_${payload.siteId}`);
    client.leave(`site_${payload.siteId}`);
  }

  emitToSite(siteId: string, event: string, payload: any) {
    if (siteId) {
      this.server.to(`site_${siteId}`).emit(event, payload);
    }
    this.server.emit(event, payload);
  }

  emitZoneDensityUpdate(siteId: string, data: { zoneId: string, currentDensity: number, densityStatus: string, flowRate: number, flowVelocity: number, updatedAt: Date }) {
    this.emitToSite(siteId, 'zone:density:update', data);
  }

  emitIncidentNew(siteId: string, incident: any) {
    this.emitToSite(siteId, 'incident:new', incident);
  }

  emitIncidentVerified(siteId: string, data: { incidentId: string, verifiedBy: string, verifiedAt: Date, status: string }) {
    this.emitToSite(siteId, 'incident:verified', data);
  }

  emitIncidentStatusUpdate(siteId: string, data: { incidentId: string, status: string, updatedAt: Date }) {
    this.emitToSite(siteId, 'incident:status:update', data);
  }

  emitAlertNew(siteId: string, alert: any) {
    this.emitToSite(siteId, 'alert:new', alert);
  }

  emitAlertAcknowledged(siteId: string, data: { alertId: string, acknowledgedBy: string, acknowledgedAt: Date }) {
    this.emitToSite(siteId, 'alert:acknowledged', data);
  }

  emitSosNew(siteId: string, data: { id: string, location: any, message: string, createdAt: Date }) {
    this.emitToSite(siteId, 'sos:new', data);
  }

  emitResponderStatusUpdate(siteId: string, data: { incidentId: string, responderId: string, status: string, updatedAt: Date }) {
    this.emitToSite(siteId, 'responder:status:update', data);
  }
}
