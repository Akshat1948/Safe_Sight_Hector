'use client';

import React, { useState } from 'react';
import { Car, Bus, MapPin, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n';

export const VisitorTransportWidget: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'parking' | 'shuttle'>('parking');

  const parkingLots = [
    {
      name: 'North Gate Parking (P1)',
      total: 1200,
      occupied: 780,
      status: 'Open',
      distance: '350m from Entry A',
      color: 'emerald',
    },
    {
      name: 'South Bypass Ground (P2)',
      total: 2500,
      occupied: 2280,
      status: 'Near Full (91%)',
      distance: '800m (Free Shuttle Available)',
      color: 'amber',
    },
    {
      name: 'VIP / Emergency Reserve (P3)',
      total: 300,
      occupied: 290,
      status: 'Restricted',
      distance: '100m from Sanctum',
      color: 'red',
    },
  ];

  const shuttles = [
    {
      route: 'Route 1: P2 South Bypass ⇄ Entry Plaza A',
      frequency: 'Every 5 mins',
      nextBus: 'In 3 mins',
      fare: 'Free / Zero Charge',
      status: 'Smooth Flow',
    },
    {
      route: 'Route 2: Railway Station ⇄ Ghat Holding Area',
      frequency: 'Every 10 mins',
      nextBus: 'In 7 mins',
      fare: '₹10 / Electric AC',
      status: 'Moderate Traffic',
    },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            {activeTab === 'parking' ? <Car className="w-4 h-4 text-amber-600" /> : <Bus className="w-4 h-4 text-amber-600" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {t('transport_status')}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              {t('transport_subtitle')}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-stone-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('parking')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'parking'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('parking')}
          </button>
          <button
            onClick={() => setActiveTab('shuttle')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'shuttle'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('shuttles')}
          </button>
        </div>
      </div>

      {/* Parking Tab */}
      {activeTab === 'parking' && (
        <div className="space-y-3">
          {parkingLots.map((lot, idx) => {
            const pct = Math.round((lot.occupied / lot.total) * 100);
            const isNearFull = pct > 85;
            return (
              <div key={idx} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{lot.name}</h4>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {lot.distance}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isNearFull
                        ? 'bg-red-100 text-red-800'
                        : pct > 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {lot.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] mb-1 text-stone-600">
                  <span>
                    {t('occupancy')}: {lot.occupied} / {lot.total} {t('spots')}
                  </span>
                  <span className="font-bold text-stone-900">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isNearFull ? 'bg-red-600' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shuttle Tab */}
      {activeTab === 'shuttle' && (
        <div className="space-y-3">
          {shuttles.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-xs font-bold text-stone-900 leading-snug">{s.route}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                  {s.fare}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-200/50 mt-2">
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {t('next_departure')}: {s.nextBus}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {s.frequency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
