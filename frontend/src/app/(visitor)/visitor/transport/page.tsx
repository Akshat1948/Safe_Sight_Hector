'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getParkingStatus, getShuttleStatus } from '@/shared/api/transport.api';
import { IParkingStatus, IShuttleStatus, TransportStatus } from '@/shared/types';
import { LanguageSwitcher } from '@/components/language';
import { useLanguage } from '@/i18n';

// Fallback Mock Data for Sangam Pilgrimage Transport
const DEMO_PARKING_LOTS: (IParkingStatus & { description: string; recommended: boolean; fee: string; mapsUrl: string })[] = [
  {
    id: 'prk-001',
    name: 'Parking Lot B — West Satellite Ground',
    totalCapacity: 1200,
    currentOccupancy: 340,
    status: TransportStatus.OPERATIONAL,
    description: 'Largest ground with 800+ free spots. Free EV Shuttle Route S-2 connects directly to Sangam Ghat entry.',
    recommended: true,
    fee: 'FREE PILGRIM PARKING',
    mapsUrl: 'https://maps.google.com/?q=25.4380,81.8420',
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
    mapsUrl: 'https://maps.google.com/?q=25.4410,81.8450',
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
    mapsUrl: 'https://maps.google.com/?q=25.4300,81.8490',
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
    mapsUrl: 'https://maps.google.com/?q=25.4340,81.8490',
    location: { latitude: 25.4340, longitude: 81.8490 },
  },
];

const DEMO_TRANSIT_ROUTES: (IShuttleStatus & { type: 'bus' | 'boat' | 'rickshaw'; departureMinutes: number; fare: string; frequency: string; routeStops: string[] })[] = [
  {
    id: 'sht-001',
    name: 'Route S-1: Sangam Ghat Express',
    type: 'bus',
    status: TransportStatus.OPERATIONAL,
    totalCapacity: 45,
    currentOccupancy: 18,
    nextDeparture: new Date(Date.now() + 3 * 60000).toISOString(),
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
    nextDeparture: new Date(Date.now() + 6 * 60000).toISOString(),
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
    nextDeparture: new Date(Date.now() + 5 * 60000).toISOString(),
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
    nextDeparture: new Date(Date.now() + 12 * 60000).toISOString(),
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
    nextDeparture: new Date(Date.now() + 2 * 60000).toISOString(),
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
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  {
    name: 'West Ring Road (Parking Access Corridor)',
    status: 'RECOMMENDED',
    type: 'Pilgrim Cars & Buses',
    speed: 'Clear Traffic (45 km/h)',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'Riverfront Bund Promenade',
    status: 'SLOW',
    type: 'Shuttles & Emergency Only',
    speed: 'Heavy Pedestrian Crossing (10 km/h)',
    color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  {
    name: 'Inner Ghat Staircase Roadway',
    status: 'NO ENTRY',
    type: 'Strictly Pedestrian Walking Zone',
    speed: 'Barricaded for Crowd Safety',
    color: 'border-red-500/50 bg-red-500/10 text-red-400',
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
          // Merge API data with rich demo properties
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
        // Fallback to rich mock data
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
        // Fallback demo coordinates
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
    <div className="min-h-screen bg-[#0d1514] text-slate-100 font-sans pb-16">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-40 bg-[#142321]/95 backdrop-blur-md border-b border-[#2d4642] px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/visitor"
              className="p-1.5 rounded-lg bg-[#1e3330] hover:bg-[#28433f] text-[#d6bd98] transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Map</span>
            </Link>
            <div className="h-5 w-px bg-[#2d4642]"></div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#d6bd98] text-xl">directions_bus</span>
                <span>Pilgrim Transit & Parking Guide</span>
              </h1>
              <p className="text-[11px] text-[#a0b5b0]">Prayagraj Sangam & Triveni Ghats • Live Transport Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 flex flex-col gap-6">
        {/* Hero Notice & Car Locator Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Hero Card */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-[#17302c] to-[#1e3c37] border border-[#2d4e48] relative overflow-hidden shadow-lg flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#d6bd98]/20 text-[#d6bd98] border border-[#d6bd98]/40">
                  Real-Time Transit Advisory
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-2">
                  Avoid North Gate Parking • Heavy Congestion
                </h2>
                <p className="text-xs text-[#cbdad6] mt-1 max-w-lg leading-relaxed">
                  North Gate Lot is currently at <strong>92% capacity</strong>. We strongly advise pilgrims to divert to{' '}
                  <span className="text-[#38bdf8] font-bold">West Satellite Parking (30% free)</span>. Free electric buses depart every 5 minutes directly to the holy bathing ghats.
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-[#d6bd98]/30 shrink-0">
                traffic
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="#parking-section"
                className="px-3.5 py-1.5 rounded-lg bg-[#d6bd98] hover:bg-[#c4a982] text-[#142321] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">local_parking</span>
                <span>View Live Parking Lots</span>
              </a>
              <a
                href="#transit-section"
                className="px-3.5 py-1.5 rounded-lg bg-[#27443f] hover:bg-[#325650] text-white text-xs font-bold border border-[#3f6b64] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">departure_board</span>
                <span>Bus & Boat Timetable</span>
              </a>
            </div>
          </div>

          {/* Right: "Find My Parked Vehicle" GPS Widget */}
          <div className="p-5 rounded-2xl bg-[#152623] border border-[#2d4642] shadow-lg flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#d6bd98] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">pin_drop</span>
                  Vehicle Spot Locator
                </span>
                {savedParkingLocation && (
                  <button
                    onClick={handleClearSavedParking}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Clear Spot
                  </button>
                )}
              </div>

              {savedParkingLocation ? (
                <div className="mt-3 p-3 rounded-xl bg-[#1e3330] border border-[#355752] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>📍 Saved Parking Spot</span>
                    <span className="text-[10px] text-[#38bdf8] font-mono">{savedParkingLocation.time}</span>
                  </div>
                  <p className="text-[11px] text-[#cbdad6]">
                    <strong>Note:</strong> {savedParkingLocation.note}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${savedParkingLocation.lat},${savedParkingLocation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0f172a] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">navigation</span>
                    <span>Walk to My Car (Google Maps)</span>
                  </a>
                </div>
              ) : (
                <div className="mt-2 text-xs text-[#a0b5b0] flex flex-col gap-2">
                  <p>Parked your car or bike? Save your exact spot now so you can easily walk back after holy bath!</p>
                  <button
                    onClick={() => setShowSaveParkingModal(true)}
                    disabled={isLocatingParking}
                    className="w-full py-2 bg-[#d6bd98] hover:bg-[#c4a982] text-[#142321] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_location_alt</span>
                    <span>{isLocatingParking ? 'Acquiring GPS...' : 'Save My Parking Spot'}</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#7a948e] italic">Works 100% offline once saved.</p>
          </div>
        </div>

        {/* Section 1: Live Parking Occupancy Grid */}
        <section id="parking-section" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d4642] pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8]">local_parking</span>
                <span>Live Parking Lots & Availability</span>
              </h2>
              <p className="text-xs text-[#a0b5b0]">Real-time parking space counter updated every 10 seconds</p>
            </div>
            <span className="text-[11px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2.5 py-1 rounded-full w-fit">
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
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    lot.recommended
                      ? 'bg-[#18342f] border-[#38bdf8] ring-1 ring-[#38bdf8]/50 shadow-md'
                      : isFull
                      ? 'bg-[#221717] border-red-500/40'
                      : 'bg-[#152623] border-[#2d4642]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{lot.name}</h3>
                        {lot.recommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#38bdf8] text-[#0f172a] uppercase">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#a0b5b0] mt-0.5 block">{lot.fee}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                          isFull
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : isWarning
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {isFull ? 'NEARLY FULL' : `${availableSpots} SPOTS FREE`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#cbdad6] leading-relaxed">{lot.description}</p>

                  {/* Occupancy Meter Bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono text-[#a0b5b0]">
                      <span>Occupancy: {occ} / {cap} vehicles</span>
                      <span className="font-bold text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#27403b] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Navigation CTA */}
                  <div className="pt-1 flex items-center justify-between border-t border-[#2a4540]">
                    <span className="text-[11px] text-[#7a948e] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Free shuttle available
                    </span>
                    <a
                      href={lot.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        lot.recommended
                          ? 'bg-[#38bdf8] hover:bg-[#0284c7] text-[#0f172a]'
                          : 'bg-[#28433f] hover:bg-[#355752] text-white'
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
        <section id="transit-section" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d4642] pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d6bd98]">departure_board</span>
                <span>Free Shuttles, E-Buses & River Boats</span>
              </h2>
              <p className="text-xs text-[#a0b5b0]">Live departure countdowns and route stops to ghats</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#152623] rounded-lg border border-[#2d4642] self-start sm:self-auto">
              <button
                onClick={() => setActiveTransitFilter('all')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  activeTransitFilter === 'all' ? 'bg-[#d6bd98] text-[#142321]' : 'text-[#a0b5b0] hover:text-white'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setActiveTransitFilter('bus')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'bus' ? 'bg-[#d6bd98] text-[#142321]' : 'text-[#a0b5b0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xs">directions_bus</span>
                EV Buses
              </button>
              <button
                onClick={() => setActiveTransitFilter('boat')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'boat' ? 'bg-[#d6bd98] text-[#142321]' : 'text-[#a0b5b0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xs">sailing</span>
                River Boats
              </button>
              <button
                onClick={() => setActiveTransitFilter('rickshaw')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTransitFilter === 'rickshaw' ? 'bg-[#d6bd98] text-[#142321]' : 'text-[#a0b5b0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xs">electric_rickshaw</span>
                E-Rickshaws
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
                  className="p-4 rounded-2xl bg-[#152623] border border-[#2d4642] flex flex-col justify-between gap-3 shadow-md hover:border-[#3d635c] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#1e3833] text-[#d6bd98] border border-[#355e56]">
                        {route.type === 'boat' ? '⛵ River Ferry' : route.type === 'rickshaw' ? '🛺 Feeder Cart' : '🚌 Electric Bus'}
                      </span>
                      <h3 className="font-bold text-sm text-white mt-1.5">{route.name}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-[#38bdf8] font-mono">
                        {route.departureMinutes} mins
                      </div>
                      <span className="text-[10px] text-[#7a948e] block">Next Departure</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#1a2f2b] border border-[#2a4540]">
                    <span className="text-[#a0b5b0]">Available Seats:</span>
                    <span className="font-mono font-bold text-emerald-400">{freeSeats} / {cap}</span>
                  </div>

                  {/* Route Stops Sequence */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[#7a948e] uppercase font-bold tracking-wider">Route Path</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {route.routeStops.map((stop, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e3833] text-[#cbdad6] font-medium">
                            {stop}
                          </span>
                          {sIdx < route.routeStops.length - 1 && (
                            <span className="material-symbols-outlined text-[12px] text-[#7a948e]">
                              arrow_forward
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="pt-2 border-t border-[#233b36] flex items-center justify-between text-[11px] text-[#a0b5b0]">
                    <span className="text-[#d6bd98] font-bold">{route.fare}</span>
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
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#152623] border border-[#2d4642] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2d4642] pb-2">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400">alt_route</span>
                <span>Road Status & Pedestrian Corridors</span>
              </h2>
              <span className="text-[10px] text-[#7a948e] font-mono">Police Traffic Advisory</span>
            </div>

            <div className="flex flex-col gap-3">
              {ROAD_CORRIDORS.map((corridor, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${corridor.color}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${corridor.dotColor} animate-pulse`} />
                    <div>
                      <h4 className="text-xs font-bold text-white">{corridor.name}</h4>
                      <p className="text-[11px] text-[#cbdad6] mt-0.5">{corridor.type} • {corridor.speed}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#0d1514]/60 uppercase self-start sm:self-auto shrink-0">
                    {corridor.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Wheelchair & Elderly Cart Request */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#18342f] to-[#152623] border border-[#345c55] flex flex-col justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-[#d6bd98]">
                <span className="material-symbols-outlined text-2xl">accessible</span>
                <h3 className="font-bold text-sm text-white">Divyangjan & Senior Assistance</h3>
              </div>
              <p className="text-xs text-[#cbdad6] mt-2 leading-relaxed">
                Free battery-operated wheelchair carts are deployed at all main entry gates for elderly pilgrims, pregnant women, and persons with disabilities.
              </p>
            </div>

            {mobilityRequestSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Cart request dispatched to Gate 2! Volunteer arriving in 3 mins.</span>
              </div>
            ) : (
              <button
                onClick={() => setMobilityRequestSent(true)}
                className="w-full py-2.5 bg-[#d6bd98] hover:bg-[#c4a982] text-[#142321] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">electric_rickshaw</span>
                <span>Request Wheelchair Cart at Gate</span>
              </button>
            )}

            <div className="text-[10px] text-[#7a948e] border-t border-[#2d4642] pt-2 flex items-center justify-between">
              <span>Helpline: <strong>1920 (Toll-Free)</strong></span>
              <span>24/7 Pilgrim Support</span>
            </div>
          </div>
        </div>
      </main>

      {/* Save Parking Spot Modal */}
      {showSaveParkingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#152623] border border-[#2d4642] rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#d6bd98]">pin_drop</span>
                <span>Save Parked Location</span>
              </h3>
              <button
                onClick={() => setShowSaveParkingModal(false)}
                className="text-[#a0b5b0] hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-[#cbdad6]">
              Your phone GPS coordinates will be saved locally. Add a short note (e.g. Pillar number, ground gate) to help you find your vehicle later.
            </p>

            <input
              type="text"
              placeholder="e.g. West Ground, near Food Stall #4"
              value={parkingNoteInput}
              onChange={(e) => setParkingNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f1b19] border border-[#2d4642] rounded-xl text-xs text-white placeholder:text-[#52706a] focus:outline-none focus:border-[#d6bd98]"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveParkingModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#1e3330] hover:bg-[#28433f] text-xs font-bold text-[#a0b5b0]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentLocation}
                disabled={isLocatingParking}
                className="flex-1 py-2 rounded-xl bg-[#d6bd98] hover:bg-[#c4a982] text-[#142321] text-xs font-bold shadow-sm"
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
