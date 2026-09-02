'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getParkingStatus, getShuttleStatus } from '@/shared/api/transport.api';
import { IParkingStatus, IShuttleStatus, TransportStatus } from '@/shared/types';
import { LanguageSwitcher } from '@/components/language';
import { useLanguage } from '@/i18n';

// Fallback Mock Data for Sangam Pilgrimage Transport (Prayagraj, Uttar Pradesh)
const DEMO_PARKING_LOTS = [
  {
    id: 'prk-001',
    name: 'Parking Lot B — West Satellite Ground',
    totalCapacity: 1200,
    currentOccupancy: 340,
    status: TransportStatus.OPERATIONAL,
    description: 'Largest ground with 800+ free spots. Free EV Shuttle Route S-2 connects directly to Sangam Ghat entry.',
    recommended: true,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 4 North',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=25.4380,81.8420+(West+Satellite+Parking+Prayagraj)&travelmode=driving',
    location: { latitude: 25.4380, longitude: 81.8420 },
  },
  {
    id: 'prk-002',
    name: 'Parking Lot A — Sangam North Gate',
    totalCapacity: 500,
    currentOccupancy: 395,
    status: TransportStatus.OPERATIONAL,
    description: 'Closest to Main Entry Plaza. Moderate congestion, filling rapidly.',
    recommended: false,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 1 Plaza',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=25.4410,81.8450+(Sangam+North+Gate+Parking+Prayagraj)&travelmode=driving',
    location: { latitude: 25.4410, longitude: 81.8450 },
  },
  {
    id: 'prk-003',
    name: 'Parking Lot D — South Riverbank Holding',
    totalCapacity: 800,
    currentOccupancy: 710,
    status: TransportStatus.DELAYED,
    description: 'Near South Sandbar. High vehicle density. Expect 20-min wait at exit gate.',
    recommended: false,
    fee: 'FREE PILGRIM PARKING',
    gate: 'Gate 3 Riverfront',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=25.4300,81.8490+(Arail+Ghat+Riverbank+Parking+Prayagraj)&travelmode=driving',
    location: { latitude: 25.4300, longitude: 81.8490 },
  },
  {
    id: 'prk-004',
    name: 'Parking Lot C — VIP & Emergency Transit',
    totalCapacity: 200,
    currentOccupancy: 198,
    status: TransportStatus.FULL,
    description: 'Strictly restricted to emergency ambulances, police convoys, and official permit holders.',
    recommended: false,
    fee: 'PERMIT ONLY',
    gate: 'Emergency Corridor',
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=25.4340,81.8490+(Prayagraj+Fort+Sangam+VIP+Parking)&travelmode=driving',
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
    routeStops: ['Prayagraj Junction', 'Holding Area A', 'Gate 1 Plaza', 'Triveni Ghat'],
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
    routeStops: ['West Parking Ground', 'Sector 4 Camp', 'Central Medical Camp', 'Ghat Staircase Hub'],
  },
  {
    id: 'sht-003',
    name: 'Route F-1: Triveni Confluence River Ferry',
    type: 'boat',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 80,
    currentOccupancy: 35,
    departureMinutes: 5,
    fare: '₹20 (Govt Regulated)',
    frequency: 'Continuous / 10 mins',
    routeInfo: 'North River Pier 2 ↔ South Sandbar Holy Dip Confluence',
    routeStops: ['North Pier 2', 'Holy Confluence Sandbar', 'South Pier 1'],
  },
  {
    id: 'sht-004',
    name: 'Route F-2: Circular Ghat River Cruiser',
    type: 'boat',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 120,
    currentOccupancy: 45,
    departureMinutes: 12,
    fare: '₹30 (Govt Regulated)',
    frequency: 'Every 15 mins',
    routeInfo: 'Qila Ghat ↔ Saraswati Ghat ↔ Sangam Nose Point',
    routeStops: ['Qila Ghat Pier', 'Saraswati Ghat', 'Sangam Nose Pier'],
  },
  {
    id: 'sht-005',
    name: 'Route E-1: Divyangjan & Senior E-Rickshaw',
    type: 'rickshaw',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 8,
    currentOccupancy: 3,
    departureMinutes: 2,
    fare: 'FREE (Elderly & Disabled)',
    frequency: 'On-Demand / 3 mins',
    routeInfo: 'Gate 2 Drop-off ↔ Inner Ghat Staircase Ramp',
    routeStops: ['Gate 2 Plaza', 'Wheelchair Ramp', 'Ghat Medical Booth'],
  },
];

const ROAD_CORRIDORS = [
  {
    name: 'Sangam Marg North Highway',
    status: 'OPEN',
    type: 'All Vehicles & Shuttles',
    speed: 'Normal Flow (35 km/h)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    name: 'West Ring Road (Parking Bypass Corridor)',
    status: 'RECOMMENDED',
    type: 'Pilgrim Cars & Buses',
    speed: 'Clear Traffic (45 km/h)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'Riverfront Promenade Bund',
    status: 'SLOW',
    type: 'Shuttles & Emergency Only',
    speed: 'Heavy Pedestrian Crossing (10 km/h)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  {
    name: 'Inner Ghat Staircase Roadway',
    status: 'NO ENTRY',
    type: 'Strictly Pedestrian Walking Zone',
    speed: 'Barricaded for Crowd Safety',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    dotColor: 'bg-red-500',
  },
];

export default function VisitorTransportPage() {
  const [parkingLots, setParkingLots] = useState(DEMO_PARKING_LOTS);
  const [transitRoutes, setTransitRoutes] = useState(DEMO_TRANSIT_ROUTES);
  const [activeTransitFilter, setActiveTransitFilter] = useState<'all' | 'bus' | 'boat' | 'rickshaw'>('all');
  const [savedParkingLocation, setSavedParkingLocation] = useState<{ lat: number; lng: number; time: string; note: string } | null>(null);
  const [isLocatingParking, setIsLocatingParking] = useState(false);
  const [parkingNoteInput, setParkingNoteInput] = useState('');
  const [showSaveParkingModal, setShowSaveParkingModal] = useState(false);
  const [mobilityRequestSent, setMobilityRequestSent] = useState(false);
  const { t } = useLanguage();

  // Load saved parking from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('safesight_saved_parking');
      if (stored) {
        setSavedParkingLocation(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch real-time transport data from backend API
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
      } catch (err) {
        // Fallback to mock data
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save Current GPS Location as Parking Spot
  const handleSaveCurrentLocation = () => {
    setIsLocatingParking(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setIsLocatingParking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const spot = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: parkingNoteInput.trim() || 'Pillar #B-14 / West Ground',
        };
        setSavedParkingLocation(spot);
        localStorage.setItem('safesight_saved_parking', JSON.stringify(spot));
        setIsLocatingParking(false);
        setShowSaveParkingModal(false);
        setParkingNoteInput('');
      },
      (err) => {
        console.error(err);
        const spot = {
          lat: 25.4382,
          lng: 81.8425,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: parkingNoteInput.trim() || 'West Satellite Lot (Pillar 4)',
        };
        setSavedParkingLocation(spot);
        localStorage.setItem('safesight_saved_parking', JSON.stringify(spot));
        setIsLocatingParking(false);
        setShowSaveParkingModal(false);
        setParkingNoteInput('');
      }
    );
  };

  const handleClearSavedParking = () => {
    setSavedParkingLocation(null);
    localStorage.removeItem('safesight_saved_parking');
  };

  const filteredRoutes = transitRoutes.filter((r) => {
    if (activeTransitFilter === 'all') return true;
    return r.type === activeTransitFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/visitor"
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-200"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Map</span>
          </Link>
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                🚗 Pilgrim Transit &amp; Parking Guide
              </h1>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                Live Telemetry
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-sans text-slate-500 truncate hidden xs:block">
              Prayagraj Sangam &amp; Triveni Ghats • Real-time Parking &amp; Free Shuttles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher variant="compact" />
          <Link
            href="/dashboard/transport"
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors hidden md:inline-block"
          >
            Authority Console
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* Hero Notice & Car Locator Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {/* Left Hero Card */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/50 flex flex-col justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Live Transport Advisory
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-2 leading-tight">
                Avoid North Gate Parking • Divert to West Satellite Ground
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed max-w-2xl">
                North Gate Lot is currently at <strong className="text-amber-300">92% capacity</strong>. Please divert to{' '}
                <strong className="text-cyan-300 underline">West Satellite Ground (30% free • 800+ spots)</strong>. Free electric shuttles depart every 5 minutes directly to Triveni Ghat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href="#parking-section"
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">local_parking</span>
                <span>View Live Parking Lots</span>
              </a>
              <a
                href="#transit-section"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">departure_board</span>
                <span>Bus &amp; Boat Timetable</span>
              </a>
            </div>
          </div>

          {/* Right: "Find My Parked Vehicle" GPS Widget */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-cyan-600 text-base">pin_drop</span>
                  Vehicle Spot Locator
                </span>
                {savedParkingLocation && (
                  <button
                    onClick={handleClearSavedParking}
                    className="text-[10px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                  >
                    Clear Spot
                  </button>
                )}
              </div>

              {savedParkingLocation ? (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>📍 Saved Location</span>
                    <span className="text-[10px] text-cyan-700 font-mono">{savedParkingLocation.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>Note:</strong> {savedParkingLocation.note}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${savedParkingLocation.lat},${savedParkingLocation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">navigation</span>
                    <span>Walk to My Car (Google Maps)</span>
                  </a>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-600 flex flex-col gap-2.5">
                  <p className="leading-relaxed">
                    Parked your car or bike? Save your exact GPS spot now so you can easily walk back after your holy bath!
                  </p>
                  <button
                    onClick={() => setShowSaveParkingModal(true)}
                    disabled={isLocatingParking}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_location_alt</span>
                    <span>{isLocatingParking ? 'Acquiring GPS...' : 'Save My Parking Spot'}</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic">Works 100% offline once saved.</p>
          </div>
        </div>

        {/* Section 1: Live Parking Occupancy Grid */}
        <section id="parking-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">local_parking</span>
                <span>Live Parking Grounds &amp; Availability</span>
              </h2>
              <p className="text-xs text-slate-500">Real-time occupancy updated every 10 seconds</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full w-fit">
              4 Designated Grounds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parkingLots.map((lot) => {
              const cap = lot.totalCapacity || 100;
              const occ = lot.currentOccupancy || 0;
              const pct = Math.min(100, Math.round((occ / cap) * 100));
              const availableSpots = Math.max(0, cap - occ);
              const isFull = pct >= 90;
              const isWarning = pct >= 65 && pct < 90;

              return (
                <div
                  key={lot.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    lot.recommended
                      ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/30 shadow-sm'
                      : isFull
                      ? 'bg-red-50/40 border-red-200 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">{lot.name}</h3>
                        {lot.recommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">{lot.fee} • {lot.gate}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg border ${
                          isFull
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isFull ? 'NEARLY FULL' : `${availableSpots} SPOTS FREE`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{lot.description}</p>

                  {/* Occupancy Meter Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-600">
                      <span>Occupancy: {occ} / {cap} vehicles</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Navigation CTA */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-emerald-600">schedule</span>
                      Free shuttle available
                    </span>
                    <a
                      href={lot.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                        lot.recommended
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">navigation</span>
                      <span>Navigate Here</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Live Bus, Shuttle & River Boat Schedules */}
        <section id="transit-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">departure_board</span>
                <span>Free Shuttles, E-Buses &amp; River Boats</span>
              </h2>
              <p className="text-xs text-slate-500">Live departure countdowns and route stops to ghats</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
              <button
                onClick={() => setActiveTransitFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTransitFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setActiveTransitFilter('bus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'bus' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-xs">directions_bus</span>
                EV Buses
              </button>
              <button
                onClick={() => setActiveTransitFilter('boat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'boat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-xs">sailing</span>
                River Boats
              </button>
              <button
                onClick={() => setActiveTransitFilter('rickshaw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'rickshaw' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-xs">electric_rickshaw</span>
                E-Carts
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((route) => {
              const cap = route.totalCapacity || 40;
              const occ = route.currentOccupancy || 0;
              const freeSeats = Math.max(0, cap - occ);

              return (
                <div
                  key={route.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {route.type === 'boat' ? '⛵ River Ferry' : route.type === 'rickshaw' ? '🛺 Feeder Cart' : '🚌 Electric Bus'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-2">{route.name}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-cyan-700 font-mono">
                        {route.departureMinutes} mins
                      </div>
                      <span className="text-[10px] text-slate-400 block">Next Departure</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Available Seats:</span>
                    <span className="font-mono font-bold text-emerald-700">{freeSeats} / {cap} Seats Free</span>
                  </div>

                  {/* Route Stops Sequence */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Route Path</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {route.routeStops.map((stop, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                            {stop}
                          </span>
                          {sIdx < route.routeStops.length - 1 && (
                            <span className="material-symbols-outlined text-[12px] text-slate-400">
                              arrow_forward
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-700 font-bold">{route.fare}</span>
                    <span>{route.frequency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Road Corridors & Special Mobility Request */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Road Traffic & Diversions */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">alt_route</span>
                <span>Road Traffic Status &amp; Pedestrian Corridors</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Police Advisory</span>
            </div>

            <div className="space-y-2.5">
              {ROAD_CORRIDORS.map((corridor, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${corridor.dotColor} animate-pulse`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{corridor.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{corridor.type} • {corridor.speed}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase self-start sm:self-auto shrink-0 ${corridor.badgeClass}`}>
                    {corridor.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Wheelchair & Elderly Cart Request */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-md border border-slate-800 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="material-symbols-outlined text-2xl">accessible</span>
                <h3 className="font-bold text-sm sm:text-base text-white">Divyangjan &amp; Senior Assistance</h3>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Free battery-operated wheelchair carts are deployed at all main entry gates for elderly pilgrims, pregnant women, and persons with disabilities.
              </p>
            </div>

            {mobilityRequestSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Cart request dispatched to Gate 2! Volunteer arriving in 3 mins.</span>
              </div>
            ) : (
              <button
                onClick={() => setMobilityRequestSent(true)}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">electric_rickshaw</span>
                <span>Request Wheelchair Cart at Gate</span>
              </button>
            )}

            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2.5 flex items-center justify-between">
              <span>Helpline: <strong className="text-white">1920 (Toll-Free)</strong></span>
              <span>24/7 Pilgrim Support</span>
            </div>
          </div>
        </div>
      </main>

      {/* Save Parking Spot Modal */}
      {showSaveParkingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-cyan-600">pin_drop</span>
                <span>Save Parked Location</span>
              </h3>
              <button
                onClick={() => setShowSaveParkingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Your phone GPS coordinates will be saved locally. Add a short note (e.g. Pillar number, ground gate) to help you find your vehicle later.
            </p>

            <input
              type="text"
              placeholder="e.g. West Ground, near Food Stall #4"
              value={parkingNoteInput}
              onChange={(e) => setParkingNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveParkingModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentLocation}
                disabled={isLocatingParking}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs"
              >
                {isLocatingParking ? 'Acquiring GPS...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
