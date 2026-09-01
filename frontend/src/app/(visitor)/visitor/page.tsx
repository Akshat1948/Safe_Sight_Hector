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
import { useLanguage } from '@/i18n';
import { getZones } from '@/shared/api';
import { IZone } from '@/shared/types';

export default function VisitorPortalPage() {
  const [zones, setZones] = useState<IZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeSiteId, setActiveSiteId] = useState<string>('0275fd8b-81a2-4513-bdc5-9c4d27aae375');
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-cyan-500 selection:text-black">
      {/* Top HUD Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-cyan-500/20">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">{t('app_title')}</h1>
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {t('visitor_portal')}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Prayagraj Sangam Maha Kumbh Mela 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors hidden sm:inline-block"
          >
            {t('manager_console')}
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-colors"
          >
            {t('official_login')}
          </Link>
        </div>
      </header>

      {/* Emergency Active Alert Marquee */}
      <div className="bg-red-950/70 border-b border-red-500/40 px-4 py-2 text-xs text-red-200 font-mono flex items-center gap-3">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="font-bold uppercase text-red-400">{t('safety_advisory')}:</span>
        <div className="overflow-hidden whitespace-nowrap text-xs text-red-200 font-semibold flex-1">
          <span className="inline-block animate-marquee">
            {t('safety_alert_text')}
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Hero Section: 1-Tap SOS & Safe Status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 p-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-920 shadow-xl space-y-2">
            <span className="text-xs font-mono uppercase font-bold text-cyan-400">{t('crowd_density_safety')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('app_subtitle')}
            </h2>
            <p className="text-sm text-slate-300">
              {t('hero_description')}
            </p>
          </div>

          {/* 1-Tap SOS Emergency Console */}
          <div className="p-6 rounded-2xl border border-red-500/40 bg-gradient-to-b from-red-950/30 to-slate-900 shadow-2xl flex flex-col items-center justify-center text-center">
            <SOSButton siteId={activeSiteId} />
          </div>
        </section>

        {/* Live GIS Map Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-cyan-400">
                {t('geospatial_heatmap')}
              </span>
              <h3 className="text-xl font-bold text-white">🗺️ {t('live_map')} &amp; {t('congestion_status')}</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{t('auto_updating')}</span>
          </div>

          <MapView
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            showHeatmap={true}
            className="h-[460px]"
          />
        </section>

        {/* Weather & Multi-Hazard Intelligence */}
        <section>
          <WeatherWidget siteId={activeSiteId} />
        </section>

        {/* Smart Mobility & Public Transport Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ParkingStatus siteId={activeSiteId} />
          <ShuttleInfo siteId={activeSiteId} />
        </section>

        {/* Safety Essentials & Speed Dial Section */}
        <section>
          <SafetyEssentials />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 text-center py-6 text-xs text-slate-500 font-mono">
        SafeSight Platform · Smart India Hackathon 2026 · AI-Powered Crowd Safety
      </footer>
    </div>
  );
}
