'use client';

import React from 'react';
import { useLanguage } from '@/i18n';

export default function SafetyEssentials({ className = '' }: { className?: string }) {
  const { t } = useLanguage();

  const emergencyHelplines = [
    { name: t('ambulance_name'), number: '108', icon: '🚑', desc: t('ambulance_desc') },
    { name: t('police_name'), number: '112', icon: '🚓', desc: t('police_desc') },
    { name: t('disaster_name'), number: '1077', icon: '🛡️', desc: t('disaster_desc') },
    { name: t('control_room_name'), number: '+915322500000', icon: '🏛️', desc: t('control_room_desc') },
  ];

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="mb-3.5 sm:mb-4">
        <span className="text-[9px] sm:text-[10px] font-sans uppercase font-bold tracking-widest text-cyan-600">
          {t('emergency_preparedness')}
        </span>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 mt-0.5">
          {t('emergency_speed_dials')}
        </h3>
      </div>

      {/* Speed Dial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        {emergencyHelplines.map((helpline) => (
          <a
            key={helpline.number}
            href={`tel:${helpline.number}`}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-between gap-2.5 transition-all group min-w-0"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl shrink-0">{helpline.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                  {helpline.name}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans truncate">{helpline.desc}</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 sm:px-2.5 py-1 rounded-lg shrink-0">
              {t('call')}
            </span>
          </a>
        ))}
      </div>

      {/* Crowd Safety Directives */}
      <div className="p-3 sm:p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-800 font-bold text-[11px] sm:text-xs">
          <span>ℹ️</span>
          <span>{t('pilgrim_safety_rules')}:</span>
        </div>
        <ul className="text-[11px] sm:text-xs text-slate-700 space-y-1 list-disc list-inside font-sans">
          <li>{t('safety_rule_1')}</li>
          <li>{t('safety_rule_2')}</li>
          <li>{t('safety_rule_3')}</li>
        </ul>
      </div>
    </div>
  );
}
