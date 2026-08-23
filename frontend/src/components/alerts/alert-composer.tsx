'use client';

import React, { useState, useEffect } from 'react';
import { AlertSeverity, AlertChannel, IZone } from '@/shared/types';
import { createAlert, getZones } from '@/shared/api';

interface AlertComposerProps {
  siteId?: string | null;
  incidentId?: string | null;
  onAlertCreated?: () => void;
}

export default function AlertComposer({ siteId, incidentId, onAlertCreated }: AlertComposerProps) {
  const [zones, setZones] = useState<IZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !title || !message) return;

    setLoading(true);
    setSuccess(false);

    try {
      const selectedChannels = (Object.entries(channels) as [AlertChannel, boolean][])
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

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
        setSeverity(AlertSeverity.ADVISORY);
        setTargetZoneId('');
        setChannels({
          [AlertChannel.PUSH]: true,
          [AlertChannel.SMS]: false,
          [AlertChannel.DASHBOARD]: true,
          [AlertChannel.PA_SYSTEM]: false,
        });

        setTimeout(() => setSuccess(false), 3000);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-5 py-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span>📢</span> Compose Alert
        </h2>
        {incidentId && <p className="text-indigo-100 text-sm mt-1">Linking to incident #{incidentId.slice(0, 8)}</p>}
      </div>

      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium border border-green-200">
            Alert successfully dispatched!
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="E.g., Congestion Warning at Gate 2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter the alert message..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={AlertSeverity.INFORMATIONAL}>Informational (Blue)</option>
              <option value={AlertSeverity.ADVISORY}>Advisory (Yellow)</option>
              <option value={AlertSeverity.WARNING}>Warning (Orange)</option>
              <option value={AlertSeverity.CRITICAL}>Critical (Red)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target Zone (Optional)</label>
            <select
              value={targetZoneId}
              onChange={(e) => setTargetZoneId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Zones (Site-wide)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Channels</label>
          <div className="flex flex-wrap gap-4">
            {[
              { id: AlertChannel.DASHBOARD, label: 'Dashboard' },
              { id: AlertChannel.PUSH, label: 'Push Notification' },
              { id: AlertChannel.SMS, label: 'SMS Fallback' },
              { id: AlertChannel.PA_SYSTEM, label: 'PA System' },
            ].map((channel) => (
              <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels[channel.id]}
                  onChange={() => toggleChannel(channel.id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">{channel.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading || !title || !message}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Dispatching...' : 'Dispatch Alert'}
          </button>
        </div>
      </form>
    </div>
  );
}
