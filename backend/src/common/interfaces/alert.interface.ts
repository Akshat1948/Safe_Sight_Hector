export enum AlertSeverity {
  INFORMATIONAL = 'informational',
  ADVISORY = 'advisory',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  DRAFT = 'draft',
  DISPATCHED = 'dispatched',
  ACKNOWLEDGED = 'acknowledged',
  ESCALATED = 'escalated',
  EXPIRED = 'expired',
}

export enum AlertChannel {
  PUSH = 'push',
  SMS = 'sms',
  DASHBOARD = 'dashboard',
  PA_SYSTEM = 'pa_system',
}

export interface IAlert {
  id: string;
  incidentId: string | null;
  siteId: string;
  targetZoneId: string | null;
  targetZoneName?: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  messageHi: string | null;
  channels: AlertChannel[];
  status: AlertStatus;
  createdBy: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | Date | null;
  escalatedAt: string | Date | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
