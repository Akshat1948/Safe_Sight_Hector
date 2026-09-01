'use client';

import React, { useState, useEffect } from 'react';
import { IZone, ZoneType, DensityStatus } from '@/shared/types';
import { getZones, getIncidents, getAlerts } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

type TrendRange = '1D' | '1W' | '1M';

interface TrendDataPoint {
  label: string;
  value: number;
  heightPercent: number;
  isSpike?: boolean;
  isCurrent?: boolean;
}

interface TrendDataset {
  title: string;
  subtitle: string;
  yAxis: string[];
  points: TrendDataPoint[];
}

const TREND_DATASETS: Record<TrendRange, TrendDataset> = {
  '1D': {
    title: 'Incident Trends (Last 24h)',
    subtitle: 'Sector activity and density spikes over time',
    yAxis: ['400', '300', '200', '100', '0'],
    points: [
      { label: '00:00', value: 80, heightPercent: 20 },
      { label: '03:00', value: 140, heightPercent: 35 },
      { label: '06:00', value: 100, heightPercent: 25 },
      { label: '09:00', value: 200, heightPercent: 50 },
      { label: '12:00', value: 320, heightPercent: 80, isSpike: true },
      { label: '15:00', value: 240, heightPercent: 60 },
      { label: '18:00', value: 160, heightPercent: 40 },
      { label: '21:00', value: 110, heightPercent: 28 },
      { label: 'NOW', value: 180, heightPercent: 45, isCurrent: true },
    ],
  },
  '1W': {
    title: 'Incident Trends (Last 7 Days)',
    subtitle: 'Daily sector activity and density spikes',
    yAxis: ['400', '300', '200', '100', '0'],
    points: [
      { label: 'Mon', value: 145, heightPercent: 36 },
      { label: 'Tue', value: 190, heightPercent: 48 },
      { label: 'Wed', value: 125, heightPercent: 31 },
      { label: 'Thu', value: 230, heightPercent: 58 },
      { label: 'Fri', value: 310, heightPercent: 78 },
      { label: 'Sat', value: 380, heightPercent: 95, isSpike: true },
      { label: 'Sun', value: 215, heightPercent: 54, isCurrent: true },
    ],
  },
  '1M': {
    title: 'Incident Trends (Last 30 Days)',
    subtitle: 'Weekly sector activity and density spikes',
    yAxis: ['1.6k', '1.2k', '800', '400', '0'],
    points: [
      { label: 'Week 1', value: 780, heightPercent: 49 },
      { label: 'Week 2', value: 1140, heightPercent: 71 },
      { label: 'Week 3', value: 1490, heightPercent: 93, isSpike: true },
      { label: 'Week 4', value: 920, heightPercent: 58, isCurrent: true },
    ],
  },
};

interface AnalyticsPanelProps {
  siteId?: string | null;
}

const DEMO_DEFAULT_ZONES: IZone[] = [
  {
    id: 'f787426f-c02c-402f-ae1a-1043f45e4c6e',
    siteId: 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3',
    name: 'Sector C — Ghat Staircase',
    zoneType: ZoneType.HIGH_RISK,
    polygon: {
      type: 'Polygon',
      coordinates: [[[81.851, 25.434], [81.854, 25.434], [81.854, 25.438], [81.851, 25.438], [81.851, 25.434]]],
    },
    maxCapacity: 500,
    currentDensity: 150,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '29db0acf-6d3a-4124-bee1-f8c98a7e3a7d',
    siteId: 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3',
    name: 'Sector A — Main Entry Plaza',
    zoneType: ZoneType.ENTRY_EXIT,
    polygon: {
      type: 'Polygon',
      coordinates: [[[81.841, 25.432], [81.845, 25.432], [81.845, 25.436], [81.841, 25.436], [81.841, 25.432]]],
    },
    maxCapacity: 1500,
    currentDensity: 420,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '529a85ee-1b9a-4598-8ee9-bfebdd83cf78',
    siteId: 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3',
    name: 'Sector B — East Concourse',
    zoneType: ZoneType.CORRIDOR,
    polygon: {
      type: 'Polygon',
      coordinates: [[[81.846, 25.433], [81.85, 25.433], [81.85, 25.437], [81.846, 25.437], [81.846, 25.433]]],
    },
    maxCapacity: 800,
    currentDensity: 256,
    densityStatus: DensityStatus.YELLOW,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3f49eb2d-9b1b-4652-87dd-0b41fdc50e42',
    siteId: 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3',
    name: 'Sector D — Corridor',
    zoneType: ZoneType.SAFE_ASSEMBLY,
    polygon: {
      type: 'Polygon',
      coordinates: [[[81.842, 25.439], [81.848, 25.439], [81.848, 25.443], [81.842, 25.443], [81.842, 25.439]]],
    },
    maxCapacity: 600,
    currentDensity: 246,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

export default function AnalyticsPanel({ siteId }: AnalyticsPanelProps) {
  const [zones, setZones] = useState<IZone[]>(DEMO_DEFAULT_ZONES);
  const [trendRange, setTrendRange] = useState<TrendRange>('1D');
  const currentTrendData = TREND_DATASETS[trendRange] || TREND_DATASETS['1D'];
  const [stats, setStats] = useState({
    totalAlerts: 3492,
    activeIncidents: 12,
    criticalIncidents: 3,
    avgResponseTime: '4m 12s',
    systemUptime: '99.99%',
    activePatrols: 124,
    patrolCapacity: 150,
  });
  const [recentEvents, setRecentEvents] = useState([
    {
      id: 'e1',
      type: 'CONSTRAINT VIOLATION',
      time: '10:42 AM',
      description: 'Unauthorized access detected at Perimeter North-West Gate.',
      critical: true,
    },
    {
      id: 'e2',
      type: 'SENSOR ANOMALY',
      time: '10:15 AM',
      description: 'Environmental temp drop in Sector 9.',
      critical: false,
    },
  ]);

  const { on, off } = useSocket(siteId || 'demo-site-prayagraj-01');

  useEffect(() => {
    getZones(siteId)
      .then((zonesRes) => {
        if (zonesRes.success && zonesRes.data && zonesRes.data.length > 0) {
          setZones(zonesRes.data);
        }
      })
      .catch(() => {});

    getIncidents(siteId)
      .then((incidentsRes) => {
        const incidents = incidentsRes.success && incidentsRes.data?.incidents ? incidentsRes.data.incidents : [];
        if (incidents.length > 0) {
          setStats((prev) => ({
            ...prev,
            activeIncidents: incidents.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed').length || 12,
            criticalIncidents: incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length || 3,
          }));
        }
      })
      .catch(() => {});

    getAlerts(siteId)
      .then((alertsRes) => {
        const alerts = alertsRes.success && alertsRes.data ? alertsRes.data : [];
        if (alerts.length > 0) {
          setStats((prev) => ({
            ...prev,
            totalAlerts: alerts.length * 142,
          }));
        }
      })
      .catch(() => {});
  }, [siteId]);

  useEffect(() => {
    const handleDensityUpdate = (data: any) => {
      if (data?.zoneId || data?.currentDensity !== undefined) {
        setZones((prev) => {
          const currentList = prev.length > 0 ? prev : DEMO_DEFAULT_ZONES;
          const matchIndex = currentList.findIndex(
            (z) =>
              z.id === data.zoneId ||
              z.name.toLowerCase().includes('zone c') ||
              z.name.toLowerCase().includes('sector c') ||
              z.name.toLowerCase().includes('staircase')
          );

          if (matchIndex >= 0) {
            return currentList.map((z, idx) =>
              idx === matchIndex
                ? {
                    ...z,
                    currentDensity: data.currentDensity,
                    densityStatus: data.densityStatus || z.densityStatus,
                    flowRate: data.flowRate ?? z.flowRate,
                    flowVelocity: data.flowVelocity ?? z.flowVelocity,
                  }
                : z
            );
          }

          return currentList;
        });

        // Dynamically adjust high-level stats when critical surge occurs
        if (data.densityStatus === 'red') {
          setStats((prev) => ({
            ...prev,
            criticalIncidents: Math.max(prev.criticalIncidents, 4),
          }));
        }
      }
    };

    const handleNewIncident = (data: any) => {
      setStats((prev) => ({
        ...prev,
        activeIncidents: prev.activeIncidents + 1,
        criticalIncidents:
          data?.severity === 'critical' ? prev.criticalIncidents + 1 : prev.criticalIncidents,
      }));

      if (data?.title) {
        setRecentEvents((prev) => [
          {
            id: data.id || String(Date.now()),
            type: (data.incidentType || 'CRUSH PRECURSOR').toUpperCase().replace('_', ' '),
            time: 'JUST NOW',
            description: data.description || data.title,
            critical: data.severity === 'critical',
          },
          ...prev.slice(0, 3),
        ]);
      }
    };

    const handleNewAlert = () => {
      setStats((prev) => ({
        ...prev,
        totalAlerts: prev.totalAlerts + 1,
      }));
    };

    on('zone:density:update', handleDensityUpdate);
    on('incident:new', handleNewIncident);
    on('alert:new', handleNewAlert);

    return () => {
      off('zone:density:update', handleDensityUpdate);
      off('incident:new', handleNewIncident);
      off('alert:new', handleNewAlert);
    };
  }, [on, off]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            System Performance Overview
          </h1>
          <p className="text-on-surface-variant font-body-base mt-1">
            Real-time metrics and telemetry for sector-wide operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A3636] border border-[#40534C] rounded text-xs font-sans text-[#D6BD98] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#677D6A] animate-pulse"></span>
            LIVE TELEMETRY
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Alerts */}
        <div className="hud-panel rounded-lg p-4 flex flex-col relative overflow-hidden group hover:border-[#1A3636] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Alerts Today
            </span>
            <span className="material-symbols-outlined text-status-critical text-[20px]">
              warning
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-stat-lg text-stat-lg text-[#1A3636]">{stats.totalAlerts.toLocaleString()}</span>
            <span className="font-body-base text-xs text-status-critical flex items-center font-bold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A3636]/0 via-[#D6BD98] to-[#1A3636]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 2: Avg Response Time */}
        <div className="hud-panel rounded-lg p-4 flex flex-col relative overflow-hidden group hover:border-[#40534C] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Avg Response Time
            </span>
            <span className="material-symbols-outlined text-[#677D6A] text-[20px]">
              timer
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-stat-lg text-stat-lg text-[#1A3636]">{stats.avgResponseTime}</span>
            <span className="font-body-base text-xs text-[#677D6A] flex items-center font-bold">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span> 2s
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#40534C]/0 via-[#677D6A] to-[#40534C]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 3: System Uptime */}
        <div className="hud-panel rounded-lg p-4 flex flex-col relative overflow-hidden group hover:border-[#40534C] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              System Uptime
            </span>
            <span className="material-symbols-outlined text-[#677D6A] text-[20px]">
              dns
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-stat-lg text-stat-lg text-[#1A3636]">{stats.systemUptime}</span>
            <span className="font-body-base text-xs text-on-surface-variant font-medium">N-9 Nines</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#40534C]/0 via-[#677D6A] to-[#40534C]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 4: Active Patrols */}
        <div className="hud-panel rounded-lg p-4 flex flex-col relative overflow-hidden group hover:border-[#1A3636] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Active Patrols
            </span>
            <span className="material-symbols-outlined text-[#40534C] text-[20px]">
              directions_car
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-stat-lg text-stat-lg text-[#1A3636]">{stats.activePatrols}</span>
            <span className="font-body-base text-xs text-on-surface-variant font-medium">/ {stats.patrolCapacity} Capacity</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A3636]/0 via-[#D6BD98] to-[#1A3636]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>

      {/* Main Data Vis Row + Secondary Stack */}
      <div className="grid grid-cols-12 gap-4">
        {/* Main Incident Trends (8 cols on lg) */}
        <div className="col-span-12 lg:col-span-8 hud-panel rounded-lg p-4 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
            <div>
              <h2 className="font-sans text-[16px] font-bold text-on-surface">{currentTrendData.title}</h2>
              <p className="text-xs text-on-surface-variant font-sans">{currentTrendData.subtitle}</p>
            </div>
            <div className="flex space-x-1">
              {(['1D', '1W', '1M'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range)}
                  className={`px-2.5 py-1 text-[10px] font-sans rounded transition-colors ${
                    trendRange === range
                      ? 'bg-[#1A3636] text-[#D6BD98] font-bold border border-[#1A3636]'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area with Y-axis & Bars */}
          <div className="flex-1 w-full bg-surface-container-lowest rounded border border-border-subtle flex flex-col justify-between p-4 relative overflow-hidden group min-h-[240px]">
            {/* Y Axis labels */}
            <div className="absolute left-4 top-4 bottom-8 flex flex-col justify-between text-[10px] font-sans text-on-surface-variant select-none">
              {currentTrendData.yAxis.map((val, idx) => (
                <span key={idx}>{val}</span>
              ))}
            </div>

            {/* Grid Lines */}
            <div className="absolute left-12 right-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
              {currentTrendData.yAxis.map((_, idx) => (
                <div key={idx} className="w-full h-px bg-border-subtle/50"></div>
              ))}
            </div>

            {/* Simulated Bar Chart with Telemetry values */}
            <div className="w-full flex-1 pl-10 pt-4 pb-1 flex items-end justify-around space-x-2 z-10">
              {currentTrendData.points.map((point) => (
                <div key={point.label} className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ease-out relative ${
                      point.isSpike
                        ? 'bg-status-critical/80 hover:bg-status-critical shadow-sm shadow-status-critical/30'
                        : point.isCurrent
                        ? 'bg-[#1A3636] hover:bg-[#40534C] border-t-2 border-[#D6BD98]'
                        : 'bg-[#677D6A]/50 hover:bg-[#677D6A]'
                    }`}
                    style={{ height: `${point.heightPercent}%` }}
                  >
                    {point.isSpike && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-status-critical text-white text-[8px] font-sans rounded whitespace-nowrap z-20">
                        SPIKE
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-sans transition-opacity duration-200 ${
                      point.isSpike
                        ? 'text-status-critical font-bold'
                        : point.isCurrent
                        ? 'text-primary font-bold'
                        : 'text-on-surface-variant opacity-0 group-hover/bar:opacity-100'
                    }`}
                  >
                    {point.value}
                  </span>
                </div>
              ))}
            </div>

            {/* X Axis Labels */}
            <div className="w-full pl-10 pt-1 flex items-center justify-around space-x-2 select-none z-10">
              {currentTrendData.points.map((point) => (
                <div key={point.label} className="flex-1 text-center">
                  <span
                    className={`text-[10px] font-sans truncate block ${
                      point.isCurrent
                        ? 'text-primary font-bold'
                        : point.isSpike
                        ? 'text-status-critical font-bold'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Stack (4 cols on lg) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Sub-System Health Panel */}
          <div className="hud-panel rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <h2 className="font-sans text-[16px] font-bold text-on-surface">Sub-System Health</h2>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">memory</span>
            </div>
            <div className="space-y-4">
              {/* Subsystem 1 */}
              <div className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="font-sans text-xs text-on-surface">Core Telemetry</span>
                  <span className="font-sans text-[12px] text-status-nominal font-bold">NOMINAL (98%)</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-border-subtle">
                  <div className="w-[98%] h-full bg-status-nominal"></div>
                </div>
              </div>

              {/* Subsystem 2 */}
              <div className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="font-sans text-xs text-on-surface">Video Analytics AI</span>
                  <span className="font-sans text-[12px] text-status-warning font-bold">DEGRADED (75%)</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-border-subtle">
                  <div className="w-[75%] h-full bg-status-warning"></div>
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-sans">&gt; Latency spike in Sector 7 processing</span>
              </div>

              {/* Subsystem 3 */}
              <div className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="font-sans text-xs text-on-surface">Geospatial DB</span>
                  <span className="font-sans text-[12px] text-status-nominal font-bold">NOMINAL (100%)</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-border-subtle">
                  <div className="w-[100%] h-full bg-status-nominal"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent High-Priority Events Mini-Feed */}
          <div className="hud-panel rounded-lg p-0 flex flex-col overflow-hidden">
            <div className="bg-surface-container-low p-3 border-b border-border-subtle flex justify-between items-center">
              <h3 className="font-sans text-xs text-on-surface uppercase tracking-wider">
                Recent High-Priority Events
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">priority_high</span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {recentEvents.map((evt) => (
                <li key={evt.id} className="p-3 hover:bg-surface-container transition-colors animate-in fade-in duration-200">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`font-body-bold text-[12px] ${
                        evt.critical ? 'text-status-critical font-extrabold' : 'text-status-warning'
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="font-sans text-[10px] text-on-surface-variant">{evt.time}</span>
                  </div>
                  <p className="text-[12px] text-on-surface font-body-base leading-tight">
                    {evt.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sector / Zone Crowd Density Overview */}
      <div className="hud-panel rounded-lg p-4">
        <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
          <div>
            <h3 className="font-sans text-[16px] font-bold text-on-surface">Sector Crowd Density Telemetry</h3>
            <p className="text-xs text-on-surface-variant font-sans">Active density capacity and crowd flow across designated zones</p>
          </div>
          <span className="font-sans text-xs text-primary uppercase">
            {zones.length || 4} Sectors Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const densityPercent = zone.maxCapacity > 0 ? (zone.currentDensity / zone.maxCapacity) * 100 : 0;
            const isCritical = zone.densityStatus === 'red' || densityPercent > 90;
            const isOrange = zone.densityStatus === 'orange' || densityPercent > 70;
            const isYellow = zone.densityStatus === 'yellow' || densityPercent > 50;

            let barColor = 'bg-status-nominal';
            let statusText = 'text-status-nominal';
            if (isCritical) {
              barColor = 'bg-status-critical';
              statusText = 'text-status-critical';
            } else if (isOrange) {
              barColor = 'bg-[#ea580c]';
              statusText = 'text-[#ea580c]';
            } else if (isYellow) {
              barColor = 'bg-status-warning';
              statusText = 'text-status-warning';
            }

            return (
              <div key={zone.id} className="border border-border-subtle p-3.5 rounded-lg bg-surface-container-low hover:border-primary/50 transition-all">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-body-bold text-sm text-text-main truncate">{zone.name}</span>
                  <span className={`font-sans text-[10px] font-bold uppercase tracking-wider ${statusText} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${barColor} ${isCritical ? 'animate-pulse' : ''}`}></span>
                    {zone.densityStatus}
                  </span>
                </div>

                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-2 border border-border-subtle">
                  <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(densityPercent, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-sans text-on-surface-variant">
                  <span>{zone.currentDensity} / {zone.maxCapacity}</span>
                  <span className="font-bold text-text-main">{Math.round(densityPercent)}%</span>
                </div>
              </div>
            );
          })}

          {zones.length === 0 && (
            <>
              {/* Fallback Sector Cards matching design */}
              <div className="border border-border-subtle p-3.5 rounded-lg bg-surface-container-low">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-body-bold text-sm text-text-main truncate">Sector A — Main Ghat</span>
                  <span className="font-sans text-[10px] font-bold text-status-nominal flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-nominal"></span>
                    GREEN
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-2 border border-border-subtle">
                  <div className="h-full bg-status-nominal w-[32%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs font-sans text-on-surface-variant">
                  <span>160 / 500</span>
                  <span className="font-bold text-text-main">32%</span>
                </div>
              </div>

              <div className="border border-border-subtle p-3.5 rounded-lg bg-surface-container-low">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-body-bold text-sm text-text-main truncate">Sector B — East Concourse</span>
                  <span className="font-sans text-[10px] font-bold text-status-warning flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                    YELLOW
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-2 border border-border-subtle">
                  <div className="h-full bg-status-warning w-[64%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs font-sans text-on-surface-variant">
                  <span>256 / 400</span>
                  <span className="font-bold text-text-main">64%</span>
                </div>
              </div>

              <div className="border border-border-subtle p-3.5 rounded-lg bg-surface-container-low border-status-critical/30">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-body-bold text-sm text-text-main truncate">Sector C — Ghat Staircase</span>
                  <span className="font-sans text-[10px] font-bold text-status-critical flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse"></span>
                    CRITICAL
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-2 border border-border-subtle">
                  <div className="h-full bg-status-critical w-[88%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs font-sans text-on-surface-variant">
                  <span>440 / 500</span>
                  <span className="font-bold text-status-critical">88%</span>
                </div>
              </div>

              <div className="border border-border-subtle p-3.5 rounded-lg bg-surface-container-low">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-body-bold text-sm text-text-main truncate">Sector D — Corridor</span>
                  <span className="font-sans text-[10px] font-bold text-status-nominal flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-nominal"></span>
                    NOMINAL
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-2 border border-border-subtle">
                  <div className="h-full bg-status-nominal w-[41%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs font-sans text-on-surface-variant">
                  <span>246 / 600</span>
                  <span className="font-bold text-text-main">41%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

