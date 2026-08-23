'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  VisitorHeader,
  ZoneCrowdCard,
  SmartDarshanWindow,
  SosEmergencyModal,
  VisitorTransportWidget,
  OfflineSafetyPack,
  InteractiveVisitorMap,
} from '@/components/visitor';
import { WeatherWidget, HazardOverlay } from '@/components/weather';
import AlertBanner from '@/components/alerts/alert-banner';
import { getZones, getAlerts } from '@/shared/api';


import { IZone, IAlert, DensityStatus } from '@/shared/types';
import { useSocket } from '@/shared/hooks';
import { useLanguage } from '@/i18n';
import {
  Shield,
  Layers,
  CloudSun,
  Car,
  LifeBuoy,
  BellRing,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function VisitorLandingPage() {
  const { t } = useLanguage();
  const [selectedSite, setSelectedSite] = useState<string>('demo-site-prayagraj-01');
  const [zones, setZones] = useState<IZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<IZone | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<IAlert[]>([]);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'weather' | 'transport' | 'safety'>('overview');

  // Fetch initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [zonesRes, alertsRes] = await Promise.all([
        getZones(selectedSite),
        getAlerts(selectedSite),
      ]);

      if (zonesRes?.data) {
        setZones(zonesRes.data);
        if (!selectedZone && zonesRes.data.length > 0) {
          setSelectedZone(zonesRes.data[0]);
        }
      }

      if (alertsRes?.data) {
        setActiveAlerts(alertsRes.data.filter((a) => a.status === 'dispatched'));
      }
    } catch (err) {
      console.warn('Visitor page load fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket event hooks
  const { on, off } = useSocket(selectedSite);

  useEffect(() => {
    const handleZoneDensity = (data: any) => {
      if (!data?.zoneId) return;
      setZones((prev) =>
        prev.map((z) =>
          z.id === data.zoneId
            ? {
                ...z,
                currentDensity: data.currentDensity,
                densityStatus: data.densityStatus,
              }
            : z
        )
      );
    };

    const handleAlert = (alert: any) => {
      const a = alert as IAlert;
      if (a && a.status === 'dispatched') {
        setActiveAlerts((prev) => [a, ...prev.filter((item) => item.id !== a.id)]);
      }
    };

    on('zone:density:update', handleZoneDensity);
    on('alert:dispatched', handleAlert);
    on('alert:new', handleAlert);

    return () => {
      off('zone:density:update', handleZoneDensity);
      off('alert:dispatched', handleAlert);
      off('alert:new', handleAlert);
    };
  }, [on, off]);


  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* Top Visitor Header */}
      <VisitorHeader
        onOpenSos={() => setIsSosOpen(true)}
        selectedSite={selectedSite}
        onSelectSite={(site) => {
          setSelectedSite(site);
          setSelectedZone(null);
        }}
      />

      {/* Emergency Active Alert Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
        <AlertBanner siteId={selectedSite} />
      </div>


      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Hero Section & Quick Status Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3 border border-white/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Pilgrim Safety Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {t('app_subtitle') || 'AI-Powered Visitor Safety & Crowd Coordination'}
            </h1>
            <p className="text-sm sm:text-base text-amber-100 mt-2 font-medium">
              Live crowd telemetry, weather hazard intelligence, and 1-tap emergency rescue for pilgrims and eco-tourists.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xs text-amber-200 font-medium">Overall Site Flow</div>
                <div className="text-lg font-bold mt-0.5 flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Smooth (54%)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xs text-amber-200 font-medium">Active Monitored Zones</div>
                <div className="text-lg font-bold mt-0.5">4 Sectors</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xs text-amber-200 font-medium">Weather Advisory</div>
                <div className="text-lg font-bold mt-0.5 text-amber-200">Normal / Safe</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xs text-amber-200 font-medium">Emergency Helplines</div>
                <div className="text-lg font-bold mt-0.5 text-white">112 / 108</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs for Mobile / Desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-stone-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview & Live Radar</span>
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'weather'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <CloudSun className="w-4 h-4" />
            <span>Weather & Hazards</span>
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'transport'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Parking & Shuttles</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'safety'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Offline Safety Pack</span>
          </button>
        </div>

        {/* Dynamic Content Grid */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row: Tactical GIS Map & AI Darshan Window */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tactical Map */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>{t('live_map') || 'Site Heatmap & Dynamic Sector Map'}</span>
                  </h2>
                  <button
                    onClick={loadData}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                    title="Refresh Map Telemetry"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <InteractiveVisitorMap
                  zones={zones}
                  selectedZone={selectedZone}
                  onSelectZone={(z) => setSelectedZone(z)}
                />
              </div>

              {/* AI Darshan Optimizer */}
              <div className="lg:col-span-4 space-y-6">
                <SmartDarshanWindow
                  siteName={
                    selectedSite.includes('kedarnath')
                      ? 'Kedarnath Dham'
                      : selectedSite.includes('varanasi')
                      ? 'Kashi Vishwanath'
                      : 'Prayagraj Triveni Sangam'
                  }
                />
                {/* Weather Preview Mini */}
                <WeatherWidget siteId={selectedSite} />
              </div>
            </div>

            {/* Middle Row: Zone Cards (Zone A, B, C, D) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>{t('crowd_density') || 'Sector Density & Wait Time Telemetry'}</span>
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  Updated every 5s via WebSockets
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {zones.map((zone) => (
                  <ZoneCrowdCard
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone?.id === zone.id}
                    onSelectZone={(z) => setSelectedZone(z)}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Row: Transport & Safety Essentials */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VisitorTransportWidget />
              <OfflineSafetyPack />
            </div>
          </div>
        )}

        {/* Weather & Hazards Tab */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeatherWidget siteId={selectedSite} />
              <SmartDarshanWindow
                siteName={
                  selectedSite.includes('kedarnath')
                    ? 'Kedarnath Dham'
                    : selectedSite.includes('varanasi')
                    ? 'Kashi Vishwanath'
                    : 'Prayagraj Triveni Sangam'
                }
              />
            </div>
          </div>
        )}


        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <div className="space-y-6">
            <VisitorTransportWidget />
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <OfflineSafetyPack />
          </div>
        )}
      </main>

      {/* Floating 1-Tap SOS Button on Mobile */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsSosOpen(true)}
          className="px-5 py-3.5 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-600/50 flex items-center gap-2 animate-bounce transition border-2 border-white"
        >
          <LifeBuoy className="w-5 h-5" />
          <span>Emergency SOS</span>
        </button>
      </div>

      {/* SOS Modal Dialog */}
      <SosEmergencyModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        siteId={selectedSite}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
          <p className="font-semibold text-stone-700">
            SafeSight — Intelligent Crowd Safety & Multi-Actor Emergency Incident Coordination
          </p>
          <p className="mt-1">
            Built for Smart India Hackathon 2026 • Ministry of Tourism / Disaster Management Authorities
          </p>
        </div>
      </footer>
    </div>
  );
}
