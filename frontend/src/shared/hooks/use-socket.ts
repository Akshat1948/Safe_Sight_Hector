'use client';

import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/shared/constants';

let globalSocket: Socket | null = null;

function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!globalSocket) {
    globalSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useSocket(siteId?: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      if (siteId) {
        socket.emit('join:site', { siteId });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      setIsConnected(true);
      if (siteId) {
        socket.emit('join:site', { siteId });
      }
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (siteId && socket.connected) {
        socket.emit('leave:site', { siteId });
      }
    };
  }, [siteId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getGlobalSocket();
    if (socket) {
      socket.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getGlobalSocket();
    if (socket) {
      socket.off(event, handler);
    }
  }, []);

  return { on, off, socket: globalSocket, isConnected };
}
