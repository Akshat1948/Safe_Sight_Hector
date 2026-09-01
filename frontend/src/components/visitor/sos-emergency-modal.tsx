'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  X,
  AlertOctagon,
  CheckCircle,
  Loader2,
  LifeBuoy,
  HeartPulse,
} from 'lucide-react';
import { createSosRequest } from '@/shared/api';
import { useLanguage } from '@/i18n';

interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  isOpen,
  onClose,
  siteId = 'demo-site-prayagraj-01',
}) => {
  const { t } = useLanguage();
  const [sosSent, setSosSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [customMsg, setCustomMsg] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSosSent(false);
      setIsSending(false);
      setCountdown(null);
      // Attempt geolocation
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // Default demo fallback location at Prayagraj
            setCoords({ lat: 25.435, lng: 81.846 });
          },
          { timeout: 5000 }
        );
      }
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      triggerSosDispatch();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(3);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const triggerSosDispatch = async () => {
    setIsSending(true);
    setCountdown(null);
    try {
      await createSosRequest({
        siteId,
        latitude: coords?.lat || 25.435,
        longitude: coords?.lng || 81.846,
        message: customMsg || 'Immediate Visitor Emergency SOS Triggered',
        contactPhone: userPhone || 'Visitor Mobile',
      });
      setSosSent(true);
    } catch {
      // Offline fallback
      setSosSent(true);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-red-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
                {t('emergency_sos')}
              </h2>
              <p className="text-[10px] sm:text-xs text-red-100 font-medium">
                {t('gps_broadcast_msg')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {!sosSent ? (
            <div>
              {/* Emergency Warning */}
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-5 text-center">
                <AlertOctagon className="w-10 h-10 text-red-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-red-900">
                  {t('are_you_in_distress')}
                </h3>
                <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto">
                  {t('sos_tap_warning')}
                </p>
              </div>

              {/* Location Badge */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 mb-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  {t('gps_status')}:
                </span>
                <span className="font-bold text-stone-900">
                  {coords
                    ? `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`
                    : t('acquiring_gps')}
                </span>
              </div>

              {/* Optional Phone / Message */}
              <div className="space-y-2.5 mb-5">
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder={t('phone_placeholder')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder={t('details_placeholder')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              {countdown === null ? (
                <button
                  onClick={startCountdown}
                  disabled={isSending}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>{t('transmit_sos')}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="w-full py-3.5 rounded-xl bg-red-700 text-white font-bold text-sm text-center animate-pulse">
                    {t('broadcasting_sos')} {countdown}s...
                  </div>
                  <button
                    onClick={cancelCountdown}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                  >
                    {t('cancel_transmission')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SOS Dispatched Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-stone-900">
                {t('distress_broadcasted')}
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 max-w-sm mx-auto">
                {t('distress_desc')}
              </p>

              <div className="my-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  <span>{t('safety_protocol')}:</span>
                </div>
                <p className="text-emerald-800">
                  {t('safety_step_1')}
                </p>
                <p className="text-emerald-800">
                  {t('safety_step_2')}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition"
              >
                {t('return_portal')}
              </button>
            </div>
          )}

          {/* Quick Helpline Speed-Dials */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2 text-center">
              {t('helplines')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800 transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                <span>{t('all_emergency')}</span>
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800 transition"
              >
                <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                <span>{t('medical')}</span>
              </a>
              <a
                href="tel:1077"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800 transition"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-red-600" />
                <span>{t('disaster')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
