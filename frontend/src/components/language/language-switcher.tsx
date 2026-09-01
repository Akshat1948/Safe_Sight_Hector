'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n';
import { SupportedLanguage } from '@/i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base">🌐</span>
        <span className="font-semibold text-slate-200 text-xs sm:text-sm">{currentLang.nativeName}</span>
        {variant === 'full' && (
          <span className="text-slate-400 text-[11px] sm:text-xs hidden md:inline">({currentLang.name})</span>
        )}
        <svg
          className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-44 sm:w-48 rounded-xl bg-slate-900 shadow-2xl border border-slate-700 py-1.5 ring-1 ring-black/50 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
            Select Language (भाषा)
          </div>
          <div className="max-h-60 overflow-y-auto">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code as SupportedLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs md:text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 font-bold text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-semibold">{item.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{item.name}</span>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
