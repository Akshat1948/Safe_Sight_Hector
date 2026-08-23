'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
        if (active.length > 0) {
          setSelectedIncident(active[0]);
        }
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

    try {
      await updateIncidentStatus(id, newStatus);
    } catch (err) {
      console.error(err);
    }
  };
  
  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['responder', 'manager', 'admin']}>
      <div className="flex flex-col h-screen w-full bg-background text-text-main overflow-hidden font-body-base antialiased">
        {/* Top Header */}
        <header className="h-topbar-height bg-surface border-b border-border-subtle flex items-center justify-between px-6 shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tighter leading-tight">
                  SafeSight HECTOR
                </span>
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest -mt-1">
                  Tactical Responder Unit
                </span>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container rounded border border-border-subtle text-xs font-telemetry-md">
              <span className="w-2 h-2 rounded-full bg-status-nominal animate-pulse"></span>
              GPS LINK ACTIVE: SECTOR NORTH
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase border border-border-subtle px-3 py-1.5 rounded"
            >
              Command Center
            </Link>
            <div className="text-right">
              <div className="text-xs font-body-bold text-on-surface">{user.name}</div>
              <div className="text-[10px] font-label-caps text-primary uppercase">{user.role}</div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-surface-container transition-colors cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </header>

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Feed */}
          <div className="w-full md:w-[380px] lg:w-[440px] bg-surface-container-low border-r border-border-subtle overflow-y-auto shrink-0 flex flex-col">
            <ResponderFeed 
              siteId={user.siteId} 
              incidents={incidents}
              onIncidentsChange={setIncidents}
              onSelectIncident={setSelectedIncident}
              selectedId={selectedIncident?.id}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>

          {/* Right: Details & GPS Navigation */}
          <div className="flex-1 bg-surface relative overflow-hidden flex flex-col">
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

