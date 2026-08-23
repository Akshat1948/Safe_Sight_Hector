'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import AnalyticsPanel from '@/components/dashboard/analytics-panel';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth } from '@/shared/hooks';

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null; // RoleGuard will handle redirect

  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <AnalyticsPanel siteId={user.siteId} />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}


