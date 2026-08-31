'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import AlertBanner from '@/components/alerts/alert-banner';
import AlertComposer from '@/components/alerts/alert-composer';
import { useAuth } from '@/shared/hooks';

export default function AlertsPage() {
  const { user } = useAuth();
  const [showComposer, setShowComposer] = useState(true);
  const siteId = user?.siteId || 'demo-site-prayagraj-01';

  return (
    <RoleGuard allowedRoles={['manager', 'admin', 'responder']}>
      <DashboardLayout>
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                Alert Broadcast Center & History
              </h1>
              <p className="text-on-surface-variant font-body-base mt-1">
                Compose, translate, and dispatch multi-channel safety alerts to visitors, responders, and PA speakers.
              </p>
            </div>

            <button
              onClick={() => setShowComposer((prev) => !prev)}
              className="px-4 py-2 bg-primary text-on-primary rounded font-body-bold text-xs hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {showComposer ? 'unfold_less' : 'campaign'}
              </span>
              <span>{showComposer ? 'Collapse Composer' : 'New Broadcast Alert'}</span>
            </button>
          </div>

          {/* Active Alert Banner */}
          <AlertBanner siteId={siteId} />

          {/* AI Multilingual Alert Composer */}
          {showComposer && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertComposer siteId={siteId} />
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

