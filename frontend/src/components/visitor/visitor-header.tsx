'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Radio, ShieldAlert, User, Navigation } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language';
import { useLanguage } from '@/i18n';

interface VisitorHeaderProps {
  onOpenSos: () => void;
  selectedSite: string;
  onSelectSite: (site: string) => void;
}

export const VisitorHeader: React.FC<VisitorHeaderProps> = ({
  onOpenSos,
  selectedSite,
  onSelectSite,
}) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-amber-600 shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-stone-900">
                  {t('app_title') || 'SafeSight'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  {t('live_operational')}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block font-medium">
                {t('app_subtitle') || 'AI-Powered Pilgrim Safety & Crowd Coordination'}
              </p>
            </div>
          </div>

          {/* Site Selector & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Site Picker */}
            <select
              value={selectedSite}
              onChange={(e) => onSelectSite(e.target.value)}
              className="text-xs font-medium bg-stone-50 text-stone-800 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 cursor-pointer"
            >
              <option value="demo-site-prayagraj-01">📍 Prayagraj Kumbh</option>
              <option value="demo-site-kedarnath-01">🏔️ Kedarnath Dham</option>
              <option value="demo-site-varanasi-01">🕉️ Kashi Vishwanath</option>
            </select>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Emergency SOS Quick Button */}
            <button
              onClick={onOpenSos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 animate-pulse"
              title="1-Tap Emergency Distress Call"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t('sos')}</span>
            </button>

            {/* Staff / Manager Login */}
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('staff_login')}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
