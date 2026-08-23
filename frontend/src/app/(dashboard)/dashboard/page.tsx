'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import AnalyticsPanel from '@/components/dashboard/analytics-panel';
import IncidentQueue from '@/components/incidents/incident-queue';
import AlertBanner from '@/components/alerts/alert-banner';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth } from '@/shared/hooks';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  if (!user) return null; // RoleGuard will handle redirect

  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <AlertBanner siteId={user.siteId} />
          
          <AnalyticsPanel siteId={user.siteId} />
          
          <div className="h-[600px]">
            <IncidentQueue 
              showActions={false} 
              onIncidentClick={() => router.push('/dashboard/incidents')} 
            />
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
