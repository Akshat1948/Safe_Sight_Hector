'use client';

import React from 'react';

export default function SafetyEssentials({ className = '' }: { className?: string }) {
  const emergencyHelplines = [
    { name: '108 Ambulance / Medical', number: '108', icon: '🚑', desc: 'On-site medical aid & trauma triage' },
    { name: '112 Police Emergency', number: '112', icon: '🚓', desc: 'Police rapid response unit' },
    { name: '1077 Disaster Helpline', number: '1077', icon: '🛡️', desc: 'State disaster management force' },
    { name: 'Kumbh Mela Control Room', number: '+915322500000', icon: '🏛️', desc: 'Central pilgrimage control center' },
  ];

  return (
    <div className={`p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-xl ${className}`}>
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-cyan-400">
          Emergency Preparedness
        </span>
        <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
          📞 1-Tap Emergency Speed-Dials
        </h3>
      </div>

      {/* Speed Dial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {emergencyHelplines.map((helpline) => (
          <a
            key={helpline.number}
            href={`tel:${helpline.number}`}
            className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-850 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{helpline.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {helpline.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">{helpline.desc}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              Call →
            </span>
          </a>
        ))}
      </div>

      {/* Crowd Safety Directives */}
      <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
          <span>ℹ️</span>
          <span>Pilgrim Safety Rules:</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside font-mono">
          <li>Move in the designated one-way flow corridors.</li>
          <li>Avoid lingering or taking photos on ghat staircases (Zone B).</li>
          <li>In case of localized crowd surge, move steadily toward Safe Assembly Zone D.</li>
        </ul>
      </div>
    </div>
  );
}
