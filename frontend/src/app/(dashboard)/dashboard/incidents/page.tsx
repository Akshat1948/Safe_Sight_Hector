'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import IncidentQueue from '@/components/incidents/incident-queue';
import UserEvidencePanel from '@/components/incidents/user-evidence-panel';
import { useAuth } from '@/shared/hooks';
import { IIncident, IncidentStatus } from '@/shared/types';
import { verifyIncident } from '@/shared/api';

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IIncident | null>(null);

  const handleVerify = async (id: string) => {
    try {
      const res = await verifyIncident(id, 'verify');
      const updatedStatus = IncidentStatus.VERIFIED;
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: updatedStatus } : inc))
      );
      setSelectedIncident((prev) =>
        prev && prev.id === id ? { ...prev, status: updatedStatus } : prev
      );
    } catch (err) {
      console.error('Failed to verify incident', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await verifyIncident(id, 'dismiss');
      const updatedStatus = IncidentStatus.DISMISSED;
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: updatedStatus } : inc))
      );
      setSelectedIncident((prev) =>
        prev && prev.id === id ? { ...prev, status: updatedStatus } : prev
      );
    } catch (err) {
      console.error('Failed to dismiss incident', err);
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Incident Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor, verify, and inspect visitor-submitted reports across the site.
            </p>
          </div>

          <div className="min-h-[calc(100vh-220px)] relative">
            <div className="flex gap-6 items-start w-full transition-all duration-300 ease-in-out">
              {/* Incident Queue on the left */}
              <div className="flex-1 min-w-0 transition-all duration-300">
                <IncidentQueue
                  incidents={incidents}
                  onIncidentsChange={setIncidents}
                  onTitleClick={(incident) => {
                    setSelectedIncident((prev) => (prev?.id === incident.id ? null : incident));
                  }}
                  onVerify={handleVerify}
                  onDismiss={handleDismiss}
                />
              </div>

              {/* Smooth Slide-in Evidence Panel on the right */}
              <div
                className={`transition-all duration-300 ease-in-out sticky top-4 shrink-0 overflow-hidden ${
                  selectedIncident
                    ? 'w-full lg:w-[380px] xl:w-[420px] opacity-100'
                    : 'w-0 opacity-0 pointer-events-none'
                }`}
              >
                {selectedIncident && (
                  <div key={selectedIncident.id} className="w-full animate-in fade-in duration-200">
                    <UserEvidencePanel
                      incident={selectedIncident}
                      onClose={() => setSelectedIncident(null)}
                      onVerify={handleVerify}
                      onDismiss={handleDismiss}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
