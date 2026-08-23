'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import AlertBanner from '@/components/alerts/alert-banner';
import AlertComposer from '@/components/alerts/alert-composer';
import { useAuth } from '@/shared/hooks';

export default function AlertsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Alert Center</h1>
            <p className="text-slate-500 text-sm mt-1">
              Compose and dispatch safety alerts. Monitor active alert statuses across the site.
            </p>
          </div>

          <AlertBanner siteId={user.siteId} />

          <AlertComposer siteId={user.siteId} />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
