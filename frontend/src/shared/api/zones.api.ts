import { apiClient } from './client';
import { IZone, IZoneDensity, ZoneType, DensityStatus } from '@/shared/types';

const DEMO_ZONES: IZone[] = [
  {
    id: 'zone-a-entry',
    siteId: 'demo-site-prayagraj-01',
    name: 'Zone A — Main Entry Plaza & Holding Area',
    zoneType: ZoneType.ENTRY_EXIT,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.841, 25.432],
          [81.845, 25.432],
          [81.845, 25.436],
          [81.841, 25.436],
          [81.841, 25.432],
        ],
      ],
    },
    maxCapacity: 1500,
    currentDensity: 420,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-b-corridor',
    siteId: 'demo-site-prayagraj-01',
    name: 'Zone B — Riverside Corridor Ghat 1-3',
    zoneType: ZoneType.CORRIDOR,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.845, 25.432],
          [81.85, 25.432],
          [81.85, 25.438],
          [81.845, 25.438],
          [81.845, 25.432],
        ],
      ],
    },
    maxCapacity: 800,
    currentDensity: 580,
    densityStatus: DensityStatus.YELLOW,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-c-staircase',
    siteId: 'demo-site-prayagraj-01',
    name: 'Zone C — Main Staircase Chokepoint',
    zoneType: ZoneType.HIGH_RISK,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.846, 25.435],
          [81.849, 25.435],
          [81.849, 25.438],
          [81.846, 25.438],
          [81.846, 25.435],
        ],
      ],
    },
    maxCapacity: 500,
    currentDensity: 460,
    densityStatus: DensityStatus.ORANGE,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-d-assembly',
    siteId: 'demo-site-prayagraj-01',
    name: 'Zone D — Safe Assembly & Medical Aid Ground',
    zoneType: ZoneType.SAFE_ASSEMBLY,
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [81.842, 25.438],
          [81.848, 25.438],
          [81.848, 25.443],
          [81.842, 25.443],
          [81.842, 25.438],
        ],
      ],
    },
    maxCapacity: 2000,
    currentDensity: 120,
    densityStatus: DensityStatus.GREEN,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

export async function getZones(siteId: string) {
  const res = await apiClient<IZone[]>(`/zones?siteId=${siteId}`);
  if (res.success && res.data && res.data.length > 0) {
    return res;
  }
  return {
    success: true,
    data: DEMO_ZONES,
    message: 'Demo zones loaded',
  };
}

export async function getZone(id: string) {
  const res = await apiClient<IZone>(`/zones/${id}`);
  if (res.success && res.data) {
    return res;
  }
  const found = DEMO_ZONES.find((z) => z.id === id) || DEMO_ZONES[0];
  return {
    success: true,
    data: found,
    message: 'Demo zone loaded',
  };
}

export async function getZoneDensity(
  zoneId: string,
  params?: { limit?: number },
) {
  const query = params?.limit ? `?limit=${params.limit}` : '';
  const res = await apiClient<IZoneDensity>(`/zones/${zoneId}/density${query}`);
  if (res.success && res.data) {
    return res;
  }

  const zone = DEMO_ZONES.find((z) => z.id === zoneId) || DEMO_ZONES[0];
  return {
    success: true,
    data: {
      zoneId: zone.id,
      zoneName: zone.name,
      currentDensity: zone.currentDensity,
      maxCapacity: zone.maxCapacity,
      densityStatus: zone.densityStatus,
      readings: [
        {
          headcount: zone.currentDensity,
          flowRate: 42.5,
          flowVelocity: 0.75,
          recordedAt: new Date().toISOString(),
        },
      ],
    },
    message: 'Demo density loaded',
  };
}
