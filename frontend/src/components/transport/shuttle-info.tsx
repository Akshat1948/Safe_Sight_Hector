'use client';

import React, { useEffect, useState } from 'react';
import { IShuttleStatus, TransportStatus } from '@/shared/types';
import { getShuttleStatus } from '@/shared/api';
import { useLanguage } from '@/i18n';

const DEFAULT_SHUTTLE_MOCKS: IShuttleStatus[] = [
  {
    id: 's-1',
    name: 'Shuttle Route 1 (Ghat Express)',
    status: TransportStatus.OPERATIONAL,
    currentOccupancy: 35,
    totalCapacity: 50,
    nextDeparture: new Date(Date.now() + 8 * 60000).toISOString(),
    routeInfo: 'Main Entry Plaza → Sangam Ghat → Medical Center',
  },
  {
    id: 's-2',
    name: 'Shuttle Route 2 (Circulator)',
    status: TransportStatus.OPERATIONAL,
    currentOccupancy: 50,
    totalCapacity: 60,
    nextDeparture: new Date(Date.now() + 18 * 60000).toISOString(),
    routeInfo: 'Parking Lot A → Corridor B → Railway Link',
  },
];

export default function ShuttleInfo({ siteId, className = '' }: { siteId?: string; className?: string }) {
  const { t } = useLanguage();
  const [shuttles, setShuttles] = useState<IShuttleStatus[]>(DEFAULT_SHUTTLE_MOCKS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const fetchShuttles = async () => {
      try {
        setIsLoading(true);
        const res = await getShuttleStatus(siteId);
        if (res?.data && res.data.length > 0 && isSubscribed) {
          setShuttles(res.data);
        }
      } catch (err) {
        // Fallback to demo mock data
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    fetchShuttles();
    const interval = setInterval(fetchShuttles, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [siteId]);

  return (
    <div className={`p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-cyan-400">
            {t('public_transit')}
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            {t('shuttle_schedules')}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {isLoading ? t('refreshing') : t('live_schedules')}
        </span>
      </div>

      <div className="space-y-4">
        {shuttles.map((shuttle) => {
          const total = shuttle.totalCapacity || 50;
          const occupied = shuttle.currentOccupancy || 0;
          const percentage = Math.min(Math.round((occupied / total) * 100), 100);

          return (
            <div key={shuttle.id} className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">{shuttle.name}</span>
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {t('departs_in')} ~8 mins
                </span>
              </div>

              {/* Route Timeline */}
              {shuttle.routeInfo && (
                <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <span>📍</span>
                  <span className="truncate">{shuttle.routeInfo}</span>
                </div>
              )}

              {/* Capacity Status */}
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-1">
                <span>{t('passenger_load')}:</span>
                <span className="font-bold text-slate-300">
                  {occupied} / {total} {t('seats')} ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
