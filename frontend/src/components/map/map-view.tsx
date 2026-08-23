'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IZone, DensityStatus } from '@/shared/types';

interface MapViewProps {
  zones?: IZone[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  center?: [number, number];
  zoom?: number;
  showHeatmap?: boolean;
  className?: string;
}

// Fallback demo zones for Prayagraj Sangam Kumbh Mela if API is loading
const DEFAULT_DEMO_ZONES = [
  {
    id: 'zone-a-entry',
    name: 'Zone A — Main Entry Plaza',
    currentDensity: 1420,
    maxCapacity: 2500,
    densityStatus: DensityStatus.GREEN,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.841, 25.431],
          [81.845, 25.431],
          [81.845, 25.436],
          [81.841, 25.436],
          [81.841, 25.431],
        ],
      ],
    },
  },
  {
    id: 'zone-b-ghat',
    name: 'Zone B — Sangam Ghat Steps',
    currentDensity: 3840,
    maxCapacity: 4000,
    densityStatus: DensityStatus.RED,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.846, 25.432],
          [81.851, 25.432],
          [81.851, 25.437],
          [81.846, 25.437],
          [81.846, 25.432],
        ],
      ],
    },
  },
  {
    id: 'zone-c-corridor',
    name: 'Zone C — East Corridor Link',
    currentDensity: 2100,
    maxCapacity: 3000,
    densityStatus: DensityStatus.ORANGE,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.852, 25.433],
          [81.856, 25.433],
          [81.856, 25.439],
          [81.852, 25.439],
          [81.852, 25.433],
        ],
      ],
    },
  },
  {
    id: 'zone-d-assembly',
    name: 'Zone D — Safe Assembly Grounds',
    currentDensity: 850,
    maxCapacity: 5000,
    densityStatus: DensityStatus.GREEN,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.842, 25.438],
          [81.848, 25.438],
          [81.848, 25.444],
          [81.842, 25.444],
          [81.842, 25.438],
        ],
      ],
    },
  },
];

export default function MapView({
  zones = [],
  selectedZoneId,
  onSelectZone,
  center = [25.4358, 81.8463], // Prayagraj Sangam
  zoom = 15,
  showHeatmap = true,
  className = '',
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeZoneDetails, setActiveZoneDetails] = useState<any>(null);

  const displayZones = zones && zones.length > 0 ? zones : (DEFAULT_DEMO_ZONES as any[]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    let L: any;
    const initMap = async () => {
      // Dynamic import of leaflet
      L = (await import('leaflet')).default;

      // Inject Leaflet CSS dynamically if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: false,
        });

        // Dark theme map tiles for high-contrast command awareness
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; SafeSight',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        layerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }

      // Render GeoJSON Zone Polygons
      if (layerGroupRef.current && L) {
        layerGroupRef.current.clearLayers();

        displayZones.forEach((zone) => {
          if (!zone.polygon?.coordinates) return;

          const status = zone.densityStatus || DensityStatus.GREEN;
          let fillColor = '#22c55e';
          let borderColor = '#16a34a';

          if (status === DensityStatus.RED || status === 'red') {
            fillColor = '#ef4444';
            borderColor = '#dc2626';
          } else if (status === DensityStatus.ORANGE || status === 'orange') {
            fillColor = '#f97316';
            borderColor = '#ea580c';
          } else if (status === DensityStatus.YELLOW || status === 'yellow') {
            fillColor = '#eab308';
            borderColor = '#ca8a04';
          }

          // Swap GeoJSON [lng, lat] to Leaflet [lat, lng]
          const latLngs = zone.polygon.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);

          const isSelected = selectedZoneId === zone.id;

          const polygon = L.polygon(latLngs, {
            color: borderColor,
            weight: isSelected ? 3 : 2,
            opacity: 0.9,
            fillColor: fillColor,
            fillOpacity: showHeatmap ? (status === 'red' ? 0.65 : 0.45) : 0.15,
            dashArray: isSelected ? '4, 4' : undefined,
          });

          // Custom Popup Content
          const capacityPercent = zone.maxCapacity
            ? Math.round((zone.currentDensity / zone.maxCapacity) * 100)
            : 50;

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; padding: 4px 2px; min-width: 190px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${borderColor}; letter-spacing: 0.05em; margin-bottom: 2px;">
                ${status.toUpperCase()} DENSITY
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                ${zone.name}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 4px;">
                <span>Live Headcount:</span>
                <strong style="color: #0f172a;">${zone.currentDensity?.toLocaleString() || 0}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
                <span>Capacity Load:</span>
                <strong style="color: ${borderColor};">${capacityPercent}%</strong>
              </div>
              <div style="background: #e2e8f0; border-radius: 4px; height: 6px; overflow: hidden;">
                <div style="background: ${fillColor}; width: ${Math.min(capacityPercent, 100)}%; height: 100%;"></div>
              </div>
            </div>
          `;

          polygon.bindPopup(popupContent);

          polygon.on('click', () => {
            setActiveZoneDetails(zone);
            if (onSelectZone) {
              onSelectZone(zone.id);
            }
          });

          layerGroupRef.current.addLayer(polygon);

          // Add a central badge marker for the zone name
          const bounds = polygon.getBounds();
          const centerPoint = bounds.getCenter();

          const labelIcon = L.divIcon({
            className: 'custom-map-label',
            html: `
              <div style="
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(4px);
                color: #ffffff;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 700;
                border: 1px solid ${borderColor};
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${fillColor}; ${status === 'red' ? 'animation: pulse 1s infinite;' : ''}"></span>
                ${zone.name.split('—')[0].trim()}
              </div>
            `,
            iconSize: [80, 20],
            iconAnchor: [40, 10],
          });

          const marker = L.marker(centerPoint, { icon: labelIcon });
          marker.on('click', () => {
            polygon.openPopup();
            setActiveZoneDetails(zone);
            if (onSelectZone) onSelectZone(zone.id);
          });

          layerGroupRef.current.addLayer(marker);
        });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, center, zoom, displayZones, selectedZoneId, showHeatmap, onSelectZone]);

  return (
    <div className={`relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-950 ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-0" />

      {/* Floating HUD Legend */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/70 shadow-lg flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Normal (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-red-400 font-bold">Surge Alert</span>
        </div>
      </div>

      {/* Active Selected Zone Drawer Card */}
      {activeZoneDetails && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-[400] bg-slate-900/95 backdrop-blur-lg p-4 rounded-xl border border-slate-700/80 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-cyan-400">
              Zone Telemetry Selected
            </span>
            <button
              onClick={() => setActiveZoneDetails(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>
          <h4 className="text-sm font-bold text-white mb-2">{activeZoneDetails.name}</h4>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400">Density</p>
              <p className="font-bold text-white">{activeZoneDetails.currentDensity?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Max Cap</p>
              <p className="font-bold text-slate-300">{activeZoneDetails.maxCapacity?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Load</p>
              <p className={`font-bold ${
                activeZoneDetails.densityStatus === 'red' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {activeZoneDetails.maxCapacity
                  ? `${Math.round((activeZoneDetails.currentDensity / activeZoneDetails.maxCapacity) * 100)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
