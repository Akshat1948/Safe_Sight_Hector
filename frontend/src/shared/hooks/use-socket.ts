'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/shared/constants';

export function useSocket(siteId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!siteId) return;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join:site', { siteId });
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave:site', { siteId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [siteId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { on, off, socket: socketRef.current };
}
