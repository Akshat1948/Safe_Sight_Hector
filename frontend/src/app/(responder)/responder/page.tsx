'use client';

import React, { useState, useEffect } from 'react';
import ResponderFeed from '@/components/responder/responder-feed';
import NavigationPanel from '@/components/responder/navigation-panel';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth, useSocket } from '@/shared/hooks';
import { IIncident, IncidentStatus } from '@/shared/types';
import { getIncidents, updateIncidentStatus } from '@/shared/api';

export default function ResponderPage() {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IIncident | null>(null);
  const { on, off } = useSocket(user?.siteId || null);

  useEffect(() => {
    if (!user?.siteId) return;

    getIncidents(user.siteId).then((res) => {
      if (res.success && res.data?.incidents) {
        const active = res.data.incidents.filter(
          (i) => i.status === 'verified' || i.status === 'responding'
        );
        setIncidents(active);
      }
    });
  }, [user?.siteId]);

  useEffect(() => {
    const handleUpdate = (updatedData: unknown) => {
      const updated = updatedData as IIncident;
      if (!updated?.id) return;

      if (updated.status === 'verified' || updated.status === 'responding') {
        setIncidents((prev) => {
          const exists = prev.find((i) => i.id === updated.id);
          if (exists) return prev.map((i) => (i.id === updated.id ? updated : i));
          return [updated, ...prev];
        });
        if (selectedIncident?.id === updated.id) {
          setSelectedIncident(updated);
        }
      } else {
        setIncidents((prev) => prev.filter((i) => i.id !== updated.id));
        if (selectedIncident?.id === updated.id) {
          setSelectedIncident(null);
        }
      }
    };

    on('incident:verified', handleUpdate);
    on('incident:status:update', handleUpdate);

    return () => {
      off('incident:verified', handleUpdate);
      off('incident:status:update', handleUpdate);
    };
  }, [on, off, selectedIncident?.id]);

  const handleStatusUpdate = async (id: string, newStatus: 'responding' | 'resolved') => {
    // 1. Optimistic UI update across both left and right panes
    if (newStatus === 'resolved') {
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      if (selectedIncident?.id === id) setSelectedIncident(null);
    } else {
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus as unknown as IncidentStatus } : i))
      );
      if (selectedIncident?.id === id) {
        setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus as unknown as IncidentStatus } : null));
      }
    }

    // 2. Call real backend API endpoint (PATCH /api/incidents/:id/status)
    try {
      await updateIncidentStatus(id, newStatus);
    } catch (err) {
      console.error(err);
    }
  };
  
  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['responder', 'admin']}>
      <div className="flex flex-col h-screen w-full bg-[#F3F4F1] overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚑</span>
            <h1 className="text-xl font-bold tracking-wide">Emergency Responder Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-200">{user.name}</div>
              <div className="text-xs text-indigo-300 uppercase tracking-wider">{user.role}</div>
            </div>
            <button 
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors text-sm shadow-sm hover:shadow-red-600/30 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden bg-[#F3F4F1]">
          {/* Left: Feed */}
          <div className="w-1/3 min-w-[320px] max-w-[450px] bg-[#F3F4F1] border-r border-slate-300 overflow-y-auto">
            <ResponderFeed 
              siteId={user.siteId} 
              incidents={incidents}
              onIncidentsChange={setIncidents}
              onSelectIncident={setSelectedIncident}
              selectedId={selectedIncident?.id}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>

          {/* Right: Details/Navigation */}
          <div className="flex-1 bg-[#F3F4F1] relative">
            <NavigationPanel 
              incident={selectedIncident} 
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
