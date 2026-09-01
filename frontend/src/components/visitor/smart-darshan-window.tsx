'use client';

import React from 'react';
import { Sparkles, Clock, TrendingDown, Calendar, ShieldCheck, Sun } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface SmartDarshanWindowProps {
  siteName?: string;
}

export const SmartDarshanWindow: React.FC<SmartDarshanWindowProps> = ({
  siteName = 'Prayagraj Triveni Sangam',
}) => {
  const { t } = useLanguage();

  const hourlyForecast = [
    { time: '11:00 AM', density: 'High (85%)', wait: '45m', trend: 'rising', safe: false },
    { time: '12:30 PM', density: 'Moderate (65%)', wait: '25m', trend: 'falling', safe: true },
    { time: '02:00 PM', density: 'Low (38%)', wait: '10m', trend: 'lowest', safe: true, optimal: true },
    { time: '03:30 PM', density: 'Low (42%)', wait: '12m', trend: 'steady', safe: true, optimal: true },
    { time: '05:00 PM', density: 'High (88%)', wait: '55m', trend: 'evening peak', safe: false },
  ];

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white p-5 shadow-sm">
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {t('smart_darshan')}
            </h3>
            <p className="text-xs text-stone-600">
              {t('darshan_subtitle')} {siteName}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
          <TrendingDown className="w-3.5 h-3.5 text-amber-700" />
          {t('best_window')}
        </span>
      </div>

      {/* Optimal Window Banner */}
      <div className="rounded-xl bg-white border border-amber-200/80 p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              {t('recommended_slot')}
            </span>
            <div className="text-lg font-black text-stone-900 flex items-center gap-2 mt-0.5">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>02:00 PM — 03:30 PM</span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              {t('est_wait_time')} <strong className="text-emerald-700">10–12 minutes</strong> ({t('save_time')}).
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-1" />
            <span className="text-[10px] font-black uppercase">92% {t('comfort')}</span>
          </div>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {hourlyForecast.map((slot, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-2.5 text-center border transition-all ${
              slot.optimal
                ? 'bg-amber-100/70 border-amber-300 shadow-sm ring-1 ring-amber-400'
                : slot.safe
                ? 'bg-white/90 border-stone-200'
                : 'bg-stone-50/80 border-stone-200/60 opacity-75'
            }`}
          >
            <div className="text-xs font-bold text-stone-900">{slot.time}</div>
            <div className="text-[11px] text-stone-600 mt-0.5">{slot.wait} {t('wait')}</div>
            <span
              className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                slot.optimal
                  ? 'bg-emerald-600 text-white'
                  : slot.safe
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {slot.density.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
