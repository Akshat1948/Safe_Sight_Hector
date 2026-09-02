'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IZone, DensityStatus, IIncident } from '@/shared/types';

export interface CustomMarkerItem {
  id: string;
  coordinates: [number, number]; // [latitude, longitude]
  label?: string;
  icon?: string;
  color?: string;
  pulse?: boolean;
}

interface MapViewProps {
  zones?: IZone[];
  incidents?: IIncident[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  center?: [number, number];
  zoom?: number;
  showHeatmap?: boolean;
  showLegend?: boolean;
  showZoneDrawer?: boolean;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  targetWaypoint?: { lat: number; lng: number; label?: string } | null;
  customMarkers?: CustomMarkerItem[];
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
  incidents = [],
  selectedZoneId,
  onSelectZone,
  center = [25.4358, 81.8463], // Prayagraj Sangam
  zoom = 15,
  showHeatmap = true,
  showLegend = false,
  showZoneDrawer = false,
  className = '',
  onMapClick,
  targetWaypoint,
  customMarkers = [],
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

  const leafletRef = useRef<any>(null);

  // Initialize Map once
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    let isCleanedUp = false;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      leafletRef.current = L;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current && mapContainerRef.current && !isCleanedUp) {
        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; SafeSight',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        layerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }
    };

    initMap();

    return () => {
      isCleanedUp = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted]);

  // Update map view if center or zoom changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom || 15);
    }
  }, [center, zoom]);

  // Update Layers reactively when zones/incidents change
  useEffect(() => {
    const L = leafletRef.current;
    if (!layerGroupRef.current || !L) return;

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

      // Central badge marker
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

    // Render Incident Markers
    if (incidents && incidents.length > 0) {
      incidents.forEach((inc) => {
        const loc = inc.location as any;
        const lat = loc?.coordinates?.[1] ?? loc?.latitude ?? loc?.[1] ?? 25.4358;
        const lng = loc?.coordinates?.[0] ?? loc?.longitude ?? loc?.[0] ?? 81.8463;
        const isCritical = inc.severity === 'critical';

        const incIcon = L.divIcon({
          className: 'custom-incident-pin',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${isCritical ? '#dc2626' : '#ea580c'};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              box-shadow: 0 0 12px ${isCritical ? 'rgba(220, 38, 38, 0.8)' : 'rgba(234, 88, 12, 0.8)'};
              animation: ${isCritical ? 'pulse 1.2s infinite' : 'none'};
            ">
              <span class="material-symbols-outlined" style="font-size: 16px;">warning</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const incMarker = L.marker([lat, lng], { icon: incIcon });
        incMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px;">
            <strong style="color: ${isCritical ? '#dc2626' : '#ea580c'};">${inc.severity.toUpperCase()} INCIDENT</strong>
            <p style="font-size: 12px; margin: 4px 0 0 0; color: #0f172a;">${inc.title}</p>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Zone: ${inc.zoneName || inc.zoneId || 'Site'}</p>
          </div>
        `);
        layerGroupRef.current.addLayer(incMarker);
      });
    }

    // Render Custom Asset Markers (Vehicles, Ambulances, Fire Tenders, Drones)
    if (customMarkers && customMarkers.length > 0) {
      customMarkers.forEach((m) => {
        const markerColor = m.color || '#3b82f6';
        const assetIcon = L.divIcon({
          className: 'custom-asset-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              ${
                m.pulse
                  ? `<div style="position: absolute; top: -3px; left: -3px; width: 34px; height: 34px; border-radius: 50%; background: ${markerColor}; opacity: 0.4; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                  : ''
              }
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${markerColor};
                border: 2px solid #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                position: relative;
                z-index: 10;
              ">
                <span class="material-symbols-outlined" style="font-size: 16px;">${m.icon || 'near_me'}</span>
              </div>
              ${
                m.label
                  ? `<div style="background: rgba(15,23,42,0.9); color: #ffffff; border: 1px solid ${markerColor}; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; white-space: nowrap; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: system-ui, sans-serif;">
                      ${m.label}
                    </div>`
                  : ''
              }
            </div>
          `,
          iconSize: [28, 44],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(m.coordinates, { icon: assetIcon, zIndexOffset: 500 });
        if (m.label) {
          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; padding: 4px;">
              <strong style="color: ${markerColor};">${m.label}</strong>
              <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0; font-family: monospace;">GPS: ${m.coordinates[0].toFixed(4)}° N, ${m.coordinates[1].toFixed(4)}° E</p>
            </div>
          `);
        }
        layerGroupRef.current.addLayer(marker);
      });
    }

    // Render Exact Point-on-Map Target Destination Waypoint Pin
    if (targetWaypoint && targetWaypoint.lat && targetWaypoint.lng) {
      const targetIcon = L.divIcon({
        className: 'custom-target-waypoint',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; z-index: 999;">
            <div style="position: absolute; top: -8px; left: -8px; width: 48px; height: 48px; border-radius: 50%; border: 2.5px dashed #ef4444; animation: spin 4s linear infinite; opacity: 0.85;"></div>
            <div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; border-radius: 50%; background: rgba(239,68,68,0.35); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #ef4444;
              border: 2.5px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              box-shadow: 0 0 16px rgba(239, 68, 68, 0.95);
              position: relative;
              z-index: 10;
            ">
              <span class="material-symbols-outlined" style="font-size: 20px;">my_location</span>
            </div>
            <div style="background: #ef4444; color: #ffffff; border: 1.5px solid #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; white-space: nowrap; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); letter-spacing: 0.05em; font-family: monospace;">
              ${targetWaypoint.label || '🎯 Target GPS Waypoint'}
            </div>
          </div>
        `,
        iconSize: [48, 60],
        iconAnchor: [24, 16],
      });

      const waypointMarker = L.marker([targetWaypoint.lat, targetWaypoint.lng], {
        icon: targetIcon,
        zIndexOffset: 1000,
      });

      waypointMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <strong style="color: #ef4444; font-size: 12px;">TARGET DISPATCH DESTINATION</strong>
          <p style="font-size: 12px; margin: 4px 0 0 0; color: #0f172a; font-family: monospace; font-weight: bold;">
            ${targetWaypoint.lat.toFixed(5)}° N, ${targetWaypoint.lng.toFixed(5)}° E
          </p>
        </div>
      `);
      layerGroupRef.current.addLayer(waypointMarker);
    }
  }, [displayZones, incidents, selectedZoneId, showHeatmap, onSelectZone, customMarkers, targetWaypoint]);

  // Handle map click event for point-on-map coordinate picking
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: any) => {
      if (onMapClick && e.latlng) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onMapClick]);

  return (
    <div className={`relative w-full h-full min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-950 ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[320px] sm:min-h-[380px] z-0" />

      {/* Floating HUD Legend */}
      {showLegend && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl border border-slate-700/70 shadow-lg flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-slate-200 max-w-[calc(100%-16px)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500"></span>
            <span>Normal (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-400"></span>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-orange-500"></span>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-red-400 font-bold">Surge Alert</span>
          </div>
        </div>
      )}

      {/* Active Selected Zone Drawer Card */}
      {showZoneDrawer && activeZoneDetails && (
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-auto sm:max-w-sm z-[400] bg-slate-900/95 backdrop-blur-lg p-3 sm:p-4 rounded-xl border border-slate-700/80 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold tracking-wider text-cyan-400">
              Zone Telemetry Selected
            </span>
            <button
              onClick={() => setActiveZoneDetails(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white mb-2">{activeZoneDetails.name}</h4>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400">Density</p>
              <p className="font-bold text-white truncate">{activeZoneDetails.currentDensity?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400">Max Cap</p>
              <p className="font-bold text-slate-300 truncate">{activeZoneDetails.maxCapacity?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400">Load</p>
              <p className={`font-bold ${activeZoneDetails.densityStatus === 'red' ? 'text-red-400' : 'text-emerald-400'
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

