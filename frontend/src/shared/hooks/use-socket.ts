'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/shared/constants';

export function useSocket(siteId?: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (siteId) {
        socket.emit('join:site', { siteId });
      }

      // Re-attach all registered listeners
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socket.on(event, handler);
        });
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      if (siteId) {
        socket.emit('leave:site', { siteId });
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [siteId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    listenersRef.current.get(event)?.delete(handler);
    socketRef.current?.off(event, handler);
  }, []);

  return { on, off, socket: socketRef.current, isConnected };
}
