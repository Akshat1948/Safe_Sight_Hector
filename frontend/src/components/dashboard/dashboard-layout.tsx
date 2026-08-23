'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const TOP_NAV_TABS = [
  { label: 'KPI Overview', href: '/dashboard' },
  { label: 'Real-time Map', href: '/dashboard/map' },
  { label: 'Asset Tracking', href: '/dashboard/assets' },
  { label: 'Alert History', href: '/dashboard/alerts' },
  { label: 'Incidents', href: '/dashboard/incidents' },
  { label: 'SOS Queue', href: '/dashboard/sos' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lockdownActive, setLockdownActive] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/incidents?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleEmergencyLockdown = () => {
    const confirm = window.confirm(
      'EMERGENCY LOCKDOWN PROTOCOL\n\nAre you sure you want to broadcast site-wide lockdown alerts and restrict sector access?'
    );
    if (confirm) {
      setLockdownActive(true);
      router.push('/dashboard/alerts?lockdown=true');
    }
  };

  return (
    <div className="font-body-base min-h-screen h-screen overflow-hidden flex bg-background text-text-main antialiased select-none">
      {/* SideNavBar (Shared Component) */}
      <aside className="fixed left-0 top-0 h-full w-sidebar-icon-width md:w-64 bg-surface border-r border-border-subtle flex flex-col py-4 z-50 shrink-0">
        {/* Brand Area (Desktop) */}
        <div className="hidden md:flex flex-col px-6 mb-6 mt-1">
          <Link href="/dashboard" className="flex items-center space-x-3 mb-1 group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-105 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <span className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tighter">SafeSight</span>
          </Link>
          <span className="text-on-surface-variant font-label-caps text-[10px] tracking-widest uppercase ml-9">Operational Command</span>
        </div>

        {/* Brand Area (Mobile/Rail) */}
        <div className="flex md:hidden flex-col items-center justify-center mb-6 mt-1">
          <Link href="/dashboard">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
          </Link>
        </div>

        {/* Primary Nav Cluster */}
        <div className="flex-1 overflow-y-auto w-full px-2 space-y-1">
          <ul className="space-y-1 w-full">
            {/* Home */}
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]" style={{ fontVariationSettings: pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>
                  home
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Home</span>
              </Link>
            </li>

            {/* Incidents / Search */}
            <li>
              <Link
                href="/dashboard/incidents"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/incidents'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  search
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Search / Incidents</span>
              </Link>
            </li>

            {/* Notifications / Alerts */}
            <li>
              <Link
                href="/dashboard/alerts"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/alerts'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  notifications
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Alerts</span>
              </Link>
            </li>

            {/* SOS Distress */}
            <li>
              <Link
                href="/dashboard/sos"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/sos'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px] text-error">
                  emergency
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">SOS Queue</span>
              </Link>
            </li>
          </ul>

          {/* Divider */}
          <div className="h-px bg-border-subtle w-8 md:w-full mx-auto my-4"></div>

          {/* Deploy Action Button */}
          <div className="px-1 md:px-2 mb-4">
            <button
              onClick={() => router.push('/dashboard/alerts?action=compose')}
              className="w-full flex items-center justify-center bg-primary text-on-primary py-2.5 px-2 rounded font-body-bold text-xs hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] md:mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
              <span className="hidden md:block">Deploy Response</span>
            </button>
          </div>

          {/* Operations & Analytics */}
          <ul className="space-y-1 w-full">
            <li>
              <Link
                href="/dashboard/map"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/map'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  grid_view
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Operations Map</span>
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard/assets"
                className={`flex items-center px-3 md:px-4 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/assets'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  local_shipping
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Asset Tracking</span>
              </Link>
            </li>

            <li>
              <Link
                href="/responder"
                className="flex items-center px-3 md:px-4 py-2.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  support_agent
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Responder View</span>
              </Link>
            </li>

            <li>
              <Link
                href="/visitor"
                className="flex items-center px-3 md:px-4 py-2.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-0 md:mr-3 text-[20px]">
                  travel_explore
                </span>
                <span className="hidden md:block font-label-caps text-label-caps">Visitor Portal</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer User Info */}
        <div className="px-3 pt-3 border-t border-border-subtle mt-auto">
          <div className="flex items-center justify-between">
            <div className="hidden md:flex flex-col truncate pr-2">
              <span className="font-body-bold text-xs text-on-surface truncate">{user?.name || 'Commander'}</span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">{user?.role || 'manager'}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-surface-container transition-colors cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area & TopNavBar */}
      <div className="ml-[64px] md:ml-64 flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {/* TopNavBar (Shared Component) */}
        <nav className="h-topbar-height bg-surface border-b border-border-subtle flex justify-between items-center px-4 md:px-6 z-40 shrink-0 shadow-sm">
          {/* Brand & Nav Links */}
          <div className="flex items-center space-x-4 xl:space-x-6 h-full min-w-0 shrink-0">
            <span className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tighter whitespace-nowrap shrink-0">
              SafeSight HECTOR
            </span>

            <div className="hidden xl:flex space-x-3 2xl:space-x-5 h-full items-end shrink-0">
              {TOP_NAV_TABS.map((tab) => {
                const isActive =
                  tab.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(tab.href);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`font-label-caps text-label-caps mb-2 pb-1 transition-all duration-200 border-b-2 uppercase whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-primary border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface border-transparent'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="hidden 2xl:flex items-center bg-surface-container-low border border-outline-variant rounded tech-glow px-3 py-1.5 h-8 shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-on-surface focus:ring-0 p-0 text-xs w-36 xl:w-44 font-telemetry-md h-full placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Search..."
                type="text"
              />
            </form>

            {/* Icon Actions */}
            <div className="hidden sm:flex items-center space-x-1 text-on-surface-variant">
              <button
                onClick={() => router.refresh()}
                className="hover:text-primary transition-colors p-1 rounded hover:bg-surface-container cursor-pointer"
                title="Refresh telemetry"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
              <button
                onClick={() => window.open('/docs/MASTER.md', '_blank')}
                className="hover:text-primary transition-colors p-1 rounded hover:bg-surface-container cursor-pointer"
                title="Documentation & SOP"
              >
                <span className="material-symbols-outlined text-[20px]">help</span>
              </button>
            </div>

            {/* System Status Pill */}
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden md:flex items-center border border-outline-variant text-on-surface-variant px-2.5 py-1 rounded hover:text-primary hover:border-primary transition-colors text-xs font-body-bold bg-surface cursor-pointer whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-status-nominal mr-2 animate-pulse"></span>
              System Status
            </button>

            {/* Emergency Lockdown Button */}
            <button
              onClick={handleEmergencyLockdown}
              className={`px-3 py-1.5 rounded transition-all text-xs font-body-bold shadow-md cursor-pointer whitespace-nowrap ${
                lockdownActive
                  ? 'bg-status-critical text-white animate-pulse shadow-status-critical/30'
                  : 'bg-error text-on-error hover:bg-error/90 shadow-error/20'
              }`}
            >
              Emergency Lockdown
            </button>

            {/* Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden flex items-center justify-center bg-primary text-white font-bold text-xs hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
              >
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-xl border border-border-subtle py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-border-subtle">
                    <p className="font-body-bold text-xs text-on-surface">{user?.name || 'Site Commander'}</p>
                    <p className="font-telemetry-md text-[10px] text-on-surface-variant">{user?.email || 'manager@safesight.gov.in'}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Command Center
                  </Link>
                  <Link
                    href="/responder"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    Responder View
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-container/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto h-full p-margin-mobile md:p-margin-desktop">
          {children}
        </div>
      </div>
    </div>
  );
}

