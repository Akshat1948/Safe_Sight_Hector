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
    <div className={`p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[9px] sm:text-[10px] font-sans uppercase font-bold tracking-widest text-cyan-600">
            {t('smart_mobility')}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 mt-0.5">
            {t('live_parking')}
          </h3>
        </div>
        <span className="text-[10px] sm:text-[11px] font-sans text-slate-500 shrink-0">
          {isLoading ? t('refreshing') : t('live_synced')}
        </span>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {parkingLots.map((lot) => {
          const total = lot.totalCapacity || 100;
          const occupied = lot.currentOccupancy || 0;
          const percentage = Math.min(Math.round((occupied / total) * 100), 100);
          const isFull = lot.status === TransportStatus.FULL || percentage >= 95;

          return (
            <div key={lot.id} className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-slate-900">{lot.name}</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                    isFull
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }`}
                >
                  {isFull ? t('full') : t('available')}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] sm:text-xs font-sans text-slate-500">
                  <span>{t('occupancy')}:</span>
                  <span className="font-bold text-slate-800">
                    {occupied} / {total} {t('spots')} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-600' : percentage > 75 ? 'bg-amber-600' : 'bg-emerald-600'
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
