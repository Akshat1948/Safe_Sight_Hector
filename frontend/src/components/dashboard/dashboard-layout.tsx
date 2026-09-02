'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useNotifications } from '@/shared/hooks';
import AlertBanner from '@/components/alerts/alert-banner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}


export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadSosCount, unreadAlertsCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/incidents?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  // Close profile dropdown on click outside or Escape
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showProfileMenu]);

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
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* SideNavBar (Responsive: Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-full w-64 bg-[#1A3636] border-r border-[#40534C] flex flex-col py-4 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
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
              className="material-symbols-outlined text-[#D6BD98] text-3xl group-hover:scale-105 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            <div>
              <span className="font-headline-md text-headline-md font-extrabold text-white tracking-tighter block leading-tight">
                SafeSight
              </span>
              <span className="text-[#D6BD98] font-sans text-[9px] font-bold tracking-widest uppercase block">
                Operational Command
              </span>
            </div>
          </Link>

          {/* Close drawer button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-[#CBD6CF] hover:text-white rounded hover:bg-[#40534C] transition-colors"
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
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
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
                <span className="font-sans text-[13px] font-medium">Home / Overview</span>
              </Link>
            </li>

            {/* Real-time Map */}
            <li>
              <Link
                href="/dashboard/map"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/map'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  map
                </span>
                <span className="font-sans text-[13px] font-medium">Real-time Map</span>
              </Link>
            </li>

            {/* Asset Tracking */}
            <li>
              <Link
                href="/dashboard/assets"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/assets'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  local_shipping
                </span>
                <span className="font-sans text-[13px] font-medium">Asset Tracking</span>
              </Link>
            </li>

            {/* Incidents */}
            <li>
              <Link
                href="/dashboard/incidents"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded transition-colors duration-200 ${
                  pathname === '/dashboard/incidents'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  crisis_alert
                </span>
                <span className="font-sans text-[13px] font-medium">Incidents Triage</span>
              </Link>
            </li>

            {/* Notifications / Alerts */}
            <li>
              <Link
                href="/dashboard/alerts"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded transition-colors duration-150 ${
                  pathname === '/dashboard/alerts'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <span className="material-symbols-outlined mr-3 text-[20px] shrink-0">
                    notifications
                  </span>
                  <span className="font-sans text-[13px] font-medium truncate">Alert</span>
                </div>
                {unreadAlertsCount > 0 && (
                  <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-red-600 rounded-full shadow-sm shadow-red-600/40 transition-all duration-200 ease-out animate-pulse">
                    {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                  </span>
                )}
              </Link>
            </li>

            {/* SOS Distress */}
            <li>
              <Link
                href="/dashboard/sos"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded transition-colors duration-150 ${
                  pathname === '/dashboard/sos'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <span className="material-symbols-outlined mr-3 text-[20px] text-[#ef4444] shrink-0">
                    emergency
                  </span>
                  <span className="font-sans text-[13px] font-medium truncate">SOS Queue</span>
                </div>
                {unreadSosCount > 0 && (
                  <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-red-600 rounded-full shadow-sm shadow-red-600/40 transition-all duration-200 ease-out animate-pulse">
                    {unreadSosCount > 99 ? '99+' : unreadSosCount}
                  </span>
                )}
              </Link>
            </li>

            {/* AI Vision / Camera */}
            <li>
              <Link
                href="/dashboard/camera"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded transition-colors duration-150 ${
                  pathname === '/dashboard/camera'
                    ? 'bg-[#40534C] text-[#D6BD98] border-l-4 border-[#D6BD98] font-bold shadow-sm'
                    : 'text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <span className="material-symbols-outlined mr-3 text-[20px] shrink-0">
                    videocam
                  </span>
                  <span className="font-sans text-[13px] font-medium truncate">AI Vision</span>
                </div>
              </Link>
            </li>
          </ul>

          {/* Divider */}
          <div className="h-px bg-[#40534C] w-full my-3"></div>

          {/* Deploy Action Button */}
          <div className="mb-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/dashboard/alerts?action=compose');
              }}
              className="w-full flex items-center justify-center bg-[#D6BD98] text-[#1A3636] py-2.5 px-3 rounded font-bold text-xs hover:bg-[#c5ab85] transition-colors shadow-sm cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-[18px] mr-2 text-[#1A3636]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
              <span className="font-bold">Deploy Response</span>
            </button>
          </div>

          {/* Secondary Links */}
          <ul className="space-y-1 w-full">
            <li>
              <Link
                href="/responder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3.5 py-2 rounded text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60 transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  support_agent
                </span>
                <span className="font-sans text-[13px]">Responder View</span>
              </Link>
            </li>

            <li>
              <Link
                href="/visitor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3.5 py-2 rounded text-[#CBD6CF] hover:text-white hover:bg-[#40534C]/60 transition-colors duration-200"
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">
                  travel_explore
                </span>
                <span className="font-sans text-[13px]">Visitor Portal</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer User Info */}
        <div className="px-4 pt-3 border-t border-[#40534C] mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="font-bold text-xs text-white truncate">
                {user?.name || 'Site Commander'}
              </span>
              <span className="font-sans text-[10px] text-[#D6BD98] uppercase">
                {user?.role || 'manager'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-[#CBD6CF] hover:text-[#D6BD98] rounded hover:bg-[#40534C] transition-colors cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area & TopNavBar */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative md:ml-64">
        {/* TopNavBar */}
        <nav className="relative h-topbar-height bg-[#1A3636] border-b border-[#40534C] flex justify-between items-center px-3 sm:px-4 md:px-6 z-40 shrink-0 shadow-sm gap-3">
          {/* Left: Hamburger (Mobile only) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 h-full shrink-0">
            {/* Hamburger Button (Mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-[#CBD6CF] hover:text-white rounded hover:bg-[#40534C] transition-colors flex items-center justify-center shrink-0"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>

          {/* Center: Brand Title (Full Viewport Centered) */}
          <div className="fixed left-1/2 -translate-x-1/2 top-0 h-topbar-height flex items-center justify-center pointer-events-none z-40">
            <span className="font-headline-md text-sm sm:text-base md:text-headline-md font-extrabold text-[#D6BD98] tracking-wider whitespace-nowrap flex items-center leading-none">
              SafeSight HECTOR
            </span>
          </div>

          {/* Right: Fluid Animated Search Bar, Status & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 h-full">
            {/* Expandable Search Component */}
            <div
              ref={searchContainerRef}
              style={{
                width: isSearchOpen ? 280 : 36,
                transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`relative h-8 flex items-center rounded-md border box-border overflow-hidden select-none shrink-0 ${
                isSearchOpen
                  ? 'bg-[#40534C] border-[#D6BD98] ring-2 ring-[#D6BD98]/30 shadow-md'
                  : 'bg-[#40534C]/60 border-[#677D6A] hover:border-[#D6BD98] hover:bg-[#40534C] cursor-pointer'
              }`}
            >
              {isSearchOpen ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center w-full h-full min-w-0 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#D6BD98] shrink-0 pl-2 pr-1 pointer-events-none">
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    tabIndex={0}
                    className="flex-1 min-w-0 bg-transparent border-none text-xs font-sans text-white placeholder:text-[#CBD6CF]/60 focus:ring-0 outline-none px-1 h-full select-text"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (searchQuery) {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      } else {
                        setIsSearchOpen(false);
                      }
                    }}
                    className="w-7 h-full flex items-center justify-center text-[#CBD6CF] hover:text-[#D6BD98] transition-colors shrink-0 cursor-pointer pr-1"
                    title={searchQuery ? 'Clear' : 'Close search (Esc)'}
                    aria-label="Close search"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full h-full flex items-center justify-center text-[#CBD6CF] hover:text-[#D6BD98] transition-colors cursor-pointer border-none bg-transparent"
                  title="Search (⌘K)"
                  aria-label="Open search"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    search
                  </span>
                </button>
              )}
            </div>

            {/* Quick SOS Alert Icon (Topbar) */}
            {unreadSosCount > 0 && (
              <button
                onClick={() => router.push('/dashboard/sos')}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600 hover:text-white transition-all text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap shrink-0 animate-pulse"
                title={`${unreadSosCount} Unseen SOS Distress Requests`}
              >
                <span className="material-symbols-outlined text-[16px] text-red-500">emergency</span>
                <span>{unreadSosCount} SOS</span>
              </button>
            )}

            {/* Quick Alerts Bell Icon (Topbar) */}
            {unreadAlertsCount > 0 && (
              <button
                onClick={() => router.push('/dashboard/alerts')}
                className="relative flex items-center justify-center w-8 h-8 rounded border border-yellow-500/50 bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500 hover:text-slate-950 transition-all cursor-pointer shrink-0"
                title={`${unreadAlertsCount} Unseen Alerts`}
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              </button>
            )}

            {/* System Status Pill */}
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden sm:flex items-center h-8 border border-[#677D6A] text-[#CBD6CF] px-2.5 rounded hover:text-white hover:border-[#D6BD98] transition-colors text-[11px] font-bold bg-[#40534C] cursor-pointer whitespace-nowrap shrink-0"
              title="Operational System Status"
            >
              <span className="w-2 h-2 rounded-full bg-[#677D6A] mr-1.5 animate-pulse"></span>
              <span>Status</span>
            </button>

            {/* Emergency Lockdown Button */}
            <button
              onClick={handleEmergencyLockdown}
              className={`h-8 flex items-center gap-1 px-2.5 sm:px-3 rounded transition-all text-xs font-bold shadow-md cursor-pointer whitespace-nowrap shrink-0 ${
                lockdownActive
                  ? 'bg-status-critical text-white animate-pulse shadow-status-critical/30'
                  : 'bg-error text-on-error hover:bg-error/90 shadow-error/20'
              }`}
              title="Trigger Site Emergency Lockdown Protocol"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Lockdown</span>
            </button>

            {/* Profile Avatar with Dropdown */}
            <div ref={profileMenuRef} className="relative flex items-center h-8 shrink-0">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="w-8 h-8 rounded-full border border-[#D6BD98] overflow-hidden flex items-center justify-center bg-[#D6BD98] text-[#1A3636] font-extrabold text-xs hover:ring-2 hover:ring-[#D6BD98]/50 transition-all cursor-pointer"
              >
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 top-8 w-48 bg-[#1A3636] rounded-lg shadow-xl border border-[#40534C] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-[#40534C]">
                    <p className="font-bold text-xs text-white">
                      {user?.name || 'Site Commander'}
                    </p>
                    <p className="font-sans text-[10px] text-[#D6BD98] truncate">
                      {user?.email || 'manager@safesight.gov.in'}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#CBD6CF] hover:text-white hover:bg-[#40534C]"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Command Center
                  </Link>
                  <Link
                    href="/responder"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#CBD6CF] hover:text-white hover:bg-[#40534C]"
                  >
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    Responder View
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
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
          {/* Global Alert Banner — renders CRITICAL emergency alerts across all dashboard views */}
          <div className="max-w-7xl mx-auto mb-4">
            <AlertBanner siteId={user?.siteId || 'demo-site-prayagraj-01'} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
