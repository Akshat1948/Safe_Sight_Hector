'use client';

import React from 'react';
import { IZone, DensityStatus } from '@/shared/types';
import MapView from './map-view';

interface ZoneHeatmapProps {
  zones: IZone[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export default function ZoneHeatmap({
  zones = [],
  selectedZoneId,
  onSelectZone,
  className = '',
}: ZoneHeatmapProps) {
  const redZones = zones.filter((z) => z.densityStatus === DensityStatus.RED || z.densityStatus === ('red' as any));
  const orangeZones = zones.filter((z) => z.densityStatus === DensityStatus.ORANGE || z.densityStatus === ('orange' as any));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Status Alert Bar if any Red Zones exist */}
      {redZones.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center justify-between gap-3 text-red-200 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Surge Alert Detected:
            </span>
            <span className="text-xs font-semibold text-white">
              {redZones.map((z) => z.name).join(', ')} exceeding safe capacity limits.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white">
            High Priority
          </span>
        </div>
      )}

      {/* Main Map Component */}
      <MapView
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelectZone={onSelectZone}
        showHeatmap={true}
        className="h-[440px]"
      />

      {/* Quick Zone Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          const status = zone.densityStatus || DensityStatus.GREEN;
          const isRed = status === DensityStatus.RED || status === ('red' as any);
          const isOrange = status === DensityStatus.ORANGE || status === ('orange' as any);

          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone && onSelectZone(zone.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-cyan-500 bg-slate-800 shadow-md ring-1 ring-cyan-500/50'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isRed ? 'bg-red-500 animate-ping' : isOrange ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {zone.maxCapacity
                    ? `${Math.round((zone.currentDensity / zone.maxCapacity) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 truncate">{zone.name}</div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {zone.currentDensity?.toLocaleString() || 0} pilgrims
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
