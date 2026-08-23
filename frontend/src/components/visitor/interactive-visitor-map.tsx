'use client';

import React, { useState } from 'react';
import { IZone, DensityStatus } from '@/shared/types';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  AlertTriangle,
  LifeBuoy,
} from 'lucide-react';
import { useLanguage } from '@/i18n';

interface InteractiveVisitorMapProps {
  zones: IZone[];
  selectedZone: IZone | null;
  onSelectZone: (zone: IZone) => void;
}

export const InteractiveVisitorMap: React.FC<InteractiveVisitorMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
}) => {
  const { t } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState(1);

  const getZoneColor = (status: DensityStatus, isSelected: boolean) => {
    switch (status) {
      case DensityStatus.GREEN:
        return {
          fill: isSelected ? '#10B981' : '#34D399',
          stroke: '#059669',
          bg: 'bg-emerald-500',
          badge: 'Safe (35%)',
        };
      case DensityStatus.YELLOW:
        return {
          fill: isSelected ? '#F59E0B' : '#FBBF24',
          stroke: '#D97706',
          bg: 'bg-amber-500',
          badge: 'Moderate (65%)',
        };
      case DensityStatus.ORANGE:
        return {
          fill: isSelected ? '#F97316' : '#FB923C',
          stroke: '#EA580C',
          bg: 'bg-orange-500',
          badge: 'Caution (82%)',
        };
      case DensityStatus.RED:
        return {
          fill: isSelected ? '#EF4444' : '#F87171',
          stroke: '#DC2626',
          bg: 'bg-red-600',
          badge: 'Critical Surge',
        };
      default:
        return {
          fill: '#94A3B8',
          stroke: '#64748B',
          bg: 'bg-slate-400',
          badge: 'Normal',
        };
    }
  };

  return (
    <div className="relative rounded-2xl border border-stone-200 bg-stone-100/70 overflow-hidden shadow-sm">
      {/* Map Header */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-2">
        <Compass className="w-4 h-4 text-amber-600 animate-spin-slow" />
        <span className="text-xs font-bold text-stone-900">
          {t('live_map') || 'Interactive Tactical Crowd GIS'}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Surge
        </span>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-stone-200 shadow-sm">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Vector GIS Canvas */}
      <div className="w-full h-[380px] sm:h-[460px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50/20 to-stone-200">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Waterway / River Backdrop (Triveni Sangam confluence) */}
          <path
            d="M 0,260 Q 200,240 400,290 T 800,270 L 800,500 L 0,500 Z"
            fill="#E0F2FE"
            opacity="0.85"
          />
          <path
            d="M 380,0 Q 420,150 400,290 L 460,300 Q 470,140 440,0 Z"
            fill="#BAE6FD"
            opacity="0.7"
          />
          <text x="560" y="440" fill="#0284C7" fontSize="13" fontWeight="bold" opacity="0.6">
            Ganga River Flow
          </text>
          <text x="120" y="440" fill="#0369A1" fontSize="13" fontWeight="bold" opacity="0.6">
            Yamuna Confluence
          </text>

          {/* Pedestrian Pathways & Corridors */}
          <path
            d="M 120,80 L 320,120 L 520,110 L 700,90"
            stroke="#CBD5E1"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 320,120 L 320,240 L 480,240"
            stroke="#CBD5E1"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 520,110 L 520,240"
            stroke="#CBD5E1"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Evacuation Flow Arrows */}
          <path
            d="M 460,200 L 600,200 L 650,140"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="6,4"
            fill="none"
          />
          <text x="580" y="185" fill="#059669" fontSize="10" fontWeight="bold">
            Safe Corridor Exit ➔
          </text>

          {/* Dynamic Zone Polygons */}
          {/* Zone A: Holding & Entry Plaza */}
          <g
            className="cursor-pointer transition-all hover:opacity-90"
            onClick={() => onSelectZone(zones[0] || ({ id: 'zone-a-entry', name: 'Zone A' } as IZone))}
          >
            <rect
              x="80"
              y="60"
              width="180"
              height="110"
              rx="14"
              fill={getZoneColor(zones[0]?.densityStatus || DensityStatus.GREEN, selectedZone?.id === zones[0]?.id).fill}
              fillOpacity="0.4"
              stroke={getZoneColor(zones[0]?.densityStatus || DensityStatus.GREEN, selectedZone?.id === zones[0]?.id).stroke}
              strokeWidth={selectedZone?.id === zones[0]?.id ? '3.5' : '2'}
            />
            <circle cx="170" cy="115" r="4" fill="#059669" />
            <text x="170" y="105" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="bold">
              Zone A: Entry Plaza
            </text>
            <text x="170" y="130" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
              {zones[0]?.currentDensity || 420} / {zones[0]?.maxCapacity || 1500}
            </text>
          </g>

          {/* Zone B: Riverside Ghat Steps */}
          <g
            className="cursor-pointer transition-all hover:opacity-90"
            onClick={() => onSelectZone(zones[1] || ({ id: 'zone-b-corridor', name: 'Zone B' } as IZone))}
          >
            <polygon
              points="300,100 480,90 480,220 300,210"
              fill={getZoneColor(zones[1]?.densityStatus || DensityStatus.YELLOW, selectedZone?.id === zones[1]?.id).fill}
              fillOpacity="0.4"
              stroke={getZoneColor(zones[1]?.densityStatus || DensityStatus.YELLOW, selectedZone?.id === zones[1]?.id).stroke}
              strokeWidth={selectedZone?.id === zones[1]?.id ? '3.5' : '2'}
            />
            <text x="390" y="145" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="bold">
              Zone B: Ghat Steps
            </text>
            <text x="390" y="165" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
              {zones[1]?.currentDensity || 580} / {zones[1]?.maxCapacity || 800}
            </text>
          </g>

          {/* Zone C: Main Staircase (Chokepoint) */}
          <g
            className="cursor-pointer transition-all hover:opacity-90"
            onClick={() => onSelectZone(zones[2] || ({ id: 'zone-c-staircase', name: 'Zone C' } as IZone))}
          >
            <rect
              x="510"
              y="90"
              width="150"
              height="100"
              rx="12"
              fill={getZoneColor(zones[2]?.densityStatus || DensityStatus.ORANGE, selectedZone?.id === zones[2]?.id).fill}
              fillOpacity="0.45"
              stroke={getZoneColor(zones[2]?.densityStatus || DensityStatus.ORANGE, selectedZone?.id === zones[2]?.id).stroke}
              strokeWidth={selectedZone?.id === zones[2]?.id ? '3.5' : '2'}
            />
            <text x="585" y="135" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="bold">
              Zone C: Staircase Choke
            </text>
            <text x="585" y="155" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
              {zones[2]?.currentDensity || 460} / {zones[2]?.maxCapacity || 500}
            </text>
          </g>

          {/* Zone D: Safe Assembly Ground */}
          <g
            className="cursor-pointer transition-all hover:opacity-90"
            onClick={() => onSelectZone(zones[3] || ({ id: 'zone-d-assembly', name: 'Zone D' } as IZone))}
          >
            <polygon
              points="540,220 720,200 750,330 570,350"
              fill={getZoneColor(zones[3]?.densityStatus || DensityStatus.GREEN, selectedZone?.id === zones[3]?.id).fill}
              fillOpacity="0.4"
              stroke={getZoneColor(zones[3]?.densityStatus || DensityStatus.GREEN, selectedZone?.id === zones[3]?.id).stroke}
              strokeWidth={selectedZone?.id === zones[3]?.id ? '3.5' : '2'}
            />
            <text x="645" y="270" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="bold">
              Zone D: Safe Assembly
            </text>
            <text x="645" y="290" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
              {zones[3]?.currentDensity || 120} / {zones[3]?.maxCapacity || 2000}
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Zone Quick Bar */}
      {selectedZone && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-200 shadow-md text-xs flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
          <div>
            <strong className="text-stone-900 block">{selectedZone.name}</strong>
            <span className="text-stone-600">
              Density: {selectedZone.currentDensity} / {selectedZone.maxCapacity} ({Math.round((selectedZone.currentDensity / selectedZone.maxCapacity) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
