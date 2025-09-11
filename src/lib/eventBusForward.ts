// src/lib/eventBusForward.ts
// Event forwarding from EventBus to telemetry system

import { useEventBus } from '../../lib/eventBus';
import { emitTelemetry } from './telemetry';

let wired = false;
let lastKlineSent = 0;

export function wireEventForwarder() {
  if (wired) return; 
  wired = true;
  
  const sub = useEventBus.subscribe(
    (s) => s,                      // selector: estado completo
    (state, prev) => {
      const ev = state.logs.at(-1); // último log representa último evento emitido
      // Enviar eventos "sustantivos":
      // ws/*, signal/preview, risk/decision, order/*, health/*
      // market/kline: 1 cada 30s
      const last = (useEventBus.getState() as any)._lastEvent as any;
      if (!last) return;

      // Throttle market/kline events to 1 every 30 seconds to balance data richness with storage
      if (last.type.startsWith('market/kline')) {
        const now = Date.now();
        if (now - lastKlineSent < 30_000) return;
        lastKlineSent = now;
      }
      emitTelemetry(last);
    }
  );

  // expón una API para que el Bus registre el último evento
  const origEmit = useEventBus.getState().emit;
  useEventBus.setState({
    emit: (e:any) => { 
      (useEventBus.getState() as any)._lastEvent = e; 
      origEmit(e); 
    }
  });

  return () => sub(); // opcional: para limpiar
}
