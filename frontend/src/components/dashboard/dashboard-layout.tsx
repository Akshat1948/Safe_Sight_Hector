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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/incidents?q=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false);
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
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* SideNavBar (Responsive: Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-full w-64 bg-surface border-r border-border-subtle flex flex-col py-4 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="flex items-center justify-between px-5 mb-5 mt-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 group"
          >
            <span
              className="material-symbols-outlined text-primary text-3xl group-hover:scale-105 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            <div>
              <span className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tighter block leading-tight">
                SafeSight
              </span>
              <span className="text-on-surface-variant font-label-caps text-[9px] tracking-widest uppercase block">
                Operational Command
              </span>
            </div>
          </Link>

          {/* Close drawer button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Primary Nav Cluster */}
        <div className="flex-1 overflow-y-auto w-full px-3 space-y-1">
          <ul className="space-y-1 w-full">
            {/* Home / KPI Overview */}
            <li>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard' || pathname === '/'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span
                  className="material-symbols-outlined mr-3 text-[20px]"
                  style={{
                    fontVariationSettings:
                      pathname === '/dashboard' || pathname === '/' ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  home
                </span>
                <span className="font-label-caps text-label-caps">Home / Overview</span>
              </Link>
            </li>

            {/* Real-time Map */}
            <li>
              <Link
                href="/dashboard/map"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/map'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  map
                </span>
                <span className="font-label-caps text-label-caps">Real-time Map</span>
              </Link>
            </li>

            {/* Asset Tracking */}
            <li>
              <Link
                href="/dashboard/assets"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/assets'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  local_shipping
                </span>
                <span className="font-label-caps text-label-caps">Asset Tracking</span>
              </Link>
            </li>

            {/* Incidents */}
            <li>
              <Link
                href="/dashboard/incidents"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/incidents'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  crisis_alert
                </span>
                <span className="font-label-caps text-label-caps">Incidents Triage</span>
              </Link>
            </li>

            {/* Notifications / Alerts */}
            <li>
              <Link
                href="/dashboard/alerts"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/alerts'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  notifications
                </span>
                <span className="font-label-caps text-label-caps">Alert History</span>
              </Link>
            </li>

            {/* SOS Distress */}
            <li>
              <Link
                href="/dashboard/sos"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/sos'
                    ? 'bg-surface-container-low text-primary border-l-4 border-primary font-body-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px] text-error">
                  emergency
                </span>
                <span className="font-label-caps text-label-caps">SOS Queue</span>
              </Link>
            </li>
          </ul>

          {/* Divider */}
          <div className="h-px bg-border-subtle w-full my-3"></div>

          {/* Deploy Action Button */}
          <div className="mb-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/dashboard/alerts?action=compose');
              }}
              className="w-full flex items-center justify-center bg-primary text-on-primary py-2.5 px-3 rounded font-body-bold text-xs hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-[18px] mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
              <span>Deploy Response</span>
            </button>
          </div>

          {/* Secondary Links */}
          <ul className="space-y-1 w-full">
            <li>
              <Link
                href="/responder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3.5 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  support_agent
                </span>
                <span className="font-label-caps text-label-caps">Responder View</span>
              </Link>
            </li>

            <li>
              <Link
                href="/visitor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3.5 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  travel_explore
                </span>
                <span className="font-label-caps text-label-caps">Visitor Portal</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer User Info */}
        <div className="px-4 pt-3 border-t border-border-subtle mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="font-body-bold text-xs text-on-surface truncate">
                {user?.name || 'Site Commander'}
              </span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                {user?.role || 'manager'}
              </span>
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

      {/* Main Content Area & TopNavBar (Full width on mobile, offset on desktop) */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative md:ml-64">
        {/* TopNavBar */}
        <nav className="h-topbar-height bg-surface border-b border-border-subtle flex justify-between items-center px-3 sm:px-4 md:px-6 z-40 shrink-0 shadow-sm">
          {/* Left: Mobile Hamburger + Brand + Desktop Nav Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-5 h-full min-w-0">
            {/* Hamburger Button (Mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition-colors"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Brand Title */}
            <span className="font-headline-md text-sm sm:text-base md:text-headline-md font-extrabold text-on-surface tracking-tighter whitespace-nowrap">
              SafeSight HECTOR
            </span>

            {/* Top Navigation Tabs (Horizontal scroll on tablets/laptops) */}
            <div className="hidden lg:flex space-x-2 xl:space-x-4 h-full items-end overflow-x-auto scrollbar-hide shrink-0 pb-1">
              {TOP_NAV_TABS.map((tab) => {
                const isActive =
                  tab.href === '/dashboard'
                    ? pathname === '/dashboard' || pathname === '/'
                    : pathname.startsWith(tab.href);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`font-label-caps text-label-caps pb-1 transition-all duration-200 border-b-2 uppercase whitespace-nowrap ${
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

          {/* Right: Actions, Status & Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 md:space-x-3 shrink-0">
            {/* Search Toggle / Input */}
            <div className="relative">
              <form
                onSubmit={handleSearchSubmit}
                className="hidden xl:flex items-center bg-surface-container-low border border-outline-variant rounded tech-glow px-2.5 py-1 h-7.5"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[16px] mr-1.5">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-on-surface focus:ring-0 p-0 text-xs w-32 xl:w-40 font-telemetry-md h-full placeholder:text-on-surface-variant/50 outline-none"
                  placeholder="Search..."
                  type="text"
                />
              </form>

              {/* Mobile search icon */}
              <button
                onClick={() => setShowMobileSearch((prev) => !prev)}
                className="xl:hidden p-1.5 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>

              {showMobileSearch && (
                <div className="absolute right-0 top-10 w-72 bg-surface p-2 rounded-lg shadow-xl border border-border-subtle z-50 xl:hidden animate-in fade-in zoom-in-95">
                  <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search incidents, sectors..."
                      className="flex-1 bg-surface-container-low border border-border-subtle rounded px-2 py-1 text-xs outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-primary text-white text-xs rounded font-bold"
                    >
                      Go
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* System Status Pill */}
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden sm:flex items-center border border-outline-variant text-on-surface-variant px-2.5 py-1 rounded hover:text-primary hover:border-primary transition-colors text-[11px] font-body-bold bg-surface cursor-pointer whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-status-nominal mr-1.5 animate-pulse"></span>
              <span className="hidden md:inline">System </span>Status
            </button>

            {/* Emergency Lockdown Button */}
            <button
              onClick={handleEmergencyLockdown}
              className={`px-2 sm:px-3 py-1.5 rounded transition-all text-xs font-body-bold shadow-md cursor-pointer whitespace-nowrap ${
                lockdownActive
                  ? 'bg-status-critical text-white animate-pulse shadow-status-critical/30'
                  : 'bg-error text-on-error hover:bg-error/90 shadow-error/20'
              }`}
            >
              <span className="hidden sm:inline">Emergency </span>Lockdown
            </button>

            {/* Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full border border-outline-variant overflow-hidden flex items-center justify-center bg-primary text-white font-bold text-xs hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
              >
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-xl border border-border-subtle py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-border-subtle">
                    <p className="font-body-bold text-xs text-on-surface">
                      {user?.name || 'Site Commander'}
                    </p>
                    <p className="font-telemetry-md text-[10px] text-on-surface-variant truncate">
                      {user?.email || 'manager@safesight.gov.in'}
                    </p>
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

        {/* Content View with fluid padding */}
        <div className="flex-1 overflow-y-auto h-full p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
