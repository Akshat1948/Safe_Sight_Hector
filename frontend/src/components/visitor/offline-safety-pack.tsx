'use client';

import React from 'react';
import {
  ShieldCheck,
  Phone,
  Droplets,
  HeartHandshake,
  Footprints,
  Download,
  WifiOff,
  Compass,
} from 'lucide-react';
import { useLanguage } from '@/i18n';

export const OfflineSafetyPack: React.FC = () => {
  const { t } = useLanguage();

  const essentials = [
    {
      icon: HeartHandshake,
      title: t('lost_found'),
      location: t('lost_found_loc'),
      contact: t('lost_found_contact'),
    },
    {
      icon: Droplets,
      title: t('water_ors'),
      location: t('water_loc'),
      contact: t('water_contact'),
    },
    {
      icon: Compass,
      title: t('medical_center'),
      location: t('medical_loc'),
      contact: t('medical_contact'),
    },
    {
      icon: Footprints,
      title: t('evac_assembly'),
      location: t('evac_loc'),
      contact: t('evac_contact'),
    },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {t('safe_zones')}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              {t('offline_subtitle')}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <WifiOff className="w-3 h-3 text-emerald-600" />
          {t('works_offline')}
        </span>
      </div>

      {/* Grid of Essentials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {essentials.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-stone-900">{item.title}</h4>
                <p className="text-[11px] text-stone-600 mt-0.5">{item.location}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  {item.contact}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Helpline Banner */}
      <div className="rounded-xl bg-stone-900 text-white p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold">{t('help_desk')}</div>
            <div className="text-[11px] text-stone-300">{t('toll_free')}</div>
          </div>
        </div>
        <a
          href="tel:112"
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold transition whitespace-nowrap"
        >
          {t('call_now')}
        </a>
      </div>
    </div>
  );
};
