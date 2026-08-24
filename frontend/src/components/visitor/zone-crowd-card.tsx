'use client';

import React from 'react';
import { IZone, DensityStatus } from '@/shared/types';
import { Users, Clock, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface ZoneCrowdCardProps {
  zone: IZone;
  onSelectZone?: (zone: IZone) => void;
  isSelected?: boolean;
}

export const ZoneCrowdCard: React.FC<ZoneCrowdCardProps> = ({
  zone,
  onSelectZone,
  isSelected = false,
}) => {
  const { t } = useLanguage();

  const densityPercent = Math.min(
    100,
    Math.round((zone.currentDensity / (zone.maxCapacity || 1000)) * 100)
  );

  const getStatusConfig = (status: DensityStatus) => {
    switch (status) {
      case DensityStatus.GREEN:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          label: t('status_green') || 'Low Density — Safe',
          barColor: 'bg-emerald-500',
          waitTime: '5–10 mins',
          action: 'Normal Entry Permitted',
          icon: CheckCircle2,
        };
      case DensityStatus.YELLOW:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badgeBg: 'bg-amber-100 text-amber-800',
          label: t('status_yellow') || 'Moderate Density — Normal',
          barColor: 'bg-amber-500',
          waitTime: '15–25 mins',
          action: 'Expect Moderate Queues',
          icon: Clock,
        };
      case DensityStatus.ORANGE:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          badgeBg: 'bg-orange-100 text-orange-800',
          label: t('status_orange') || 'High Density — Caution',
          barColor: 'bg-orange-500',
          waitTime: '35–45 mins',
          action: 'Use Holding Area D',
          icon: AlertTriangle,
        };
      case DensityStatus.RED:
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-800',
          badgeBg: 'bg-red-100 text-red-800 animate-pulse',
          label: t('status_red') || 'Critical — Avoid Zone',
          barColor: 'bg-red-600',
          waitTime: 'Paused / Diverted',
          action: 'Diverted to Bypass Trail',
          icon: ShieldAlert,
        };
      default:
        return {
          bg: 'bg-stone-50',
          border: 'border-stone-200',
          text: 'text-stone-800',
          badgeBg: 'bg-stone-100 text-stone-700',
          label: 'Unknown',
          barColor: 'bg-stone-400',
          waitTime: '—',
          action: 'Proceed with Caution',
          icon: Users,
        };
    }
  };

  const config = getStatusConfig(zone.densityStatus);
  const Icon = config.icon;

  return (
    <div
      onClick={() => onSelectZone && onSelectZone(zone)}
      className={`rounded-xl border p-4 bg-white shadow-sm transition-all cursor-pointer ${
        isSelected
          ? 'ring-2 ring-amber-600 border-amber-600 shadow-md'
          : 'hover:border-stone-300 hover:shadow'
      }`}
    >
      {/* Zone Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <h4 className="text-sm font-bold text-stone-900 leading-snug">{zone.name}</h4>
          <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            {zone.zoneType.replace(/_/g, ' ')}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${config.badgeBg}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{config.label.split(' — ')[0]}</span>
        </span>
      </div>

      {/* Density Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-stone-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            Headcount: {zone.currentDensity.toLocaleString()} / {zone.maxCapacity.toLocaleString()}
          </span>
          <span className="font-bold text-stone-900">{densityPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
            style={{ width: `${densityPercent}%` }}
          />
        </div>
      </div>

      {/* Advisory & Est. Wait */}
      <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-stone-600">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Est. Wait: <strong className="text-stone-900">{config.waitTime}</strong></span>
        </div>
        <span className="text-[11px] font-medium text-stone-500">
          {config.action}
        </span>
      </div>
    </div>
  );
};
