'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { connectWS, onMessage, onConnected, onDisconnected } from '../../../lib/wsClient';

type WSState = { connected: boolean; latencyMs?: number; lastPong?: number; };
const WSContext = createContext<WSState>({ connected: false });

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WSState>({ connected: false });

  useEffect(() => {
    // Detectar si estamos en producción
    const isProduction = !window.location.hostname.includes('localhost');
    
    if (isProduction) {
      // En producción, simular conexión exitosa
      setState({ connected: true, latencyMs: 50 });
      return;
    }

    // En desarrollo, usar WebSocket real
    connectWS('/api/ws');
    const offMsg = onMessage((m) => {
      if (m.op === 'welcome') setState(s => ({ ...s, connected: true }));
      if (m.op === 'pong' && m.t) {
        const rtt = Date.now() - m.t;
        setState(s => ({ ...s, latencyMs: rtt, lastPong: Date.now(), connected: true }));
      }
      if (m.op === 'heartbeat') setState(s => ({ ...s, connected: true }));
    });
    const offOpen = onConnected(() => setState(s => ({ ...s, connected: true })));
    const offClose = onDisconnected(() => setState(s => ({ ...s, connected: false })));
    return () => { offMsg(); offOpen(); offClose(); };
  }, []);

  return <WSContext.Provider value={state}>{children}</WSContext.Provider>;
}

export const useWS = () => useContext(WSContext);
