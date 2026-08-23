'use client';

import React, { useState, useEffect } from 'react';
import { IZone } from '@/shared/types';
import { getZones, getIncidents, getAlerts } from '@/shared/api';

interface AnalyticsPanelProps {
  siteId?: string | null;
}

export default function AnalyticsPanel({ siteId }: AnalyticsPanelProps) {
  const [zones, setZones] = useState<IZone[]>([]);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    criticalIncidents: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    if (!siteId) return;

    Promise.all([
      getZones(siteId),
      getIncidents(siteId),
      getAlerts(siteId),
    ])
      .then(([zonesRes, incidentsRes, alertsRes]) => {
        if (zonesRes.success && zonesRes.data) {
          setZones(zonesRes.data);
        }

        const incidents = incidentsRes.success && incidentsRes.data?.incidents ? incidentsRes.data.incidents : [];
        const alerts = alertsRes.success && alertsRes.data ? alertsRes.data : [];

        setStats({
          totalIncidents: incidents.length,
          criticalIncidents: incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length,
          activeAlerts: alerts.filter((a) => a.status === 'dispatched').length,
        });
      })
      .catch(console.error);
  }, [siteId]);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Incidents (Today)</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalIncidents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
            🚨
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl">
            📢
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Alerts</p>
            <p className="text-2xl font-bold text-slate-900">{stats.activeAlerts}</p>
          </div>
        </div>
      </div>

      {/* Zone Density */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Zone Density Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const densityPercent = zone.maxCapacity > 0 ? (zone.currentDensity / zone.maxCapacity) * 100 : 0;
            const isCrowded = densityPercent > 70;
            const isCritical = densityPercent > 90;

            let barColor = 'bg-green-500';
            if (isCritical) barColor = 'bg-red-500';
            else if (isCrowded) barColor = 'bg-orange-500';
            else if (densityPercent > 50) barColor = 'bg-yellow-500';

            return (
              <div key={zone.id} className="border border-slate-100 p-3 rounded-lg bg-slate-50">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="font-semibold text-slate-700 text-sm truncate">{zone.name}</span>
                  <span
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 capitalize ${
                      zone.densityStatus === 'red'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : zone.densityStatus === 'orange'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : zone.densityStatus === 'yellow'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        zone.densityStatus === 'red'
                          ? 'bg-red-600 animate-pulse'
                          : zone.densityStatus === 'orange'
                          ? 'bg-orange-500'
                          : zone.densityStatus === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="leading-none">{zone.densityStatus} ({Math.round(densityPercent)}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(densityPercent, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{zone.currentDensity} people</span>
                  <span>Max: {zone.maxCapacity}</span>
                </div>
              </div>
            );
          })}
          {zones.length === 0 && (
            <div className="col-span-full text-center py-4 text-slate-500 text-sm">
              No zone data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
