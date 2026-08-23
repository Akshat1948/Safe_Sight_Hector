'use client';

import React, { useState, useEffect } from 'react';
import { AlertSeverity, AlertChannel, IZone } from '@/shared/types';
import { createAlert, getZones, translateText } from '@/shared/api';
import {
  Megaphone,
  Languages,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  BellRing,
  Smartphone,
  Radio,
  Volume2,
} from 'lucide-react';

interface AlertComposerProps {
  siteId?: string | null;
  incidentId?: string | null;
  onAlertCreated?: () => void;
}

export default function AlertComposer({ siteId, incidentId, onAlertCreated }: AlertComposerProps) {
  const [zones, setZones] = useState<IZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [messageHi, setMessageHi] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.ADVISORY);
  const [targetZoneId, setTargetZoneId] = useState('');
  const [channels, setChannels] = useState<Record<AlertChannel, boolean>>({
    [AlertChannel.PUSH]: true,
    [AlertChannel.SMS]: false,
    [AlertChannel.DASHBOARD]: true,
    [AlertChannel.PA_SYSTEM]: false,
  });

  useEffect(() => {
    if (siteId) {
      getZones(siteId)
        .then((res) => {
          if (res.success && res.data) {
            setZones(res.data);
          }
        })
        .catch(console.error);
    }
  }, [siteId]);

  const handleAutoTranslate = async () => {
    if (!message.trim()) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(message, 'hi', 'en');
      setMessageHi(translated);
    } catch (err) {
      console.warn('Translate error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !title || !message) return;

    setLoading(true);
    setSuccess(false);

    try {
      const selectedChannels = (Object.entries(channels) as [AlertChannel, boolean][])
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      // Auto-translate if Hindi not manually provided
      let finalHi = messageHi;
      if (!finalHi && message) {
        try {
          finalHi = await translateText(message, 'hi', 'en');
        } catch {
          // Ignore fallback
        }
      }

      const res = await createAlert({
        siteId,
        title,
        message,
        severity,
        targetZoneId: targetZoneId || null,
        channels: selectedChannels,
        incidentId: incidentId || null,
      });

      if (res.success) {
        setSuccess(true);
        setTitle('');
        setMessage('');
        setMessageHi('');
        setSeverity(AlertSeverity.ADVISORY);
        setTargetZoneId('');
        setChannels({
          [AlertChannel.PUSH]: true,
          [AlertChannel.SMS]: false,
          [AlertChannel.DASHBOARD]: true,
          [AlertChannel.PA_SYSTEM]: false,
        });

        setTimeout(() => setSuccess(false), 3500);
        onAlertCreated?.();
      }
    } catch (err) {
      console.error('Failed to create alert', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channel: AlertChannel) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Emergency Alert Broadcast Center
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Multi-channel push, SMS simulation, and AI Indic translation
              </p>
            </div>
          </div>
          {incidentId && (
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/30">
              Linked to Incident #{incidentId.slice(0, 8)}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Emergency Alert successfully broadcasted across all active channels!</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Alert Headline / Subject
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            placeholder="E.g., High Surge Caution: Avoid Zone C Staircase"
          />
        </div>

        {/* English Message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Primary Message (English)
            </label>
            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={isTranslating || !message.trim()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 disabled:opacity-50"
            >
              {isTranslating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-600" />
              )}
              <span>AI Translate to Hindi</span>
            </button>
          </div>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            placeholder="Enter the broadcast message to pilgrims and staff..."
          />
        </div>

        {/* Hindi Translated Preview */}
        {messageHi && (
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
              <Languages className="w-3.5 h-3.5 text-amber-700" />
              <span>AI Translated Indic Text (Hindi / MyMemory):</span>
            </div>
            <p className="text-xs text-stone-800 font-medium">{messageHi}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            >
              <option value={AlertSeverity.INFORMATIONAL}>Informational (General Guidance)</option>
              <option value={AlertSeverity.ADVISORY}>Advisory (Moderate Caution)</option>
              <option value={AlertSeverity.WARNING}>Warning (High Congestion)</option>
              <option value={AlertSeverity.CRITICAL}>Critical (Emergency / Avoid Zone)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Target Zone
            </label>
            <select
              value={targetZoneId}
              onChange={(e) => setTargetZoneId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            >
              <option value="">All Zones (Entire Site)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Dissemination Channels
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: AlertChannel.DASHBOARD, label: 'Live Dashboard', icon: Radio },
              { id: AlertChannel.PUSH, label: 'Visitor PWA Push', icon: BellRing },
              { id: AlertChannel.SMS, label: 'SMS Cell Broadcast', icon: Smartphone },
              { id: AlertChannel.PA_SYSTEM, label: 'Ghat PA Speaker', icon: Volume2 },
            ].map((channel) => {
              const Icon = channel.icon;
              const isChecked = channels[channel.id];
              return (
                <label
                  key={channel.id}
                  onClick={() => toggleChannel(channel.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="sr-only"
                  />
                  <Icon className={`w-4 h-4 ${isChecked ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className="text-xs">{channel.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            disabled={loading || !title || !message}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Broadcast Emergency Alert</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
