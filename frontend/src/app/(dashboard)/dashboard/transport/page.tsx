'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { getParkingStatus, getShuttleStatus } from '@/shared/api/transport.api';
import { IParkingStatus, IShuttleStatus, TransportStatus } from '@/shared/types';

const DEMO_PARKING_LOTS = [
  {
    id: 'prk-001',
    name: 'Parking Lot B — West Satellite Ground',
    totalCapacity: 1200,
    currentOccupancy: 340,
    status: TransportStatus.OPERATIONAL,
    description: 'Main Satellite Ground (800+ spots free). Connected by EV Shuttle S-2 to Sangam Entry.',
    recommended: true,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 4 North',
    location: { latitude: 25.4380, longitude: 81.8420 },
  },
  {
    id: 'prk-002',
    name: 'Parking Lot A — Sangam North Entry',
    totalCapacity: 500,
    currentOccupancy: 395,
    status: TransportStatus.OPERATIONAL,
    description: 'Closest to Main Entry Plaza. Moderate congestion, filling rapidly.',
    recommended: false,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 1 Plaza',
    location: { latitude: 25.4410, longitude: 81.8450 },
  },
  {
    id: 'prk-003',
    name: 'Parking Lot D — South Riverbank Holding',
    totalCapacity: 800,
    currentOccupancy: 710,
    status: TransportStatus.DELAYED,
    description: 'Near South Sandbar. High vehicle density. Heavy egress delay at exit gates.',
    recommended: false,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 3 Riverfront',
    location: { latitude: 25.4300, longitude: 81.8490 },
  },
  {
    id: 'prk-004',
    name: 'Parking Lot C — VIP & Emergency Holding',
    totalCapacity: 200,
    currentOccupancy: 198,
    status: TransportStatus.FULL,
    description: 'Restricted strictly to ambulances, SDRF watercraft trailers, and police convoys.',
    recommended: false,
    fee: 'PERMIT ONLY',
    gate: 'Emergency Corridor',
    location: { latitude: 25.4340, longitude: 81.8490 },
  },
];

const DEMO_TRANSIT_ROUTES = [
  {
    id: 'sht-001',
    name: 'Route S-1: Sangam Ghat Express',
    type: 'bus',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 45,
    currentOccupancy: 18,
    departureMinutes: 3,
    fare: 'FREE GOVT SHUTTLE',
    frequency: 'Every 5 mins',
    routeInfo: 'Main Railway Link → Entry Plaza Gate 1 → Sangam Bathing Ghat',
    activeVehicles: 8,
  },
  {
    id: 'sht-002',
    name: 'Route S-2: West Parking Satellite Connector',
    type: 'bus',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 60,
    currentOccupancy: 22,
    departureMinutes: 6,
    fare: 'FREE GOVT SHUTTLE',
    frequency: 'Every 8 mins',
    routeInfo: 'West Satellite Parking → North Corridor → Central Holding Tent',
    activeVehicles: 12,
  },
  {
    id: 'sht-003',
    name: 'Route F-1: Triveni River Ferry',
    type: 'boat',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 80,
    currentOccupancy: 35,
    departureMinutes: 5,
    fare: '₹20 (Govt Regulated)',
    frequency: 'Continuous / 10 mins',
    routeInfo: 'North River Pier 2 ↔ South Sandbar Holy Dip Confluence',
    activeVehicles: 14,
  },
  {
    id: 'sht-004',
    name: 'Route F-2: Circular Confluence Cruiser',
    type: 'boat',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 120,
    currentOccupancy: 45,
    departureMinutes: 12,
    fare: '₹30 (Govt Regulated)',
    frequency: 'Every 15 mins',
    routeInfo: 'Qila Ghat ↔ Saraswati Ghat ↔ Sangam Nose Point',
    activeVehicles: 6,
  },
  {
    id: 'sht-005',
    name: 'Route E-1: Divyangjan & Senior E-Cart',
    type: 'rickshaw',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 8,
    currentOccupancy: 3,
    departureMinutes: 2,
    fare: 'FREE (Elderly & Disabled)',
    frequency: 'On-Demand / 3 mins',
    routeInfo: 'Gate 2 Drop-off ↔ Inner Ghat Staircase Ramp',
    activeVehicles: 20,
  },
];

const ROAD_CORRIDORS = [
  {
    name: 'Sangam Marg North Highway',
    status: 'OPEN',
    type: 'All Vehicles & Shuttles',
    speed: 'Normal Flow (35 km/h)',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  {
    name: 'West Ring Road (Parking Bypass)',
    status: 'RECOMMENDED',
    type: 'Pilgrim Cars & Buses',
    speed: 'Clear Traffic (45 km/h)',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'Riverfront Promenade Bund',
    status: 'SLOW',
    type: 'Shuttles & Emergency Only',
    speed: 'Heavy Pedestrian Crossing (10 km/h)',
    color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  {
    name: 'Inner Ghat Staircase Roadway',
    status: 'NO ENTRY',
    type: 'Strictly Pedestrian Walking Zone',
    speed: 'Barricaded for Crowd Safety',
    color: 'border-red-500/40 bg-red-500/10 text-red-400',
    dotColor: 'bg-red-500',
  },
];

export default function DashboardTransportPage() {
  const [parkingLots, setParkingLots] = useState(DEMO_PARKING_LOTS);
  const [transitRoutes, setTransitRoutes] = useState(DEMO_TRANSIT_ROUTES);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bus' | 'boat' | 'rickshaw'>('all');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parkingRes, shuttleRes] = await Promise.all([
          getParkingStatus(),
          getShuttleStatus(),
        ]);
        if (parkingRes?.data && Array.isArray(parkingRes.data) && parkingRes.data.length > 0) {
          const apiData = parkingRes.data;
          setParkingLots((prev) =>
            prev.map((lot, idx) => {
              const apiItem = apiData.find((p) => p.name === lot.name) || apiData[idx];
              return apiItem
                ? {
                    ...lot,
                    currentOccupancy: apiItem.currentOccupancy ?? lot.currentOccupancy,
                    totalCapacity: apiItem.totalCapacity ?? lot.totalCapacity,
                    status: (apiItem.status as any) ?? lot.status,
                  }
                : lot;
            })
          );
        }
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        // Mock fallback
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalParkingCapacity = parkingLots.reduce((acc, l) => acc + (l.totalCapacity || 0), 0);
  const totalParkingOccupancy = parkingLots.reduce((acc, l) => acc + (l.currentOccupancy || 0), 0);
  const overallParkingPct = Math.round((totalParkingOccupancy / Math.max(1, totalParkingCapacity)) * 100);
  const totalActiveFleet = transitRoutes.reduce((acc, r) => acc + (r.activeVehicles || 0), 0);

  const filteredRoutes = transitRoutes.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.type === activeFilter;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">directions_bus</span>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                Transport & Parking Command Center
              </h1>
            </div>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">
              Live telemetry for designated pilgrimage parking grounds, multimodal EV shuttles, river ferries, and road traffic corridors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/visitor/transport"
              target="_blank"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-body-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Open Public Visitor View</span>
            </Link>
            <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2.5 py-1.5 rounded border border-border-subtle">
              Telemetry: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              Total Parking Capacity
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-primary font-telemetry-md">
                {totalParkingOccupancy}
              </span>
              <span className="text-xs text-on-surface-variant font-bold">/ {totalParkingCapacity} ({overallParkingPct}%)</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all ${
                  overallParkingPct > 85 ? 'bg-red-500' : overallParkingPct > 65 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${overallParkingPct}%` }}
              />
            </div>
          </div>

          <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              Active Transit Fleet
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-status-nominal font-telemetry-md">
                {totalActiveFleet}
              </span>
              <span className="text-xs text-on-surface-variant font-bold">Vehicles & Boats</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-2">100% Fleet Operational</span>
          </div>

          <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              Recommended Egress Route
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-bold text-white truncate">
                West Ring Bypass
              </span>
            </div>
            <span className="text-[10px] text-blue-400 font-mono mt-2">Diverting 45% Traffic</span>
          </div>

          <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              Critical Parking Alert
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-bold text-red-400">
                VIP & Lot C Full (98%)
              </span>
            </div>
            <span className="text-[10px] text-red-300 font-mono mt-2">Auto-Rerouting to West Lot</span>
          </div>
        </div>

        {/* Section 1: Parking Grounds Grid */}
        <div className="hud-panel p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_parking</span>
              <h2 className="font-body-bold text-sm text-on-surface uppercase tracking-wider">
                Designated Parking Grounds Status
              </h2>
            </div>
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
              4 Designated Grounds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {parkingLots.map((lot) => {
              const cap = lot.totalCapacity || 100;
              const occ = lot.currentOccupancy || 0;
              const pct = Math.min(100, Math.round((occ / cap) * 100));
              const isFull = pct >= 90;
              const isWarning = pct >= 65 && pct < 90;
              const freeSpots = Math.max(0, cap - occ);

              return (
                <div
                  key={lot.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    lot.recommended
                      ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                      : isFull
                      ? 'bg-red-950/20 border-red-500/50'
                      : 'bg-surface-container border-border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-body-bold text-xs text-on-surface">{lot.name}</h3>
                      <span className="text-[10px] font-mono text-on-surface-variant">{lot.gate}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isFull
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isWarning
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isFull ? 'FULL' : `${freeSpots} Free`}
                    </span>
                  </div>

                  <p className="text-[11px] text-on-surface-variant line-clamp-2">{lot.description}</p>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>Occupancy: {occ} / {cap}</span>
                      <span className="font-bold text-on-surface">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Multimodal Transit Fleets & Road Corridors */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 8 Cols: Transit Fleets */}
          <div className="lg:col-span-8 hud-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">departure_board</span>
                <h2 className="font-body-bold text-sm text-on-surface uppercase tracking-wider">
                  Transit Fleets & Live Schedules
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-surface-container rounded border border-border-subtle text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded font-body-bold cursor-pointer transition-colors ${
                    activeFilter === 'all' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('bus')}
                  className={`px-2.5 py-1 rounded font-body-bold cursor-pointer transition-colors ${
                    activeFilter === 'bus' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Buses ({DEMO_TRANSIT_ROUTES.filter((r) => r.type === 'bus').length})
                </button>
                <button
                  onClick={() => setActiveFilter('boat')}
                  className={`px-2.5 py-1 rounded font-body-bold cursor-pointer transition-colors ${
                    activeFilter === 'boat' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Boats ({DEMO_TRANSIT_ROUTES.filter((r) => r.type === 'boat').length})
                </button>
                <button
                  onClick={() => setActiveFilter('rickshaw')}
                  className={`px-2.5 py-1 rounded font-body-bold cursor-pointer transition-colors ${
                    activeFilter === 'rickshaw' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  E-Carts ({DEMO_TRANSIT_ROUTES.filter((r) => r.type === 'rickshaw').length})
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredRoutes.map((route) => {
                const cap = route.totalCapacity || 40;
                const occ = route.currentOccupancy || 0;
                const freeSeats = Math.max(0, cap - occ);

                return (
                  <div
                    key={route.id}
                    className="p-3.5 rounded-lg bg-surface-container border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded bg-surface-container-high text-primary material-symbols-outlined text-lg">
                        {route.type === 'boat' ? 'sailing' : route.type === 'rickshaw' ? 'electric_rickshaw' : 'directions_bus'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-body-bold text-xs text-on-surface">{route.name}</h3>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {route.activeVehicles} Active
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{route.routeInfo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-border-subtle pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-primary block">
                          Next in {route.departureMinutes} mins
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{route.frequency}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          {freeSeats} / {cap} Seats
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{route.fare}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 4 Cols: Road Corridors */}
          <div className="lg:col-span-4 hud-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400">traffic</span>
                <h2 className="font-body-bold text-sm text-on-surface uppercase tracking-wider">
                  Road Traffic Corridors
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {ROAD_CORRIDORS.map((corridor, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex flex-col gap-1 ${corridor.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body-bold text-xs text-on-surface">{corridor.name}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface/60 uppercase">
                      {corridor.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant">{corridor.type}</p>
                  <span className="text-[10px] font-mono text-on-surface font-bold mt-1">{corridor.speed}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
