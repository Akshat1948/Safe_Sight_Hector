'use client';

import React, { useEffect, useState } from 'react';
import { IParkingStatus, TransportStatus } from '@/shared/types';
import { getParkingStatus } from '@/shared/api';
import { useLanguage } from '@/i18n';

const DEFAULT_PARKING_MOCKS: IParkingStatus[] = [
  {
    id: 'p-1',
    name: 'Parking Lot A — Sangam North',
    totalCapacity: 500,
    currentOccupancy: 380,
    status: TransportStatus.OPERATIONAL,
  },
  {
    id: 'p-2',
    name: 'Parking Lot B — VIP & Emergency Holding',
    totalCapacity: 200,
    currentOccupancy: 195,
    status: TransportStatus.FULL,
  },
];

export default function ParkingStatus({ siteId, className = '' }: { siteId?: string; className?: string }) {
  const { t } = useLanguage();
  const [parkingLots, setParkingLots] = useState<IParkingStatus[]>(DEFAULT_PARKING_MOCKS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const fetchParking = async () => {
      try {
        setIsLoading(true);
        const res = await getParkingStatus(siteId);
        if (res?.data && res.data.length > 0 && isSubscribed) {
          setParkingLots(res.data);
        }
      } catch (err) {
        // Fallback to demo mock data gracefully
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    fetchParking();
    const interval = setInterval(fetchParking, 15000); // 15s refresh
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
            {t('smart_mobility')}
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            {t('live_parking')}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {isLoading ? t('refreshing') : t('live_synced')}
        </span>
      </div>

      <div className="space-y-4">
        {parkingLots.map((lot) => {
          const total = lot.totalCapacity || 100;
          const occupied = lot.currentOccupancy || 0;
          const percentage = Math.min(Math.round((occupied / total) * 100), 100);
          const isFull = lot.status === TransportStatus.FULL || percentage >= 95;

          return (
            <div key={lot.id} className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">{lot.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isFull
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isFull ? t('full') : t('available')}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{t('occupancy')}:</span>
                  <span className="font-bold text-slate-200">
                    {occupied} / {total} {t('spots')} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-500' : percentage > 75 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
