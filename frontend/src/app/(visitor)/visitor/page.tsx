'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MapView from '@/components/map/map-view';
import ParkingStatus from '@/components/transport/parking-status';
import ShuttleInfo from '@/components/transport/shuttle-info';
import SOSButton from '@/components/visitor/sos-button';
import SafetyEssentials from '@/components/visitor/safety-essentials';
import { WeatherWidget } from '@/components/weather';
import { LanguageSwitcher } from '@/components/language';
import WeatherAlertModal, { WeatherBroadcastAlert } from '@/components/visitor/weather-alert-modal';
import { useLanguage } from '@/i18n';
import { getZones } from '@/shared/api';
import { IZone, AlertSeverity } from '@/shared/types';
import VisitorChatbot from '@/components/visitor/visitor-chatbot';

export default function VisitorPortalPage() {
  const [zones, setZones] = useState<IZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeSiteId, setActiveSiteId] = useState<string>('0275fd8b-81a2-4513-bdc5-9c4d27aae375');
  const [activeWeatherMarquee, setActiveWeatherMarquee] = useState<WeatherBroadcastAlert | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // Check initial stored weather alert
    try {
      const stored = localStorage.getItem('safesight_active_weather_alert');
      if (stored) {
        const parsed = JSON.parse(stored) as WeatherBroadcastAlert;
        setActiveWeatherMarquee(parsed);
      }
    } catch (err) {
      console.error('Error loading stored weather marquee:', err);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const fetchZones = async () => {
      try {
        const res = await getZones();
        if (res?.data && isSubscribed && res.data.length > 0) {
          setZones(res.data);
          if (res.data[0]?.siteId) {
            setActiveSiteId(res.data[0].siteId);
          }
        }
      } catch (err) {
        // Uses fallback mock data in MapView component
      }
    };

    fetchZones();
    const interval = setInterval(fetchZones, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 selection:bg-cyan-500 selection:text-white">
      {/* Top HUD Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-md shadow-cyan-600/20 shrink-0">
            🛡️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">{t('app_title')}</h1>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                {t('visitor_portal')}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-sans text-slate-500 truncate hidden xs:block">Prayagraj Sangam Maha Kumbh Mela 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/visitor/transport"
            className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">directions_bus</span>
            <span>Transit & Parking</span>
          </Link>
          <LanguageSwitcher variant="compact" />
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors hidden md:inline-block"
          >
            {t('manager_console')}
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors whitespace-nowrap"
          >
            {t('official_login')}
          </Link>
        </div>
      </header>

      {/* Dynamic Sliding Marquee under Top Header */}
      {activeWeatherMarquee ? (
        <div
          className={`border-b px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-sans flex items-center gap-2 sm:gap-3 transition-all ${
            activeWeatherMarquee.severity === AlertSeverity.CRITICAL
              ? 'bg-red-600 border-red-700 text-white shadow-sm'
              : activeWeatherMarquee.severity === AlertSeverity.WARNING
              ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
              : 'bg-slate-800 border-slate-900 text-amber-200 shadow-sm'
          }`}
        >
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="font-bold uppercase tracking-wider shrink-0">
            ⚡ {activeWeatherMarquee.title}:
          </span>
          <div className="overflow-hidden whitespace-nowrap text-[11px] sm:text-xs font-semibold flex-1 min-w-0">
            <span className="inline-block animate-marquee">
              {activeWeatherMarquee.message} {activeWeatherMarquee.targetZoneName ? `[Scope: ${activeWeatherMarquee.targetZoneName}]` : ''}
            </span>
          </div>
        </div>
      ) : (
        /* Default Emergency Active Alert Marquee */
        <div className="bg-red-600 border-b border-red-700 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs text-white font-sans flex items-center gap-2 sm:gap-3 shadow-xs">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="font-bold uppercase text-red-100 shrink-0">{t('safety_advisory')}:</span>
          <div className="overflow-hidden whitespace-nowrap text-[11px] sm:text-xs text-white font-semibold flex-1 min-w-0">
            <span className="inline-block animate-marquee">
              {t('safety_alert_text')}
            </span>
          </div>
        </div>
      )}

      {/* Emergency Weather Alert Pop-Up Modal */}
      <WeatherAlertModal
        onAcknowledge={(alert) => {
          setActiveWeatherMarquee(alert);
        }}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* Hero Section: 1-Tap SOS & Safe Status */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 flex flex-col justify-center">
            <span className="text-[10px] sm:text-xs font-sans uppercase font-bold text-cyan-600">{t('crowd_density_safety')}</span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">
              {t('app_subtitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('hero_description')}
            </p>
          </div>

          {/* 1-Tap SOS Emergency Console */}
          <div className="p-4 sm:p-6 rounded-2xl border border-red-200 bg-white shadow-xs flex flex-col items-center justify-center text-center">
            <SOSButton siteId={activeSiteId} />
          </div>
        </section>

        {/* Live GIS Map Section */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[9px] sm:text-[10px] font-sans uppercase font-bold tracking-widest text-cyan-600">
                {t('geospatial_heatmap')}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
                🗺️ {t('live_map')} &amp; {t('congestion_status')}
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs font-sans text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              {t('auto_updating')}
            </span>
          </div>

          <MapView
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            showHeatmap={true}
            className="h-[340px] sm:h-[420px] lg:h-[480px] rounded-2xl shadow-xs border border-slate-200 overflow-hidden"
          />
        </section>

        {/* Weather & Multi-Hazard Intelligence */}
        <section>
          <WeatherWidget siteId={activeSiteId} />
        </section>

        {/* Smart Mobility & Public Transport Section */}
        <section className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-700/50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚗</span>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-emerald-200">
                  Dedicated Pilgrim Transit &amp; Parking Hub
                </h4>
                <p className="text-xs text-emerald-100/80">
                  Live parking space counters, free EV shuttle countdowns, riverboat ferry status, and Save My Car GPS locator.
                </p>
              </div>
            </div>
            <Link
              href="/visitor/transport"
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Open Transit Hub</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ParkingStatus siteId={activeSiteId} />
            <ShuttleInfo siteId={activeSiteId} />
          </div>
        </section>

        {/* Safety Essentials & Speed Dial Section */}
        <section>
          <SafetyEssentials />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 sm:mt-16 border-t border-slate-200 text-center py-6 px-4 text-[11px] sm:text-xs text-slate-500 font-sans bg-white">
        SafeSight Platform · Smart India Hackathon 2026 · AI-Powered Crowd Safety
      </footer>

      {/* SafeSight Saathi — AI Chatbot */}
      <VisitorChatbot />
    </div>
  );
}
