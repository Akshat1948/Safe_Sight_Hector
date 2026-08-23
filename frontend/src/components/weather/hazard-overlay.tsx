'use client';

import React from 'react';
import { IHazard } from '@/shared/types';
import { useLanguage } from '@/i18n';

interface HazardOverlayProps {
  hazard?: IHazard | null;
  className?: string;
}

const HAZARD_CONFIG: Record<
  string,
  { icon: string; bg: string; border: string; text: string; badgeBg: string; badgeText: string }
> = {
  severe: {
    icon: '⚡🚨',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-950',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
  },
  high: {
    icon: '⚠️',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-950',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
  },
  moderate: {
    icon: '🌧️',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-950',
    badgeBg: 'bg-yellow-500',
    badgeText: 'text-slate-900',
  },
  low: {
    icon: 'ℹ️',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-950',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
  },
  none: {
    icon: '☀️',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-950',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
  },
};

export default function HazardOverlay({ hazard, className = '' }: HazardOverlayProps) {
  const { t } = useLanguage();

  if (!hazard) return null;

  const level = (hazard.level || 'none').toLowerCase();
  const config = HAZARD_CONFIG[level] || HAZARD_CONFIG.low;
  const isElevated = level === 'moderate' || level === 'high' || level === 'severe';

  if (!isElevated && !hazard.advisory) return null;

  return (
    <div
      className={`rounded-xl p-3.5 border backdrop-blur-sm transition-all ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}
            >
              {hazard.level ? hazard.level.toUpperCase() : 'ADVISORY'}
            </span>
            {hazard.type && (
              <span className="text-xs font-bold capitalize text-slate-800">
                {hazard.type.replace('_', ' ')} Hazard
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm font-medium leading-relaxed opacity-95">
            {hazard.advisory || t('safety_advisory')}
          </p>
        </div>
      </div>
    </div>
  );
}
