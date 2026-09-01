'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import MapView from '@/components/map/map-view';
import { useAuth, useSocket } from '@/shared/hooks';
import { IIncident, IZone, ZoneType, DensityStatus } from '@/shared/types';
import { getIncidents, getZones } from '@/shared/api';

const DEMO_DEFAULT_ZONES: IZone[] = [
  {
    id: 'f787426f-c02c-402f-ae1a-1043f45e4c6e',
    siteId: 'cb9e2dc0-bff7-4dea-9507-8591e5f6e7c3',
    name: 'Zone C — Ghat Staircase',
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
    name: 'Zone A — Main Entry Plaza',
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
    name: 'Zone B — Riverside Ghat Corridor',
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
    name: 'Zone D — Safe Assembly & North Exit',
    zoneType: ZoneType.SAFE_ASSEMBLY,
    polygon: {
      type: 'Polygon',
      coordinates: [[[81.842, 25.439], [81.848, 25.439], [81.848, 25.443], [81.842, 25.443], [81.842, 25.439]]],
    },
    maxCapacity: 2000,
    currentDensity: 310,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

export default function RealTimeMapPage() {
  const { user } = useAuth();
  const siteId = user?.siteId || 'demo-site-prayagraj-01';
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [zones, setZones] = useState<IZone[]>(DEMO_DEFAULT_ZONES);
  const [selectedFeedIndex, setSelectedFeedIndex] = useState<number | null>(0);
  const [showBreachPopup, setShowBreachPopup] = useState(true);
  const [mobileTab, setMobileTab] = useState<'map' | 'feed'>('map');
  const [mapZoom, setMapZoom] = useState(15);
  const { on, off } = useSocket(siteId);

  useEffect(() => {
    getIncidents(siteId)
      .then((res) => {
        if (res.success && res.data?.incidents) {
          setIncidents(res.data.incidents);
        }
      })
      .catch(() => {});

    getZones(siteId)
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setZones(res.data);
        }
      })
      .catch(() => {});
  }, [siteId]);

  useEffect(() => {
    const handleNewIncident = (data: unknown) => {
      const inc = data as IIncident;
      if (inc?.id) {
        setIncidents((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);
      }
    };

    const handleDensityUpdate = (data: any) => {
      if (data?.zoneId || data?.currentDensity !== undefined) {
        setZones((prev) => {
          const currentList = prev.length > 0 ? prev : DEMO_DEFAULT_ZONES;
          const matchIndex = currentList.findIndex(
            (z) =>
              z.id === data.zoneId ||
              z.name.toLowerCase().includes('zone c') ||
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
      }
    };

    on('incident:new', handleNewIncident);
    on('incident:verified', handleNewIncident);
    on('zone:density:update', handleDensityUpdate);

    return () => {
      off('incident:new', handleNewIncident);
      off('incident:verified', handleNewIncident);
      off('zone:density:update', handleDensityUpdate);
    };
  }, [on, off]);

  const activeIncidentsCount = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'dismissed'
  ).length;

  return (
    <DashboardLayout>
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden mb-3 bg-surface border border-border-subtle rounded-lg p-1">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-1.5 text-xs font-label-caps rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'map'
              ? 'bg-primary text-white font-bold'
              : 'text-secondary hover:text-text-main'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          Tactical Map
        </button>
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-1.5 text-xs font-label-caps rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'feed'
              ? 'bg-primary text-white font-bold'
              : 'text-secondary hover:text-text-main'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
          Live Feed ({activeIncidentsCount})
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[500px] gap-4 overflow-hidden">
        {/* Left Command Stack (320px - 380px on desktop, visible on mobile when tab is 'feed') */}
        <div
          className={`w-full md:w-[320px] lg:w-[380px] shrink-0 flex flex-col gap-3 overflow-y-auto pb-2 ${
            mobileTab === 'feed' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-lg p-3 border border-border-subtle shadow-sm">
              <div className="font-label-caps text-[10px] text-secondary uppercase mb-1 tracking-wider">
                Active Incidents
              </div>
              <div className="font-stat-lg text-xl sm:text-2xl text-primary-container font-extrabold">
                {activeIncidentsCount.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-border-subtle shadow-sm">
              <div className="font-label-caps text-[10px] text-secondary uppercase mb-1 tracking-wider">
                Responders Deployed
              </div>
              <div className="font-stat-lg text-xl sm:text-2xl text-text-main font-extrabold">
                42
              </div>
            </div>
          </div>

          {/* Responder Advisor */}
          <div className="bg-surface rounded-lg border border-primary-container/40 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-primary-container/5 pointer-events-none"></div>
            <div className="border-b border-border-subtle p-2.5 sm:p-3 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-1.5 font-body-bold text-xs sm:text-sm text-text-main">
                <span className="material-symbols-outlined text-primary-container text-base">support_agent</span>
                Responder Advisor
              </div>
              <div className="font-telemetry-md text-[10px] text-secondary">Updated 2m ago</div>
            </div>

            <div className="p-3 space-y-2.5 bg-surface text-xs">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                <span className="font-body-base text-text-main">Next Shift Optimization</span>
                <span className="font-telemetry-md text-primary font-bold">18h 45m</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-status-nominal font-medium text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Auto-Routed Teams: 12
                </div>
                <div className="flex items-center gap-2 text-status-warning font-medium text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Manual Intervention Required: 3
                </div>
              </div>

              <div className="bg-surface-container rounded border border-border-subtle p-2 mt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-xs">group</span>
                    <span className="font-body-bold text-text-main text-xs">Team Alpha - Sector 7</span>
                  </div>
                  <span className="text-[8px] text-error font-label-caps border border-error/50 px-1 py-0.5 rounded font-bold">
                    REROUTE
                  </span>
                </div>
                <button className="w-full bg-primary-container text-on-primary-container font-body-bold py-1 text-xs rounded hover:bg-primary-fixed-dim transition-colors cursor-pointer">
                  Review Options
                </button>
              </div>
            </div>
          </div>

          {/* Live Event Feed */}
          <div className="bg-surface rounded-lg border border-border-subtle flex-1 flex flex-col min-h-[200px] shadow-sm overflow-hidden">
            <div className="border-b border-border-subtle p-2.5 sm:p-3 flex justify-between items-center bg-surface-container-low shrink-0">
              <div className="font-body-bold text-xs sm:text-sm text-text-main flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse"></span>
                Live Event Feed
              </div>
              <span className="material-symbols-outlined text-secondary text-sm cursor-pointer hover:text-text-main">
                filter_list
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-surface">
              {/* Feed Item 1 */}
              <div
                onClick={() => setSelectedFeedIndex(0)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  selectedFeedIndex === 0
                    ? 'bg-surface-container border-primary/60 shadow-xs'
                    : 'border-border-subtle hover:bg-surface-container-low'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-label-caps text-status-warning text-[10px] uppercase tracking-wider font-bold">
                    Constraint Violation
                  </div>
                  <div className="font-telemetry-md text-secondary text-[10px]">10:42 AM</div>
                </div>
                <p className="font-body-base text-xs text-text-main mb-1.5 leading-snug">
                  Unauthorized access detected at Perimeter North-West Gate.
                </p>
                <div className="flex gap-1.5">
                  <span className="bg-surface-container-high border border-border-subtle text-secondary text-[9px] px-1.5 py-0.5 rounded font-telemetry-md">
                    CCTV-45
                  </span>
                  <span className="bg-surface-container-high border border-border-subtle text-secondary text-[9px] px-1.5 py-0.5 rounded font-telemetry-md">
                    Zone 3
                  </span>
                </div>
              </div>

              {/* Feed Item 2 */}
              <div
                onClick={() => setSelectedFeedIndex(1)}
                className={`p-2.5 rounded border transition-all cursor-pointer border-l-3 border-l-tertiary ${
                  selectedFeedIndex === 1
                    ? 'bg-surface-container border-primary/60 shadow-xs'
                    : 'border-border-subtle hover:bg-surface-container-low'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-label-caps text-tertiary text-[10px] uppercase tracking-wider font-bold">
                    Status Update
                  </div>
                  <div className="font-telemetry-md text-secondary text-[10px]">10:38 AM</div>
                </div>
                <p className="font-body-base text-xs text-text-main leading-snug">
                  Team Bravo reported secure on-site at Data Center Alpha.
                </p>
              </div>

              {/* Feed Item 3 */}
              <div
                onClick={() => setSelectedFeedIndex(2)}
                className="p-2.5 bg-error-container/20 border border-error/30 rounded relative overflow-hidden cursor-pointer"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                <div className="flex justify-between items-start mb-1 ml-1.5">
                  <div className="font-label-caps text-error text-[10px] uppercase tracking-wider font-bold">
                    Critical Alert
                  </div>
                  <div className="font-telemetry-md text-secondary text-[10px]">10:15 AM</div>
                </div>
                <p className="font-body-base text-xs text-text-main mb-1.5 ml-1.5 leading-snug">
                  Environmental sensor failure in Sector 9. Temperature dropping rapidly.
                </p>
                <span className="ml-1.5 bg-error-container border border-error/50 text-error text-[9px] px-1.5 py-0.5 rounded font-telemetry-md uppercase font-bold">
                  Requires Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area (Visible on desktop, or when tab is 'map' on mobile) */}
        <div
          className={`flex-1 bg-surface-container-low rounded-lg border border-border-subtle relative overflow-hidden shadow-sm flex flex-col ${
            mobileTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex-1 w-full h-full min-h-[380px] relative">
            <MapView
              zones={zones}
              incidents={incidents}
              selectedZoneId={zones[0]?.id}
              center={[25.4358, 81.8463]}
              zoom={mapZoom}
            />

            {/* Map Controls */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-1.5 z-[400]">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 bg-surface/95 border border-border-subtle shadow-md rounded flex items-center justify-center text-text-main hover:bg-surface-container transition-colors backdrop-blur-sm cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm font-bold">add</span>
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 1, 10))}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 bg-surface/95 border border-border-subtle shadow-md rounded flex items-center justify-center text-text-main hover:bg-surface-container transition-colors backdrop-blur-sm cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm font-bold">remove</span>
              </button>
              <button
                onClick={() => setMapZoom(15)}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 bg-surface/95 border border-border-subtle shadow-md rounded flex items-center justify-center text-text-main hover:bg-surface-container transition-colors mt-0.5 backdrop-blur-sm cursor-pointer"
                title="Reset View"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm">layers</span>
              </button>
            </div>

            {/* Sector 7 Hub Glass Overlay */}
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 glass-panel p-3 sm:p-4 rounded-lg w-52 sm:w-64 shadow-xl border-t-2 border-t-primary-container z-[400]">
              <div className="flex items-center gap-1.5 sm:gap-2 text-text-main font-body-bold text-xs sm:text-sm mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-primary-container text-sm sm:text-base">location_on</span>
                Sector 7 Hub
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <div className="font-label-caps text-secondary text-[9px] sm:text-[10px] tracking-wider mb-0.5 uppercase">Units</div>
                  <div className="font-stat-lg text-text-main text-base sm:text-lg font-bold">14</div>
                </div>
                <div>
                  <div className="font-label-caps text-secondary text-[9px] sm:text-[10px] tracking-wider mb-0.5 uppercase">Response</div>
                  <div className="font-stat-lg text-primary text-base sm:text-lg font-bold">4.2m</div>
                </div>
              </div>
            </div>

            {/* Perimeter Breach Alert Popup */}
            {showBreachPopup && (
              <div className="absolute top-3 left-3 sm:top-auto sm:bottom-6 sm:right-6 glass-panel p-3 sm:p-4 rounded-lg w-60 sm:w-72 shadow-xl border border-error z-[400] animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="absolute inset-0 bg-error/5 pointer-events-none rounded-lg"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex items-center gap-1.5 text-error font-body-bold text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-sm sm:text-base animate-pulse">warning</span>
                    Perimeter Breach
                  </div>
                  <button
                    onClick={() => setShowBreachPopup(false)}
                    className="text-secondary hover:text-text-main cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs sm:text-sm">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 relative z-10 mb-2">
                  <div>
                    <div className="font-label-caps text-secondary text-[9px] tracking-wider uppercase">Threat</div>
                    <div className="font-telemetry-md text-error text-[11px] font-bold">CRITICAL</div>
                  </div>
                  <div>
                    <div className="font-label-caps text-secondary text-[9px] tracking-wider uppercase">En Route</div>
                    <div className="font-telemetry-md text-text-main text-[11px] font-bold">2 Teams</div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden relative z-10 border border-error/20">
                  <div className="h-full bg-error w-3/4 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
