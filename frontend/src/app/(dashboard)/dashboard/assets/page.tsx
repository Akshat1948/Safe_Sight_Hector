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
  category: 'drone' | 'responder' | 'vehicle' | 'sensor' | 'shuttle' | 'medical';
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'responder' | 'drone' | 'vehicle' | 'sensor'>('all');
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
    setActionNotice(`Dispatch order transmitted to ${selectedAsset.name}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCommsLink = () => {
    setActionNotice(`Encrypted radio channel established with ${selectedAsset.name}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] min-h-[560px] gap-4 overflow-hidden">
        {/* Left Pane: Asset List & Filters (40% - 45%) */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col gap-4 overflow-hidden shrink-0">
          {/* Stats Row */}
          <div className="flex gap-3 shrink-0">
            <div className="flex-1 bg-surface border border-border-subtle rounded-lg p-3.5 shadow-sm">
              <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">
                TOTAL ASSETS
              </div>
              <div className="font-stat-lg text-2xl text-primary font-extrabold">142</div>
            </div>
            <div className="flex-1 bg-surface border border-border-subtle rounded-lg p-3.5 shadow-sm">
              <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">
                ACTIVE PATROL
              </div>
              <div className="font-stat-lg text-2xl text-tertiary font-extrabold">86</div>
            </div>
            <div className="flex-1 bg-surface border border-border-subtle rounded-lg p-3.5 shadow-sm">
              <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">
                MAINTENANCE
              </div>
              <div className="font-stat-lg text-2xl text-error font-extrabold">12</div>
            </div>
          </div>

          {/* Asset Roster Container */}
          <div className="flex-1 bg-surface border border-border-subtle rounded-lg flex flex-col overflow-hidden shadow-sm">
            {/* List Header */}
            <div className="px-4 py-3 border-b border-border-subtle bg-surface-container-low flex justify-between items-center shrink-0">
              <h2 className="font-headline-sm text-sm font-bold text-text-main uppercase tracking-tight">
                Asset Roster
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 text-xs border rounded transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setActiveFilter('responder')}
                  className={`px-2.5 py-1 text-xs border rounded transition-colors cursor-pointer ${
                    activeFilter === 'responder'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  Units
                </button>
                <button
                  onClick={() => setActiveFilter('drone')}
                  className={`px-2.5 py-1 text-xs border rounded transition-colors cursor-pointer ${
                    activeFilter === 'drone'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'border-border-subtle text-text-main hover:bg-surface-container'
                  }`}
                >
                  Drones
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
                    onClick={() => setSelectedAsset(asset)}
                    className={`bg-surface rounded-lg p-3 transition-all cursor-pointer relative shadow-sm ${
                      isSelected
                        ? 'border-2 border-primary shadow-md shadow-primary/10'
                        : 'border border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
                    )}

                    <div className="flex justify-between items-start mb-2 relative z-10 pl-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded bg-surface-container-low border flex items-center justify-center shrink-0 ${
                            isDeployed
                              ? 'border-primary/50 text-primary'
                              : isActive
                              ? 'border-tertiary/50 text-tertiary'
                              : isMaintenance
                              ? 'border-error/50 text-error'
                              : 'border-border-subtle text-secondary'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: isDeployed ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {asset.icon}
                          </span>
                        </div>
                        <div>
                          <div
                            className={`font-body-bold text-sm leading-tight ${
                              isSelected ? 'text-primary font-bold' : 'text-text-main'
                            }`}
                          >
                            {asset.name}
                          </div>
                          <div className="font-label-caps text-[10px] text-on-surface-variant mt-0.5">
                            {asset.type}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-xs font-label-caps font-bold ${
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

                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-border-subtle relative z-10 pl-1">
                      <div>
                        <span className="block font-label-caps text-[9px] text-on-surface-variant mb-[2px] uppercase">
                          ASSIGNMENT
                        </span>
                        <span className="font-telemetry-md text-xs text-text-main truncate block">
                          {asset.assignment}
                        </span>
                      </div>
                      <div>
                        <span className="block font-label-caps text-[9px] text-on-surface-variant mb-[2px] uppercase">
                          {asset.metricLabel}
                        </span>
                        <span
                          className={`font-telemetry-md text-xs font-bold ${
                            isDeployed
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

        {/* Right Pane: Map & Detail Overlay (55% - 60%) */}
        <div className="w-full md:w-[55%] lg:w-[60%] bg-surface-container-low border border-border-subtle rounded-lg relative overflow-hidden flex flex-col shadow-sm">
          {actionNotice && (
            <div className="absolute top-4 left-6 right-6 z-[500] bg-primary text-white px-4 py-2 rounded shadow-lg font-telemetry-md text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">sensors</span>
                {actionNotice}
              </div>
              <span className="text-[10px] uppercase font-bold">TRANSMITTING</span>
            </div>
          )}

          <div className="flex-1 w-full h-full relative bg-surface-container">
            <MapView
              zones={zones}
              center={selectedAsset.coordinates}
              zoom={16}
            />

            {/* Tactical Detail Overlay */}
            <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-[380px] bg-surface/95 backdrop-blur-md border border-primary/50 rounded-lg p-4 shadow-xl shadow-text-main/5 z-[400]">
              <div className="flex justify-between items-start mb-3 border-b border-border-subtle pb-2.5">
                <div>
                  <h3 className="font-headline-md text-lg font-bold text-primary">
                    {selectedAsset.name}
                  </h3>
                  <p className="font-label-caps text-[10px] text-on-surface-variant mt-0.5">
                    {selectedAsset.type}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-primary-container/20 border border-primary-container text-primary font-label-caps text-[10px] rounded font-bold">
                  {selectedAsset.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[12px]">my_location</span>
                    CURRENT COORDINATES
                  </div>
                  <div className="font-telemetry-md text-xs text-text-main bg-surface-container p-2 rounded border border-border-subtle font-mono tracking-wider">
                    {selectedAsset.coordinates[0].toFixed(4)}° N, {selectedAsset.coordinates[1].toFixed(4)}° E
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container/60 p-2 rounded border border-border-subtle">
                    <div className="font-label-caps text-[10px] text-on-surface-variant mb-0.5 uppercase">
                      VELOCITY / SPEED
                    </div>
                    <div className="font-telemetry-md text-base text-text-main font-bold">
                      {selectedAsset.speed || '38 km/h'}
                    </div>
                  </div>
                  <div className="bg-surface-container/60 p-2 rounded border border-border-subtle">
                    <div className="font-label-caps text-[10px] text-on-surface-variant mb-0.5 uppercase">
                      BATTERY / POWER
                    </div>
                    <div className="font-telemetry-md text-base text-primary font-bold">
                      {selectedAsset.fuelBattery || '88%'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex gap-2">
                  <button
                    onClick={handleCommsLink}
                    className="flex-1 bg-surface border border-border-subtle text-primary font-body-bold text-xs py-2 rounded hover:bg-surface-container transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">headset_mic</span>
                    Comms Link
                  </button>
                  <button
                    onClick={handleIssueOrders}
                    className="flex-1 bg-primary text-on-primary font-body-bold text-xs py-2 rounded hover:bg-primary-container transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Issue Orders
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
