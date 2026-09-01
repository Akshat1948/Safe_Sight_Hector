'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Filter, MapPin, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth, useSocket } from '@/shared/hooks';
import { IIncident, IncidentStatus, Severity } from '@/shared/types';
import { getIncidents, verifyIncident } from '@/shared/api';

const DEFAULT_INCIDENTS: IIncident[] = [
  {
    id: 'INC-294-81A',
    siteId: 'site-1',
    zoneId: 'zone-3',
    zoneName: 'Perimeter North-West Gate (Zone 3)',
    incidentType: 'geofence_breach' as any,
    severity: Severity.CRITICAL,
    status: IncidentStatus.FLAGGED,
    title: 'Constraint Violation at Perimeter North-West Gate',
    description: 'Unauthorized perimeter breach detected by Motion Sensor NW-04. Mass > 80kg trigger. Immediate verification and drone inspection recommended.',
    location: { type: 'Point', coordinates: [81.8463, 25.4358] },
    confidenceScore: 0.94,
    detectionSource: 'ai' as any,
    verifiedBy: null,
    verifiedAt: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INC-294-79B',
    siteId: 'site-1',
    zoneId: 'zone-1',
    zoneName: 'Data Center Alpha',
    incidentType: 'other' as any,
    severity: Severity.MEDIUM,
    status: IncidentStatus.VERIFIED,
    title: 'Status Update — Sector Security Patrol',
    description: 'Team Bravo reported secure on-site at Data Center Alpha. Routine perimeter checks ongoing.',
    location: { type: 'Point', coordinates: [81.8425, 25.4335] },
    confidenceScore: 0.88,
    detectionSource: 'manual' as any,
    verifiedBy: 'commander-01',
    verifiedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'INC-294-72C',
    siteId: 'site-1',
    zoneId: 'zone-9',
    zoneName: 'Sector 9 South Corridor',
    incidentType: 'environmental_hazard' as any,
    severity: Severity.CRITICAL,
    status: IncidentStatus.FLAGGED,
    title: 'Critical Alert — Environmental Sensor Failure',
    description: 'Environmental sensor failure in Sector 9. Sudden temperature and pressure anomaly detected. Requires immediate technician dispatch.',
    location: { type: 'Point', coordinates: [81.849, 25.438] },
    confidenceScore: 0.91,
    detectionSource: 'ai' as any,
    verifiedBy: null,
    verifiedAt: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'INC-294-65D',
    siteId: 'site-1',
    zoneId: 'zone-4',
    zoneName: 'Route Beta East',
    incidentType: 'other' as any,
    severity: Severity.HIGH,
    status: IncidentStatus.RESPONDING,
    title: 'Asset Deviation — Transport Vehicle V-22',
    description: 'Transport Vehicle V-22 deviated from authorized route path by 1.2km. Automated ping sent to driver console.',
    location: { type: 'Point', coordinates: [81.844, 25.431] },
    confidenceScore: 0.82,
    detectionSource: 'ai' as any,
    verifiedBy: 'commander-01',
    verifiedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export default function IncidentsPage() {
  const { user } = useAuth();
  const siteId = user?.siteId || 'demo-site-prayagraj-01';
  const [incidents, setIncidents] = useState<IIncident[]>(DEFAULT_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<IIncident>(DEFAULT_INCIDENTS[0]);
  const [severityFilter, setSeverityFilter] = useState<string>('All Severities');
  const [sectorFilter, setSectorFilter] = useState<string>('All Sectors');
  const { on, off } = useSocket(siteId);

  useEffect(() => {
    if (!siteId) return;

    getIncidents(siteId).then((res) => {
      if (res.success && res.data?.incidents && res.data.incidents.length > 0) {
        setIncidents(res.data.incidents);
        setSelectedIncident(res.data.incidents[0]);
      }
    });
  }, [siteId]);

  useEffect(() => {
    const handleNewIncident = (data: any) => {
      if (data?.id) {
        setIncidents((prev) => [data, ...prev.filter((i) => i.id !== data.id)]);
        setSelectedIncident(data);
      }
    };

    const handleStatusUpdate = (data: any) => {
      const targetId = data?.incidentId || data?.id;
      if (!targetId) return;

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === targetId
            ? {
                ...inc,
                status: data.status || inc.status,
                verifiedBy: data.verifiedBy || inc.verifiedBy,
                verifiedAt: data.verifiedAt || inc.verifiedAt,
              }
            : inc
        )
      );

      setSelectedIncident((prev) =>
        prev && prev.id === targetId
          ? {
              ...prev,
              status: data.status || prev.status,
              verifiedBy: data.verifiedBy || prev.verifiedBy,
              verifiedAt: data.verifiedAt || prev.verifiedAt,
            }
          : prev
      );
    };

    on('incident:new', handleNewIncident);
    on('incident:verified', handleStatusUpdate);
    on('incident:status:update', handleStatusUpdate);

    return () => {
      off('incident:new', handleNewIncident);
      off('incident:verified', handleStatusUpdate);
      off('incident:status:update', handleStatusUpdate);
    };
  }, [on, off]);

  const handleVerify = async (id: string) => {
    try {
      await verifyIncident(id, 'verify');
      const updated = { ...selectedIncident, status: IncidentStatus.VERIFIED };
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setSelectedIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await verifyIncident(id, 'dismiss');
      const updated = { ...selectedIncident, status: IncidentStatus.DISMISSED };
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setSelectedIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter !== 'All Severities' && i.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [incidents, severityFilter]);

  return (
    <RoleGuard allowedRoles={['manager', 'admin', 'responder']}>
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-120px)] min-h-[560px] overflow-hidden">
          {/* Left Pane: Search & Filter Log (4 - 5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 h-full overflow-hidden shrink-0">
            {/* Filters Header */}
            <div className="bg-surface-container-low hud-border rounded-lg p-3.5 flex flex-col gap-3 shrink-0 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-tight">
                  Alert Registry
                </h2>
                <span className="font-telemetry-md text-xs text-primary font-bold">
                  {incidents.length * 3100 || 12402} Records
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Filter className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full appearance-none bg-surface border border-outline-variant rounded pl-8 pr-7 py-1.5 text-xs font-telemetry-md focus:outline-none focus:border-primary text-on-surface cursor-pointer"
                  >
                    <option>All Severities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>

                <div className="relative flex-1">
                  <MapPin className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="w-full appearance-none bg-surface border border-outline-variant rounded pl-8 pr-7 py-1.5 text-xs font-telemetry-md focus:outline-none focus:border-primary text-on-surface cursor-pointer"
                  >
                    <option>All Sectors</option>
                    <option>Sector 1 (North)</option>
                    <option>Sector 7 (Core)</option>
                    <option>Sector 9 (South)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2 pr-1">
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident.id === incident.id;
                const isCritical = incident.severity === 'critical';
                const isHigh = incident.severity === 'high';
                const isMedium = incident.severity === 'medium';

                let dotColor = 'bg-status-nominal';
                let tagColor = 'text-status-nominal';
                if (isCritical) {
                  dotColor = 'bg-error';
                  tagColor = 'text-error';
                } else if (isHigh) {
                  dotColor = 'bg-primary-container';
                  tagColor = 'text-primary-container';
                } else if (isMedium) {
                  dotColor = 'bg-tertiary';
                  tagColor = 'text-tertiary';
                }

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`rounded p-3 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-surface-container hud-border neon-glow-amber'
                        : 'bg-surface-container-lowest hud-border hover:bg-surface-container'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    )}

                    <div className="flex justify-between items-start mb-1.5 pl-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotColor} ${isCritical ? 'animate-pulse' : ''}`}></div>
                        <span className={`font-label-caps text-[10px] uppercase font-bold tracking-wider ${tagColor}`}>
                          {incident.severity} — {incident.status}
                        </span>
                      </div>
                      <span className="font-telemetry-md text-[10px] text-on-surface-variant">
                        {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-body-base text-xs text-on-surface mb-2 pl-1.5 line-clamp-2 font-medium">
                      {incident.title}
                    </p>

                    <div className="flex gap-2 pl-1.5">
                      <span className="bg-surface-variant text-on-surface-variant font-telemetry-md text-[9px] px-1.5 py-0.5 rounded font-bold">
                        CCTV-45
                      </span>
                      <span className="bg-surface-variant text-on-surface-variant font-telemetry-md text-[9px] px-1.5 py-0.5 rounded font-bold">
                        {incident.zoneName?.split(' ')[0] || 'Zone 3'}
                      </span>
                      {incident.confidenceScore && (
                        <span className="bg-primary/10 text-primary font-telemetry-md text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto">
                          {Math.round(incident.confidenceScore * 100)}% CONF
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Detailed View (7 - 8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-surface-container-low hud-border rounded-lg flex flex-col overflow-hidden relative shadow-sm">
            {/* Detail Header */}
            <div className="p-5 border-b border-outline-variant bg-surface-container flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className={`font-label-caps text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    selectedIncident.severity === 'critical'
                      ? 'bg-error/20 border border-error text-error'
                      : 'bg-primary-container/20 border border-primary-container text-primary'
                  }`}>
                    {selectedIncident.severity} Severity
                  </span>
                  <span className="font-telemetry-md text-xs text-on-surface-variant font-bold">
                    ID: {selectedIncident.id}
                  </span>
                </div>
                <h1 className="font-headline-md text-lg font-bold text-on-surface">
                  {selectedIncident.title}
                </h1>
                <p className="font-telemetry-md text-xs text-on-surface-variant mt-0.5">
                  Logged: {new Date(selectedIncident.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => alert(`Exporting incident telemetry log for ${selectedIncident.id}...`)}
                  className="border border-outline-variant text-primary font-label-caps text-[11px] px-3 py-1.5 rounded hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  Export Log
                </button>
                {selectedIncident.status === 'flagged' ? (
                  <>
                    <button
                      onClick={() => handleVerify(selectedIncident.id)}
                      className="bg-primary text-on-primary font-label-caps text-[11px] px-3.5 py-1.5 rounded hover:bg-primary-container transition-colors font-bold shadow-xs cursor-pointer"
                    >
                      Verify Incident
                    </button>
                    <button
                      onClick={() => handleDismiss(selectedIncident.id)}
                      className="border border-error/50 text-error font-label-caps text-[11px] px-3 py-1.5 rounded hover:bg-error-container/20 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleVerify(selectedIncident.id)}
                    className="bg-primary text-on-primary font-label-caps text-[11px] px-3.5 py-1.5 rounded hover:bg-primary-container transition-colors font-bold shadow-xs cursor-pointer"
                  >
                    Re-Open Case
                  </button>
                )}
              </div>
            </div>

            {/* Detail Content (2 Column Layout) */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Telemetry & Notes */}
              <div className="flex flex-col gap-4">
                {/* Sensor Telemetry Block */}
                <div className="bg-surface hud-border rounded-lg p-4 shadow-xs">
                  <h3 className="font-label-caps text-[11px] text-on-surface-variant mb-3 border-b border-outline-variant pb-2 uppercase tracking-wider font-bold">
                    Sensor Telemetry Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <div className="font-telemetry-md text-[10px] text-on-surface-variant uppercase">Source</div>
                      <div className="font-telemetry-md text-xs text-on-surface font-bold mt-0.5">Motion_Sens_NW_04</div>
                    </div>
                    <div>
                      <div className="font-telemetry-md text-[10px] text-on-surface-variant uppercase">Zone</div>
                      <div className="font-telemetry-md text-xs text-on-surface font-bold mt-0.5">
                        {selectedIncident.zoneName || 'Perimeter 3'}
                      </div>
                    </div>
                    <div>
                      <div className="font-telemetry-md text-[10px] text-on-surface-variant uppercase">Trigger Value</div>
                      <div className="font-telemetry-md text-xs text-error font-bold mt-0.5">Mass &gt; 80kg (Spike)</div>
                    </div>
                    <div>
                      <div className="font-telemetry-md text-[10px] text-on-surface-variant uppercase">System State</div>
                      <div className="font-telemetry-md text-xs text-primary font-bold mt-0.5">Armed_Operational</div>
                    </div>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-label-caps text-[11px] text-on-surface-variant mb-2 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    Incident Description & Action Log
                  </h3>
                  <div className="bg-surface-container hud-border rounded-lg p-3.5 font-telemetry-md text-xs text-on-surface leading-relaxed flex-1 whitespace-pre-line">
                    {selectedIncident.description}
                    {'\n\n'}
                    Investigating officer on scene (Team Alpha). Confirmed crowd density spike near outer perimeter.
                    {'\n\n'}
                    Increased tactical UAV patrol frequency for next 48 hours. Status active.
                  </div>
                </div>
              </div>

              {/* Right Column: CCTV Evidence & Map */}
              <div className="flex flex-col gap-4">
                {/* Image Evidence */}
                <div className="aspect-video bg-[#0f172a] hud-border rounded-lg relative overflow-hidden group shadow-md">
                  {/* Tactical Night-Vision CCTV Mock Feed */}
                  <div
                    className="w-full h-full bg-cover bg-center opacity-85 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80')",
                      filter: 'contrast(1.3) grayscale(0.5)',
                    }}
                  />
                  <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none"></div>

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded text-[10px] font-telemetry-md text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    REC • CCTV-45
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end">
                    <span className="font-telemetry-md text-[10px] text-white">
                      CCTV-45 Capture Frame — Gate NW
                    </span>
                    <span className="font-telemetry-md text-[9px] text-amber-300">
                      25.4358° N, 81.8463° E
                    </span>
                  </div>
                </div>

                {/* Map Location Pinpoint */}
                <div className="flex-1 bg-surface hud-border rounded-lg relative overflow-hidden min-h-[140px] flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)]"
                    style={{ backgroundSize: '16px 16px' }}
                  ></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-error/20 border border-error flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-error"></div>
                    </div>
                    <div className="mt-2 glass-panel hud-border px-3 py-1 rounded text-center shadow-xs">
                      <div className="font-telemetry-md text-[10px] text-error font-bold">Incident Origin</div>
                      <div className="font-telemetry-md text-[10px] text-on-surface-variant font-mono">
                        Lat 25.4358 / Lng 81.8463
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Status */}
            <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-xs font-telemetry-md shrink-0">
              <div className="flex items-center gap-1.5 text-tertiary font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Status Verified by Operational Commander
              </div>
              <div className="text-on-surface-variant">
                Telemetry Clock: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

