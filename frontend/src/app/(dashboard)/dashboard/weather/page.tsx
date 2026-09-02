'use client';

import React, { useState } from 'react';
import { createAlert } from '@/shared/api/alerts.api';
import { AlertSeverity, AlertChannel } from '@/shared/types';

interface LayerOption {
  id: string;
  label: string;
  icon: string;
  overlay: string;
}

const LAYER_OPTIONS: LayerOption[] = [
  { id: 'wind', label: 'Wind Particles', icon: 'air', overlay: 'wind' },
  { id: 'temp', label: 'Heat Strength & Temp', icon: 'thermostat', overlay: 'temp' },
  { id: 'rain', label: 'Doppler Rain & Thunder', icon: 'rainy', overlay: 'rain' },
  { id: 'gust', label: 'Wind Gusts', icon: 'cyclone', overlay: 'gust' },
  { id: 'thunder', label: 'Lightning Cells', icon: 'thunderstorm', overlay: 'thunder' },
  { id: 'clouds', label: 'Satellite Clouds', icon: 'cloud', overlay: 'clouds' },
];

interface QuickAlertTemplate {
  id: string;
  title: string;
  severity: AlertSeverity;
  message: string;
  messageHi: string;
  targetZoneName: string;
  icon: string;
}

const QUICK_TEMPLATES: QuickAlertTemplate[] = [
  {
    id: 'heat',
    title: 'Extreme Heat & Hydration Advisory',
    severity: AlertSeverity.ADVISORY,
    message: 'High thermal heat index (39°C RealFeel) detected. Free ORS & hydration booths active at all Gate Exits. Pilgrims advised to stay hydrated.',
    messageHi: 'अत्यधिक गर्मी और उमस का स्तर बढ़ रहा है। सभी मुख्य निकास द्वारों पर निःशुल्क ओआरएस एवं शीतल जल उपलब्ध है।',
    targetZoneName: 'Site-Wide',
    icon: '☀️',
  },
  {
    id: 'rain',
    title: 'Moderate Rain Alert — Slippery Ghats Notice',
    severity: AlertSeverity.WARNING,
    message: 'Rain precipitation detected over Sangam sector. Steps and pontoon ramps are slippery. Hold safety handrails and avoid rushing.',
    messageHi: 'संगम क्षेत्र में वर्षा के कारण घाटों की सीढ़ियों पर फिसलन है। कृपया रेलिंग का सहारा लें और सावधानीपूर्वक चलें।',
    targetZoneName: 'Sangam Main Ghats',
    icon: '🌧️',
  },
  {
    id: 'wind',
    title: 'High Wind Velocity — Structural Directive',
    severity: AlertSeverity.WARNING,
    message: 'Wind gusts exceeding 38 km/h incoming. Responders directed to secure temporary tent ropes, canopy poles, and check lighting towers.',
    messageHi: 'तेज हवाओं की गति बढ़ रही है। राहत दल तंबुओं की रस्सियों और अस्थायी संरचनाओं को तुरंत सुरक्षित करें।',
    targetZoneName: 'Tent Sectors & Transit Corridors',
    icon: '💨',
  },
  {
    id: 'storm',
    title: 'Thunderstorm & Lightning Warning',
    severity: AlertSeverity.CRITICAL,
    message: 'Active convective storm cell within 15 km. Pilgrims advised to vacate open riverbanks immediately and proceed to covered shelter halls.',
    messageHi: 'तूफान और आकाशीय बिजली की चेतावनी। कृपया खुले घाटों से तुरंत हटकर सुरक्षित आश्रय स्थलों में जाएं।',
    targetZoneName: 'Sangam & Riverfront Ghats',
    icon: '⚡',
  },
];

export default function WeatherUpdatesPage() {
  const [selectedOverlay, setSelectedOverlay] = useState<string>('wind');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Custom Alert Composer Form State
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>(AlertSeverity.ADVISORY);
  const [targetZone, setTargetZone] = useState('Site-Wide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Dispatches History
  const [dispatches, setDispatches] = useState([
    {
      id: 'WTH-001',
      title: 'Afternoon Heat & Hydration Advisory',
      severity: AlertSeverity.ADVISORY,
      scope: 'Site-Wide',
      channels: 'Visitor Portal, Responders, PA System',
      time: '12:30 PM',
      status: 'ACTIVE BROADCAST',
    },
    {
      id: 'WTH-002',
      title: 'Morning Fog & Low Visibility Notice',
      severity: AlertSeverity.MODERATE,
      scope: 'Riverboat Transit Corridor',
      channels: 'Responders, Electronic Signage',
      time: '06:15 AM',
      status: 'RESOLVED',
    },
  ]);

  // Generate Windy Embed URL dynamically
  const windyEmbedUrl = `https://embed.windy.com/embed.html?lat=25.4358&lon=81.8463&detailLat=25.4358&detailLon=81.8463&width=100%25&height=600&zoom=9&level=surface&overlay=${selectedOverlay}&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  const handleApplyTemplate = (template: QuickAlertTemplate) => {
    setAlertTitle(template.title);
    setAlertMessage(template.message);
    setAlertSeverity(template.severity);
    setTargetZone(template.targetZoneName);
    setDispatchSuccessMsg(null);
  };

  const handleDispatchAlert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    setIsSubmitting(true);
    setDispatchSuccessMsg(null);

    try {
      const alertId = `WTH-${Math.floor(100 + Math.random() * 900)}`;
      const alertPayload = {
        id: alertId,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        severity: alertSeverity,
        targetZoneName: targetZone,
        timestamp: new Date().toISOString(),
      };

      // 1. Sync to API / Notification Context
      await createAlert({
        siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        severity: alertSeverity,
        targetZoneName: targetZone,
        channels: [AlertChannel.DASHBOARD, AlertChannel.PUSH, AlertChannel.PA_SYSTEM],
      });

      // 2. Broadcast directly to Visitor Portal across tabs & windows
      if (typeof window !== 'undefined') {
        localStorage.setItem('safesight_active_weather_alert', JSON.stringify(alertPayload));
        localStorage.removeItem(`safesight_ack_weather_${alertId}`);
        window.dispatchEvent(new CustomEvent('safesight:weather-alert', { detail: alertPayload }));
      }

      const newDispatch = {
        id: alertId,
        title: alertTitle,
        severity: alertSeverity,
        scope: targetZone,
        channels: 'Visitor Portal, Responders, PA System',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'ACTIVE BROADCAST',
      };

      setDispatches([newDispatch, ...dispatches]);
      setDispatchSuccessMsg(`Directive "${alertTitle}" has been broadcast live to Responders and the Visitor Portal.`);
      setAlertTitle('');
      setAlertMessage('');
    } catch (err) {
      console.error('Failed to dispatch weather alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-2xl">
              cloud_sync
            </span>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-sans">
              Atmospheric Intelligence &amp; Weather Command
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
            Real-time meteorological telemetry, live interactive Windy radar, and 1-click pilgrim weather advisory dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3636] border border-[#40534C] rounded text-xs font-sans text-[#D6BD98] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            WINDY DOPPLER RADAR SYNCED
          </span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded bg-surface border border-border-subtle hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
            title="Refresh Weather View"
          >
            <span className="material-symbols-outlined text-lg block">refresh</span>
          </button>
        </div>
      </div>

      {/* Live Microclimate Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Temp & Heat Index */}
        <div className="hud-panel p-4 rounded-xl relative overflow-hidden group hover:border-[#677D6A] transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">
              Temperature / RealFeel
            </span>
            <span className="text-xl">☀️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">34°C</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              RealFeel 39°C
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-sans mt-1.5">
            Heat Index: <span className="font-semibold text-amber-700">Moderate Dehydration Risk</span>
          </p>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 2: Wind Velocity & Gusts */}
        <div className="hud-panel p-4 rounded-xl relative overflow-hidden group hover:border-[#677D6A] transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">
              Wind Velocity &amp; Gusts
            </span>
            <span className="text-xl">💨</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">18 <span className="text-sm font-bold">km/h</span></span>
            <span className="text-xs font-bold text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Gusts 32 km/h
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-sans mt-1.5">
            Vector: <span className="font-semibold text-on-surface">WNW (290°)</span> · Tent Safety: <span className="text-emerald-600 font-bold">Nominal</span>
          </p>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 3: Rain & River Bathing Status */}
        <div className="hud-panel p-4 rounded-xl relative overflow-hidden group hover:border-[#677D6A] transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">
              Precipitation &amp; Sangam Flow
            </span>
            <span className="text-xl">🌊</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">0.0 <span className="text-sm font-bold">mm/h</span></span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Clear Skies
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-sans mt-1.5">
            Ghat Flow Rate: <span className="font-semibold text-on-surface">1.2 m/s</span> · Bathing: <span className="text-emerald-600 font-bold">Safe</span>
          </p>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Card 4: Lightning & Squall Proximity */}
        <div className="hud-panel p-4 rounded-xl relative overflow-hidden group hover:border-[#677D6A] transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">
              Lightning &amp; Storm Cells
            </span>
            <span className="text-xl">⚡</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">0 Strikes</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Radius &gt; 35km
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-sans mt-1.5">
            Doppler Alert: <span className="font-semibold text-emerald-600">No active convective squall</span>
          </p>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>

      {/* Main Interactive Windy Radar Section */}
      <div className="hud-panel rounded-2xl overflow-hidden border border-border-subtle shadow-md">
        {/* Windy Control Bar */}
        <div className="p-4 bg-[#1A3636] border-b border-[#40534C] text-white flex items-center justify-between gap-4">
          {/* Layer Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#D6BD98] mr-1 shrink-0">
              Radar Layers:
            </span>
            {LAYER_OPTIONS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedOverlay(layer.overlay)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  selectedOverlay === layer.overlay
                    ? 'bg-[#D6BD98] text-[#1A3636] font-bold shadow-sm'
                    : 'bg-[#40534C] text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/80'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{layer.icon}</span>
                <span>{layer.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-sans text-[#CBD6CF]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Interactive Weather Radar</span>
          </div>
        </div>

        {/* Interactive Windy Map Viewport */}
        <div className="relative w-full h-[540px] sm:h-[620px] bg-slate-950">
          <iframe
            key={`${refreshKey}-${selectedOverlay}`}
            title="Windy Real-Time Weather Radar"
            src={`https://embed.windy.com/embed.html?lat=25.4358&lon=81.8463&detailLat=25.4358&detailLon=81.8463&width=100%25&height=600&zoom=9&level=surface&overlay=${selectedOverlay}&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>

      {/* Site Manager Alert & Directive Dispatch Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 1-Click Quick Emergency Templates & Composer (7 cols) */}
        <div className="lg:col-span-7 hud-panel p-5 rounded-2xl border border-border-subtle space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-xl">
                campaign
              </span>
              <h2 className="text-lg font-bold text-on-surface font-sans">
                1-Click Weather Alert &amp; Advisory Dispatcher
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant font-sans mt-0.5">
              Instantly push critical weather directives to field responders, the Visitor Portal emergency marquee, and public electronic signage.
            </p>
          </div>

          {/* Quick Preset Directive Buttons */}
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Fast Hazard Directives (1-Click Fill):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-3 rounded-xl border border-border-subtle bg-surface-container-low hover:bg-surface-container hover:border-[#677D6A] text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span>{tmpl.icon}</span>
                      <span>{tmpl.title}</span>
                    </span>
                    <span
                      className={`text-[9px] font-sans font-bold uppercase px-2 py-0.5 rounded ${
                        tmpl.severity === AlertSeverity.CRITICAL
                          ? 'bg-red-500/10 text-red-600 border border-red-500/30'
                          : tmpl.severity === AlertSeverity.WARNING
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-700 border border-blue-500/30'
                      }`}
                    >
                      {tmpl.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-sans line-clamp-2">
                    {tmpl.message}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Advisory Composer Form */}
          <form onSubmit={handleDispatchAlert} className="space-y-4 pt-2 border-t border-border-subtle">
            <div>
              <label className="block text-xs font-sans font-bold text-on-surface mb-1">
                Advisory Title
              </label>
              <input
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. Afternoon Extreme Heat Wave Directive"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-subtle text-xs font-sans text-on-surface focus:outline-none focus:border-[#40534C]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-on-surface mb-1">
                Advisory Message (Broadcast Text)
              </label>
              <textarea
                rows={3}
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter the full instructions for pilgrims and responders..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-subtle text-xs font-sans text-on-surface focus:outline-none focus:border-[#40534C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-bold text-on-surface mb-1">
                  Severity Level
                </label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as AlertSeverity)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-subtle text-xs font-sans text-on-surface focus:outline-none"
                >
                  <option value={AlertSeverity.CRITICAL}>🔴 CRITICAL (Emergency Action)</option>
                  <option value={AlertSeverity.WARNING}>🟡 WARNING (Caution Required)</option>
                  <option value={AlertSeverity.ADVISORY}>🔵 ADVISORY (Public Guidance)</option>
                  <option value={AlertSeverity.MODERATE}>⚪ MODERATE (Informational)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-on-surface mb-1">
                  Target Zone / Scope
                </label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-subtle text-xs font-sans text-on-surface focus:outline-none"
                >
                  <option value="Site-Wide">Site-Wide (All Sectors)</option>
                  <option value="Sangam Main Ghats">Sangam Main Ghats</option>
                  <option value="Pontoon Bridges 1 &amp; 3">Pontoon Bridges 1 &amp; 3</option>
                  <option value="Tent Sectors 1-5">Tent Sectors 1-5</option>
                  <option value="Parking Lots North &amp; South">Parking Lots North &amp; South</option>
                </select>
              </div>
            </div>

            {dispatchSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-sans flex items-center gap-2">
                <span className="font-bold text-sm">✓</span>
                <span>{dispatchSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !alertTitle.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[#1A3636] hover:bg-[#40534C] text-[#D6BD98] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                send
              </span>
              <span>{isSubmitting ? 'Transmitting Directive...' : 'Broadcast Weather Directive Live'}</span>
            </button>
          </form>
        </div>

        {/* Right: Active Dispatches Log & Multi-Channel Sync Status (5 cols) */}
        <div className="lg:col-span-5 hud-panel p-5 rounded-2xl border border-border-subtle flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#677D6A] text-xl">
                  history_toggle_off
                </span>
                <h3 className="text-base font-bold text-on-surface font-sans">
                  Live Weather Broadcasts
                </h3>
              </div>
              <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-sans">
              Currently deployed meteorological advisories across all pilgrim channels.
            </p>

            <div className="space-y-3 mt-4">
              {dispatches.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border-subtle bg-surface-container-low space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">{item.title}</span>
                    <span
                      className={`text-[9px] font-sans font-bold uppercase px-2 py-0.5 rounded ${
                        item.severity === AlertSeverity.CRITICAL
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-sans text-on-surface-variant">
                    <span>Scope: <strong className="text-on-surface">{item.scope}</strong></span>
                    <span>{item.time}</span>
                  </div>
                  <div className="text-[10px] font-sans text-[#677D6A] pt-1 flex items-center gap-1">
                    <span>📡 Channels:</span>
                    <span className="font-semibold text-on-surface">{item.channels}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
