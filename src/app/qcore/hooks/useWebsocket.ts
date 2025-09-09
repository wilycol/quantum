// src/app/qcore/hooks/useWebsocket.ts
// WebSocket hook for QuantumCore v2 with backoff and cleanup

import { useEffect, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;

function canConnect(url?: string) {
  if (!url) return false;
  if (typeof window !== 'undefined') {
    if (location.protocol === 'https:' && url.startsWith('ws://')) return false;
    if (url.includes('localhost') && location.hostname !== 'localhost') return false;
  }
  return true;
}

export function useWebsocket(onMsg: (evt:any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!canConnect(WS_URL)) return;

    let ws: WebSocket | null = null;
    let tries = 0, maxTries = 6, timer: any;

    const connect = () => {
      ws = new WebSocket(WS_URL!);
      ws.onopen = () => { tries = 0; };
      ws.onmessage = (m) => onMsg(JSON.parse(m.data));
      ws.onclose = () => {
        if (tries < maxTries) {
          const wait = Math.min(1000 * 2 ** tries, 10000);
          timer = setTimeout(connect, wait); tries++;
        }
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => { clearTimeout(timer); ws?.close(); };
  }, [WS_URL, onMsg]);
}