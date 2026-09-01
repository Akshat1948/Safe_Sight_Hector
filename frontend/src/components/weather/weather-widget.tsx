'use client';

import React, { useState, useEffect } from 'react';
import { IWeatherData } from '@/shared/types';
import { getWeather } from '@/shared/api';
import { useLanguage } from '@/i18n';
import HazardOverlay from './hazard-overlay';

interface WeatherWidgetProps {
  siteId?: string | null;
  initialData?: IWeatherData | null;
  compact?: boolean;
  className?: string;
}

const CONDITION_ICONS: Record<string, string> = {
  clear: '☀️',
  sunny: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  overcast: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  fog: '🌫️',
  mist: '🌫️',
  haze: '🌫️',
};

export default function WeatherWidget({
  siteId,
  initialData = null,
  compact = false,
  className = '',
}: WeatherWidgetProps) {
  const [data, setData] = useState<IWeatherData | null>(initialData);
  const [loading, setLoading] = useState(!initialData && !!siteId);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!siteId) return;

    let isMounted = true;
    setLoading(!data);

    getWeather(siteId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Weather fetch error:', err);
          setError('Live weather unavailable');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Refresh every 10 minutes
    const interval = setInterval(() => {
      getWeather(siteId)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setData(res.data);
          }
        })
        .catch(console.error);
    }, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [siteId]);

  if (loading && !data) {
    return (
      <div className={`p-4 rounded-2xl bg-white/90 border border-slate-100 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 w-28 bg-slate-200 rounded mb-3" />
        <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-40 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const { current, hazard, forecast } = data;
  const conditionKey = (current.condition || 'clear').toLowerCase().replace(/\s+/g, '_');
  const icon = CONDITION_ICONS[conditionKey] || '🌤️';

  return (
    <div className={`flex flex-col gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all ${className}`}>
      {/* Top Header: Title & Hazard Alert */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🌤️</span>
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400">
            {t('weather_hazards')}
          </h3>
        </div>
        {current.condition && (
          <span className="text-[10px] sm:text-xs font-semibold capitalize px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {current.condition.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Main Temperature & Telemetry Display */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {Math.round(current.temperature)}°C
          </span>
          <span className="text-2xl sm:text-3xl shrink-0">{icon}</span>
        </div>

        {/* Environmental Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-left xs:text-right w-full xs:w-auto">
          <div className="bg-slate-950/40 xs:bg-transparent p-2 xs:p-0 rounded-lg border border-slate-800 xs:border-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">{t('humidity')}</span>
            <span className="text-xs sm:text-sm font-bold text-slate-200">{current.humidity}%</span>
          </div>
          <div className="bg-slate-950/40 xs:bg-transparent p-2 xs:p-0 rounded-lg border border-slate-800 xs:border-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">{t('wind')}</span>
            <span className="text-xs sm:text-sm font-bold text-slate-200">{Math.round(current.windSpeed)} km/h</span>
          </div>
          <div className="bg-slate-950/40 xs:bg-transparent p-2 xs:p-0 rounded-lg border border-slate-800 xs:border-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">{t('rainfall')}</span>
            <span className="text-xs sm:text-sm font-bold text-slate-200">{current.precipitation} mm</span>
          </div>
        </div>
      </div>

      {/* Hazard Overlay Banner if active */}
      {hazard && <HazardOverlay hazard={hazard} />}

      {/* 24-Hour Forecast Strip (if available and not compact) */}
      {!compact && forecast && forecast.length > 0 && (
        <div className="mt-1 pt-2.5 border-t border-slate-800">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            24-Hour Forecast
          </div>
          <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {forecast.slice(0, 8).map((pt, idx) => {
              const ptIcon = CONDITION_ICONS[(pt.condition || 'clear').toLowerCase()] || '🌤️';
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 min-w-[54px] sm:min-w-[58px] text-center border border-slate-800/80 shrink-0"
                >
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">{pt.time}</span>
                  <span className="text-sm sm:text-base my-0.5">{ptIcon}</span>
                  <span className="text-xs font-bold text-slate-200">{Math.round(pt.temperature)}°</span>
                  {pt.precipitation > 0 && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-cyan-400 mt-0.5">
                      {pt.precipitation}mm
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
