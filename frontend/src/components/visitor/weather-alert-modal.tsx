'use client';

import React, { useState, useEffect } from 'react';
import { AlertSeverity } from '@/shared/types';

export interface WeatherBroadcastAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  targetZoneName?: string;
  timestamp?: string;
}

interface WeatherAlertModalProps {
  onAcknowledge?: (alert: WeatherBroadcastAlert) => void;
}

export default function WeatherAlertModal({ onAcknowledge }: WeatherAlertModalProps) {
  const [currentAlert, setCurrentAlert] = useState<WeatherBroadcastAlert | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check local storage for active unacknowledged alert
    const checkActiveAlert = () => {
      try {
        const stored = localStorage.getItem('safesight_active_weather_alert');
        if (stored) {
          const parsed = JSON.parse(stored) as WeatherBroadcastAlert;
          const ackKey = `safesight_ack_weather_${parsed.id}`;
          const isAcked = localStorage.getItem(ackKey) === 'true';

          setCurrentAlert(parsed);
          if (!isAcked) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Error reading stored weather alert:', err);
      }
    };

    checkActiveAlert();

    // 2. Listen to custom in-window broadcast events
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WeatherBroadcastAlert>;
      if (customEvent.detail && customEvent.detail.id) {
        const newAlert = customEvent.detail;
        setCurrentAlert(newAlert);
        localStorage.setItem('safesight_active_weather_alert', JSON.stringify(newAlert));
        localStorage.removeItem(`safesight_ack_weather_${newAlert.id}`);
        setIsOpen(true);
      }
    };

    // 3. Listen to cross-tab storage events
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'safesight_active_weather_alert' && e.newValue) {
        try {
          const newAlert = JSON.parse(e.newValue) as WeatherBroadcastAlert;
          setCurrentAlert(newAlert);
          setIsOpen(true);
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('safesight:weather-alert', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('safesight:weather-alert', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const handleAcknowledge = () => {
    if (currentAlert) {
      localStorage.setItem(`safesight_ack_weather_${currentAlert.id}`, 'true');
      setIsOpen(false);
      if (onAcknowledge) {
        onAcknowledge(currentAlert);
      }
    }
  };

  if (!isOpen || !currentAlert) {
    return null;
  }

  const isCritical = currentAlert.severity === AlertSeverity.CRITICAL;
  const isWarning = currentAlert.severity === AlertSeverity.WARNING;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Glowing Hazard Banner */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isCritical
              ? 'bg-red-600'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-blue-600'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
                isCritical
                  ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                  : isWarning
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
              }`}
            >
              {isCritical ? '⚡' : isWarning ? '⛈️' : '☀️'}
            </div>
            <div>
              <span
                className={`text-[10px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded-full border inline-block mb-1 ${
                  isCritical
                    ? 'bg-red-500/15 text-red-700 border-red-500/30'
                    : isWarning
                    ? 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                    : 'bg-blue-500/15 text-blue-800 border-blue-500/30'
                }`}
              >
                {isCritical ? 'CRITICAL WEATHER ALERT' : isWarning ? 'WEATHER WARNING' : 'PUBLIC WEATHER ADVISORY'}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {currentAlert.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Target Scope Badge */}
        {currentAlert.targetZoneName && (
          <div className="flex items-center gap-2 text-xs font-sans text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800">📍 Affected Scope:</span>
            <span>{currentAlert.targetZoneName}</span>
          </div>
        )}

        {/* Message Body */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-sans text-slate-800 leading-relaxed space-y-2">
          <p className="font-medium">{currentAlert.message}</p>
        </div>

        {/* Action Button: Acknowledge & Transform to Marquee */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAcknowledge}
            className={`w-full py-3.5 px-5 rounded-xl font-sans font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCritical
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'
            }`}
          >
            <span className="text-base font-bold">✓</span>
            <span>I Acknowledge &amp; Understand</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 font-sans mt-2">
            This notice will slide across the top bar for your reference as you browse.
          </p>
        </div>
      </div>
    </div>
  );
}
