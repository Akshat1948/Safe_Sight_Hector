'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import AnalyticsPanel from '@/components/dashboard/analytics-panel';
import { useAuth } from '@/shared/hooks';

export default function DashboardPage() {
  const { user } = useAuth();
  const siteId = user?.siteId || 'demo-site-prayagraj-01';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <AnalyticsPanel siteId={siteId} />
      </div>
    </DashboardLayout>
  );
}
