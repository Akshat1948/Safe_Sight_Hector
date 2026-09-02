'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import MapView from '@/components/map/map-view';
import { useAuth } from '@/shared/hooks';
import { getParkingStatus, getShuttleStatus, getZones } from '@/shared/api';
import { IZone } from '@/shared/types';

interface AssetItem {
  id: string;
  name: string;
  type: string;
  category: 'drone' | 'responder' | 'vehicle' | 'sensor' | 'shuttle' | 'medical' | 'fire';
  icon: string;
  status: 'ACTIVE' | 'DEPLOYED' | 'IDLE' | 'MAINTENANCE' | 'STANDBY';
  assignment: string;
  metricLabel: string;
  metricValue: string;
  coordinates: [number, number];
  speed?: string;
  fuelBattery?: string;
}

const INITIAL_ASSETS: AssetItem[] = [
  // 1. Tactical Units (Responders)
  {
    id: 'asset-1',
    name: 'Unit Bravo-Tango',
    type: 'Tactical Response Team',
    category: 'responder',
    icon: 'directions_run',
    status: 'DEPLOYED',
    assignment: 'Incident #8892 (Sector C Staircase)',
    metricLabel: 'ETA TO TARGET',
    metricValue: '02:14m',
    coordinates: [25.4358, 81.8463],
    speed: '45 km/h',
    fuelBattery: '92%',
  },
  {
    id: 'asset-1b',
    name: 'Unit Charlie-Echo',
    type: 'Crowd Marshalling & Dispersal Squad',
    category: 'responder',
    icon: 'shield_person',
    status: 'ACTIVE',
    assignment: 'Gate 3 Inflow Flow Regulation',
    metricLabel: 'OFFICERS DEPLOYED',
    metricValue: '12 Personnel',
    coordinates: [25.4362, 81.8445],
    speed: '4 km/h',
    fuelBattery: '96%',
  },

  // 2. Ambulances & Emergency Medical Services (EMS)
  {
    id: 'asset-amb-1',
    name: 'Ambulance ALS-01 (Mobile ICU)',
    type: 'Advanced Cardiac Life Support Ambulance',
    category: 'medical',
    icon: 'ambulance',
    status: 'DEPLOYED',
    assignment: 'Sangam Ghat Gate 3 Emergency Post',
    metricLabel: 'O2 & ICU READINESS',
    metricValue: '100% (STABLE)',
    coordinates: [25.4365, 81.8475],
    speed: '55 km/h',
    fuelBattery: '90%',
  },
  {
    id: 'asset-amb-2',
    name: 'Ambulance BLS-04 (Triage Van)',
    type: 'Basic Life Support & First Aid Evac',
    category: 'medical',
    icon: 'medical_services',
    status: 'ACTIVE',
    assignment: 'North Parking Holding Area #2',
    metricLabel: 'PATIENT CAPACITY',
    metricValue: '4 Stretchers Ready',
    coordinates: [25.4332, 81.8415],
    speed: '30 km/h',
    fuelBattery: '96%',
  },
  {
    id: 'asset-amb-3',
    name: 'Riverboat Ambulance Aqua-02',
    type: 'Waterborne Medical Rescue Craft',
    category: 'medical',
    icon: 'emergency',
    status: 'STANDBY',
    assignment: 'Pontoon Bridge #2 Corridor Patrol',
    metricLabel: 'PARAMEDICS ON-BOARD',
    metricValue: '4 Specialists',
    coordinates: [25.4348, 81.8488],
    speed: '0 km/h',
    fuelBattery: '94%',
  },

  // 3. Fire Brigade & Rapid Intervention Units
  {
    id: 'asset-fire-1',
    name: 'Fire Brigade Tender Hydra-09',
    type: 'Heavy Foam & Water Pumper (4500L)',
    category: 'fire',
    icon: 'local_fire_department',
    status: 'ACTIVE',
    assignment: 'Tent City Sector 4 Fire Station',
    metricLabel: 'WATER CAPACITY',
    metricValue: '4,500 L (FULL)',
    coordinates: [25.4392, 81.8435],
    speed: '42 km/h',
    fuelBattery: '91%',
  },
  {
    id: 'asset-fire-2',
    name: 'Fire Rapid Bike Blaze-02',
    type: 'Mist Foam Quick Intervention Bike',
    category: 'fire',
    icon: 'local_fire_department',
    status: 'DEPLOYED',
    assignment: 'East Chokepoint Fast Response Hub',
    metricLabel: 'PRESSURE PSI',
    metricValue: '300 PSI (ARMED)',
    coordinates: [25.4372, 81.8452],
    speed: '48 km/h',
    fuelBattery: '86%',
  },
  {
    id: 'asset-fire-3',
    name: 'Fire Water Bowser WB-03',
    type: 'Tactical High-Volume Water Tanker (8000L)',
    category: 'fire',
    icon: 'local_fire_department',
    status: 'STANDBY',
    assignment: 'Corridor B Water Hydrant Refill Post',
    metricLabel: 'HYDRANT PRESSURE',
    metricValue: '12.5 BAR',
    coordinates: [25.4405, 81.846],
    speed: '0 km/h',
    fuelBattery: '98%',
  },

  // 4. Surveillance Drones
  {
    id: 'asset-2',
    name: 'DRN-Aero-74',
    type: 'Class III Surveillance Quadcopter',
    category: 'drone',
    icon: 'flight',
    status: 'ACTIVE',
    assignment: 'Sector 9 Perimeter Patrol',
    metricLabel: 'BATTERY',
    metricValue: '78%',
    coordinates: [25.4385, 81.8495],
    speed: '62 km/h',
    fuelBattery: '78%',
  },
  {
    id: 'asset-2b',
    name: 'DRN-Thermal-X2',
    type: 'FLIR Thermal Crowd Analyzer Drone',
    category: 'drone',
    icon: 'flight',
    status: 'ACTIVE',
    assignment: 'Riverfront Night Thermal Scan',
    metricLabel: 'OPTICAL ZOOM',
    metricValue: '30x FLIR Active',
    coordinates: [25.437, 81.851],
    speed: '50 km/h',
    fuelBattery: '82%',
  },

  // 5. Vehicles, Shuttles & Infrastructure Sensors
  {
    id: 'asset-3',
    name: 'VHL-Ground-04',
    type: 'Armored Rapid Transport',
    category: 'vehicle',
    icon: 'local_shipping',
    status: 'IDLE',
    assignment: 'Stationed at Depot Alpha',
    metricLabel: 'FUEL',
    metricValue: '94%',
    coordinates: [25.432, 81.841],
    speed: '0 km/h',
    fuelBattery: '94%',
  },
  {
    id: 'asset-4',
    name: 'SNR-Perimeter-12',
    type: 'Thermal Crowd Density Sensor',
    category: 'sensor',
    icon: 'settings_suggest',
    status: 'MAINTENANCE',
    assignment: 'North-West Gate Array',
    metricLabel: 'DIAGNOSTIC',
    metricValue: 'ERR-402',
    coordinates: [25.441, 81.844],
    speed: 'N/A',
    fuelBattery: '100%',
  },
  {
    id: 'asset-5',
    name: 'SHT-Electric-02',
    type: 'EV Public Shuttle (50 Pax)',
    category: 'shuttle',
    icon: 'directions_bus',
    status: 'ACTIVE',
    assignment: 'North Parking ➔ Sangam Ghat',
    metricLabel: 'NEXT DEPARTURE',
    metricValue: '04:00m',
    coordinates: [25.4345, 81.843],
    speed: '28 km/h',
    fuelBattery: '84%',
  },
];

export default function AssetTrackingPage() {
  const { user } = useAuth();
  const siteId = user?.siteId || 'demo-site-prayagraj-01';
  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem>(INITIAL_ASSETS[0]);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'responder' | 'drone' | 'medical' | 'fire' | 'vehicle' | 'shuttle'
  >('all');
  const [mobileTab, setMobileTab] = useState<'roster' | 'map'>('roster');
  const [zones, setZones] = useState<IZone[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    getZones(siteId).then((res) => {
      if (res.success && res.data) setZones(res.data);
    });

    Promise.all([getParkingStatus(siteId), getShuttleStatus(siteId)]).catch(console.error);
  }, [siteId]);

  const filteredAssets = assets.filter((asset) => {
    if (activeFilter === 'all') return true;
    return asset.category === activeFilter;
  });

  const handleIssueOrders = () => {
    const verb =
      selectedAsset.category === 'medical'
        ? 'Emergency medical priority dispatch'
        : selectedAsset.category === 'fire'
        ? 'Fire response & water deployment order'
        : selectedAsset.category === 'drone'
        ? 'Aerial flight vector update'
        : 'Tactical mission directive';
    setActionNotice(`${verb} transmitted to ${selectedAsset.name}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCommsLink = () => {
    setActionNotice(`Encrypted radio channel established with ${selectedAsset.name}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Dynamic counts for filter badges
  const totalCount = assets.length;
  const unitCount = assets.filter((a) => a.category === 'responder').length;
  const droneCount = assets.filter((a) => a.category === 'drone').length;
  const ambCount = assets.filter((a) => a.category === 'medical').length;
  const fireCount = assets.filter((a) => a.category === 'fire').length;
  const vehicleCount = assets.filter((a) => a.category === 'vehicle' || a.category === 'shuttle').length;
  const deployedCount = assets.filter((a) => a.status === 'DEPLOYED' || a.status === 'ACTIVE').length;
  const standbyCount = assets.filter((a) => a.status === 'STANDBY' || a.status === 'IDLE').length;
  const maintCount = assets.filter((a) => a.status === 'MAINTENANCE').length;

  return (
    <DashboardLayout>
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden mb-3 bg-surface border border-border-subtle rounded-lg p-1">
        <button
          onClick={() => setMobileTab('roster')}
          className={`flex-1 py-1.5 text-xs font-label-caps rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'roster'
              ? 'bg-primary text-white font-bold'
              : 'text-secondary hover:text-text-main'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">list</span>
          Roster ({filteredAssets.length})
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-1.5 text-xs font-label-caps rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'map'
              ? 'bg-primary text-white font-bold'
              : 'text-secondary hover:text-text-main'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">pin_drop</span>
          Live Map
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[500px] gap-4 overflow-hidden">
        {/* Left Pane: Asset List & Filters (40% - 45% on desktop, visible when tab is 'roster' on mobile) */}
        <div
          className={`w-full md:w-[48%] lg:w-[42%] flex-col gap-3 overflow-hidden shrink-0 ${
            mobileTab === 'roster' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="bg-surface border border-border-subtle rounded-lg p-2.5 sm:p-3 shadow-sm">
              <div className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mb-0.5 uppercase tracking-wider">
                TOTAL ASSETS
              </div>
              <div className="font-stat-lg text-lg sm:text-2xl text-primary font-extrabold">{totalCount}</div>
            </div>
            <div className="bg-surface border border-border-subtle rounded-lg p-2.5 sm:p-3 shadow-sm">
              <div className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mb-0.5 uppercase tracking-wider">
                ACTIVE / DEPLOYED
              </div>
              <div className="font-stat-lg text-lg sm:text-2xl text-tertiary font-extrabold">{deployedCount}</div>
            </div>
            <div className="bg-surface border border-border-subtle rounded-lg p-2.5 sm:p-3 shadow-sm">
              <div className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mb-0.5 uppercase tracking-wider">
                STANDBY / MAINT
              </div>
              <div className="font-stat-lg text-lg sm:text-2xl text-error font-extrabold">{standbyCount + maintCount}</div>
            </div>
          </div>

          {/* Asset Roster Container */}
          <div className="flex-1 bg-surface border border-border-subtle rounded-lg flex flex-col overflow-hidden shadow-sm">
            {/* List Header & Multi-Category Filter Bar */}
            <div className="px-3 sm:px-4 py-2.5 border-b border-border-subtle bg-surface-container-low flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-sm text-xs sm:text-sm font-bold text-text-main uppercase tracking-tight flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">emergency_share</span>
                  Fleet & Asset Tracking Roster
                </h2>
                <span className="text-[11px] font-mono text-on-surface-variant">
                  {filteredAssets.length} of {totalCount}
                </span>
              </div>

              {/* Scrollable Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white border-primary font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setActiveFilter('responder')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'responder'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">directions_run</span>
                  Units ({unitCount})
                </button>
                <button
                  onClick={() => setActiveFilter('medical')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'medical'
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">ambulance</span>
                  Ambulances ({ambCount})
                </button>
                <button
                  onClick={() => setActiveFilter('fire')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'fire'
                      ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  Fire Brigade ({fireCount})
                </button>
                <button
                  onClick={() => setActiveFilter('drone')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'drone'
                      ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">flight</span>
                  Drones ({droneCount})
                </button>
                <button
                  onClick={() => setActiveFilter('vehicle')}
                  className={`px-2.5 py-1 text-[11px] border rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'vehicle'
                      ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  Vehicles ({vehicleCount})
                </button>
              </div>
            </div>

            {/* Scrollable Asset List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-surface-container-low">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset.id === asset.id;
                const isDeployed = asset.status === 'DEPLOYED';
                const isActive = asset.status === 'ACTIVE';
                const isMaintenance = asset.status === 'MAINTENANCE';

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      // On mobile, automatically show map when asset selected
                      if (window.innerWidth < 768) {
                        setMobileTab('map');
                      }
                    }}
                    className={`bg-surface rounded-lg p-2.5 sm:p-3 transition-all cursor-pointer relative shadow-sm ${
                      isSelected
                        ? 'border-2 border-primary shadow-md shadow-primary/10'
                        : 'border border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
                    )}

                    <div className="flex justify-between items-start mb-1.5 relative z-10 pl-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded border flex items-center justify-center shrink-0 ${
                            asset.category === 'medical'
                              ? 'border-red-500/40 text-red-500 bg-red-500/10'
                              : asset.category === 'fire'
                              ? 'border-orange-500/40 text-orange-500 bg-orange-500/10'
                              : asset.category === 'drone'
                              ? 'border-cyan-500/40 text-cyan-500 bg-cyan-500/10'
                              : asset.category === 'responder'
                              ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                              : isDeployed
                              ? 'border-primary/50 text-primary bg-primary/10'
                              : isActive
                              ? 'border-tertiary/50 text-tertiary bg-tertiary/10'
                              : isMaintenance
                              ? 'border-error/50 text-error bg-error/10'
                              : 'border-border-subtle text-secondary bg-surface-container-low'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[18px] sm:text-[20px]"
                            style={{ fontVariationSettings: isDeployed ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {asset.icon}
                          </span>
                        </div>
                        <div>
                          <div
                            className={`font-body-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5 ${
                              isSelected ? 'text-primary font-bold' : 'text-text-main'
                            }`}
                          >
                            {asset.name}
                          </div>
                          <div className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                            <span className="uppercase font-bold tracking-wider">
                              [{asset.category}]
                            </span>
                            • {asset.type}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[11px] font-label-caps font-bold ${
                          isDeployed
                            ? 'text-primary'
                            : isActive
                            ? 'text-tertiary'
                            : isMaintenance
                            ? 'text-error'
                            : 'text-secondary'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isDeployed
                              ? 'bg-primary radar-pulse'
                              : isActive
                              ? 'bg-tertiary radar-pulse'
                              : isMaintenance
                              ? 'bg-error'
                              : 'bg-secondary'
                          }`}
                        ></div>
                        <span>{asset.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-subtle relative z-10 pl-1">
                      <div>
                        <span className="block font-label-caps text-[8px] sm:text-[9px] text-on-surface-variant mb-[2px] uppercase">
                          ASSIGNMENT
                        </span>
                        <span className="font-telemetry-md text-[11px] sm:text-xs text-text-main truncate block">
                          {asset.assignment}
                        </span>
                      </div>
                      <div>
                        <span className="block font-label-caps text-[8px] sm:text-[9px] text-on-surface-variant mb-[2px] uppercase">
                          {asset.metricLabel}
                        </span>
                        <span
                          className={`font-telemetry-md text-[11px] sm:text-xs font-bold ${
                            asset.category === 'medical'
                              ? 'text-red-500'
                              : asset.category === 'fire'
                              ? 'text-orange-500'
                              : isDeployed
                              ? 'text-primary'
                              : isActive
                              ? 'text-tertiary'
                              : 'text-text-main'
                          }`}
                        >
                          {asset.metricValue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Map & Detail Overlay (55% - 60% on desktop, visible when tab is 'map' on mobile) */}
        <div
          className={`w-full md:w-[52%] lg:w-[58%] bg-surface-container-low border border-border-subtle rounded-lg relative overflow-hidden flex-col shadow-sm ${
            mobileTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {actionNotice && (
            <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 z-[500] bg-primary text-white px-3 sm:px-4 py-2 rounded shadow-lg font-telemetry-md text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">sensors</span>
                {actionNotice}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold">TRANSMITTING</span>
            </div>
          )}

          <div className="flex-1 w-full h-full min-h-[380px] relative bg-surface-container">
            <MapView
              zones={zones}
              center={selectedAsset.coordinates}
              zoom={16}
            />

            {/* Tactical Detail Overlay */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 lg:right-auto lg:w-[380px] bg-surface/95 backdrop-blur-md border border-primary/50 rounded-lg p-3 sm:p-4 shadow-xl shadow-text-main/5 z-[400]">
              <div className="flex justify-between items-start mb-2 sm:mb-3 border-b border-border-subtle pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        selectedAsset.category === 'medical'
                          ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                          : selectedAsset.category === 'fire'
                          ? 'bg-orange-500/20 text-orange-500 border border-orange-500/40'
                          : selectedAsset.category === 'drone'
                          ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40'
                          : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                      }`}
                    >
                      {selectedAsset.category}
                    </span>
                    <h3 className="font-headline-md text-sm sm:text-base font-bold text-primary">
                      {selectedAsset.name}
                    </h3>
                  </div>
                  <p className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5">
                    {selectedAsset.type}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-primary-container/20 border border-primary-container text-primary font-label-caps text-[9px] sm:text-[10px] rounded font-bold">
                  {selectedAsset.status}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="font-label-caps text-[9px] sm:text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[12px]">my_location</span>
                    COORDINATES & SECTOR
                  </div>
                  <div className="font-telemetry-md text-[11px] text-text-main bg-surface-container p-1.5 rounded border border-border-subtle font-mono tracking-wider flex justify-between items-center">
                    <span>{selectedAsset.coordinates[0].toFixed(4)}° N, {selectedAsset.coordinates[1].toFixed(4)}° E</span>
                    <span className="text-[10px] text-on-surface-variant font-sans">{selectedAsset.assignment}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container/60 p-1.5 rounded border border-border-subtle">
                    <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                      VELOCITY / STATUS
                    </div>
                    <div className="font-telemetry-md text-xs sm:text-sm text-text-main font-bold">
                      {selectedAsset.speed || '38 km/h'}
                    </div>
                  </div>
                  <div className="bg-surface-container/60 p-1.5 rounded border border-border-subtle">
                    <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                      {selectedAsset.metricLabel}
                    </div>
                    <div
                      className={`font-telemetry-md text-xs sm:text-sm font-bold ${
                        selectedAsset.category === 'medical'
                          ? 'text-red-500'
                          : selectedAsset.category === 'fire'
                          ? 'text-orange-500'
                          : 'text-primary'
                      }`}
                    >
                      {selectedAsset.metricValue}
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-border-subtle flex gap-2">
                  <button
                    onClick={handleCommsLink}
                    className="flex-1 bg-surface border border-border-subtle text-primary font-body-bold text-xs py-1.5 sm:py-2 rounded hover:bg-surface-container transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">headset_mic</span>
                    Radio Link
                  </button>
                  <button
                    onClick={handleIssueOrders}
                    className={`flex-1 text-white font-body-bold text-xs py-1.5 sm:py-2 rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1 ${
                      selectedAsset.category === 'medical'
                        ? 'bg-red-600 hover:bg-red-700'
                        : selectedAsset.category === 'fire'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : selectedAsset.category === 'drone'
                        ? 'bg-cyan-600 hover:bg-cyan-700'
                        : 'bg-primary hover:bg-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {selectedAsset.category === 'medical'
                      ? 'Dispatch EMS'
                      : selectedAsset.category === 'fire'
                      ? 'Dispatch Fire'
                      : selectedAsset.category === 'drone'
                      ? 'Flight Vector'
                      : 'Issue Orders'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
