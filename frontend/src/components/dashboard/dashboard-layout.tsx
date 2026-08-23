'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: '🏠' },
  { label: 'Incidents', href: '/dashboard/incidents', icon: '🚨' },
  { label: 'Alerts', href: '/dashboard/alerts', icon: '📢' },
  { label: 'SOS', href: '/dashboard/sos', icon: '🆘' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentNavItem = NAV_ITEMS.find((i) =>
    i.href === '/dashboard' ? pathname === '/dashboard' : pathname === i.href || pathname.startsWith(`${i.href}/`)
  ) || NAV_ITEMS[0];

  return (
    <div className="relative flex h-screen w-full bg-[#F3F4F1] text-slate-900 overflow-hidden">
      {/* Backdrop overlay when sidebar is open */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Retractable Sidebar (Solid 3-Box Design) */}
      <aside
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#E2E8F0] text-slate-800 flex flex-col shadow-2xl border-r border-slate-300 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Box (Navy Theme #102A43) */}
        <div className="p-6 flex items-center justify-between border-b border-[#1f3f60] bg-[#102A43] text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              <img src="/shield-icon.png?v=1" alt="SafeSight Shield" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">SafeSight</h1>
              <p className="text-[10px] uppercase font-semibold text-teal-300 tracking-wider">Manager Console</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Middle Box (Navigation Links #E2E8F0) */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto bg-[#E2E8F0]">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#159A9C] text-white font-semibold shadow-sm shadow-[#159A9C]/30'
                    : 'text-slate-700 hover:bg-slate-300/70 hover:text-slate-950 font-medium'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Box (User Info & Logout #102A43) */}
        <div className="p-4 border-t border-[#1f3f60] bg-[#102A43] text-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 text-white font-bold flex items-center justify-center border border-white/20">
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">{user?.name || 'Manager'}</span>
                <span className="text-xs text-white/75 capitalize">{user?.role || 'manager'}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full mt-2 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Header with Hamburger & Hover Trigger */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-xs">
          {/* Hamburger + Page Title Hover Trigger */}
          <div
            onMouseEnter={() => setIsOpen(true)}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer group select-none py-2 pr-4 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <button
              type="button"
              className="p-2 rounded-lg text-slate-700 group-hover:text-[#159A9C] group-hover:bg-[#159A9C]/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <span className="text-2xl leading-none">☰</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentNavItem.icon}</span>
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-[#159A9C] transition-colors">
                {currentNavItem.label}
              </h2>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-[#159A9C] transition-colors">▾</span>
          </div>

          {/* Right Role Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-[#159A9C]/15 text-[#159A9C] border border-[#159A9C]/30 rounded-full text-xs font-bold uppercase tracking-wide">
              {user?.role || 'manager'}
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
