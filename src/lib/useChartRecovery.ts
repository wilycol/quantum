import { useEffect, useRef, useState } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { useEventBus } from './eventBus';

type Args = {
  chart: IChartApi | null;
  container: HTMLDivElement | null;
  hasSeries: boolean;
  setUpSeries: () => void;         // crea la serie y setData()
  teardownSeries: () => void;      // series.remove()
  reapplyRange: () => void;        // reaplica rango guardado
  followRight: boolean;
  lastKlineTs?: number;            // ts del último tick
  wsConnected: boolean;
  marketLive: boolean;             // true si binanceConnected
};

type State = 'loading'|'ready'|'degraded'|'recovering'|'failed';

export function useChartRecovery(a: Args) {
  const [state, setState] = useState<State>('loading');
  const retries = useRef(0);
  const token   = useRef(0);       // invalida timers viejos
  const sizes   = useRef({w:0,h:0});
  const stableSince = useRef<number | null>(null);
  const emit = useEventBus.getState().emit;

  // --------- ResizeObserver: evita falsos negativos por width/height 0
  useEffect(() => {
    if (!a.container) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      sizes.current = { w: Math.floor(cr.width), h: Math.floor(cr.height) };
      if (a.chart && (cr.width>0 && cr.height>0)) {
        a.chart.applyOptions({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(a.container);
    return () => ro.disconnect();
  }, [a.container, a.chart]);

  // --------- Health check (cada 8s)
  useEffect(() => {
    const id = setInterval(() => {
      const healthy = checkHealth(a, sizes.current);
      if (healthy) {
        setState('ready');
        // reset de retries si llevamos 120s sanos
        if (!stableSince.current) stableSince.current = Date.now();
        else if (Date.now() - stableSince.current > 120_000) retries.current = 0;
        return;
      }
      stableSince.current = null;
      setState(s => {
        if (s === 'loading') return 'loading';
        // Emit telemetry when entering degraded state
        emit({ type: 'health/degraded', t: Date.now(), reason: 'chart_degraded' });
        return 'degraded';
      });
      scheduleRecovery(a, { setState, retries, token });
    }, 8000);
    return () => clearInterval(id);
  }, [a.chart, a.hasSeries, a.lastKlineTs, a.wsConnected, a.marketLive]);

  // --------- Primer "bootstrap"
  useEffect(() => {
    if (!a.chart || !a.container) return;
    if (sizes.current.w === 0 || sizes.current.h === 0) return; // esperar tamaño válido
    if (!a.hasSeries) a.setUpSeries();
    setState('ready');
  }, [a.chart, a.container, a.hasSeries]);

  return { state };
}

// ---------- helpers ----------
function checkHealth(a: Args, sizes: {w: number, h: number}) {
  // 1) chart + serie + tamaño válido
  if (!a.chart || !a.hasSeries) return false;
  if (sizes.w <= 2 || sizes.h <= 2) return false;

  // 2) feed/último tick: si market/WS no están bien, NO culpes al chart
  if (a.marketLive && a.wsConnected) {
    if (!a.lastKlineTs) return false;
    const fresh = Date.now() - a.lastKlineTs <= 20_000;
    if (!fresh) return false;
  }

  // 3) timescale coherente
  try {
    const r = a.chart.timeScale().getVisibleLogicalRange();
    if (!r || !isFinite(r.from) || !isFinite(r.to) || r.to <= r.from) return false;
  } catch {
    return false;
  }

  return true;
}

function scheduleRecovery(
  a: Args,
  ctx: { setState: (s: State) => void; retries: React.MutableRefObject<number>; token: React.MutableRefObject<number> }
) {
  const { retries, token, setState } = ctx;
  if (retries.current >= 7) { setState('failed'); return; }

  const t = ++token.current;
  const backoff = Math.min(60_000, 5000 * Math.pow(2, retries.current)); // 5s,10s,20s,40s,60s...

  console.log(`[ChartRecovery] Scheduling recovery attempt ${retries.current + 1}/7 in ${backoff/1000}s`);
  setState('recovering');
  
  // Emit telemetry for recovery start
  const emit = useEventBus.getState().emit;
  emit({ type: 'health/recovering', t: Date.now(), attempt: retries.current + 1 });
  
  window.setTimeout(() => {
    if (t !== token.current) return; // invalidado
    
    console.log(`[ChartRecovery] Executing recovery attempt ${retries.current + 1}/7`);
    
    // --- Soft fixes primero
    try {
      if (a.container && a.chart) {
        const rect = a.container.getBoundingClientRect();
        if (rect.width > 2 && rect.height > 2) {
          console.log(`[ChartRecovery] Applying resize fix: ${rect.width}x${rect.height}`);
          a.chart.applyOptions({ width: rect.width, height: rect.height });
        }
      }
      
      if (a.hasSeries === false) {
        console.log('[ChartRecovery] Setting up missing series');
        a.setUpSeries();
      } else {
        // recrear SOLO la serie si persiste problema
        console.log('[ChartRecovery] Recreating series');
        a.teardownSeries();
        a.setUpSeries();
      }
      
      if (a.followRight) {
        console.log('[ChartRecovery] Scrolling to real time');
        a.chart?.timeScale().scrollToRealTime();
      } else {
        console.log('[ChartRecovery] Reapplying saved range');
        a.reapplyRange();
      }
    } catch (error) {
      console.log('[ChartRecovery] Soft fix failed:', error);
    }

    // Re-evaluar salud tras soft fix
    const ok = checkHealth(a, {w: a.container?.getBoundingClientRect().width || 0, h: a.container?.getBoundingClientRect().height || 0});
    if (ok) { 
      console.log('[ChartRecovery] Soft fix successful, chart healthy');
      setState('ready'); 
      retries.current = 0;
      // Emit telemetry for successful recovery
      emit({ type: 'health/recovered', t: Date.now(), took_ms: backoff });
      return; 
    }

    // --- Hard re-init
    try {
      retries.current += 1;
      console.log(`[ChartRecovery] Soft fix failed, attempting hard reinit (${retries.current}/7)`);
      hardReinit(a);
      setState('loading');
    } catch (error) {
      console.log('[ChartRecovery] Hard reinit failed:', error);
      setState('failed');
      // Emit telemetry for recovery failure
      emit({ type: 'system/error', t: Date.now(), msg: 'chart_recovery_exhausted' });
    }
  }, backoff);
}

function hardReinit(a: Args) {
  try {
    console.log('[ChartRecovery] Performing hard reinit');
    a.teardownSeries();
    // chart lo destruye el caller (ChartPanel) si expones remove()
    // aquí mantenemos hook genérico; si quieres:
    // a.chart?.remove();  // solo si el owner nos delega
    a.setUpSeries();      // crea de nuevo la serie y setData
    if (a.followRight) {
      a.chart?.timeScale().scrollToRealTime();
    } else {
      a.reapplyRange();
    }
  } catch (error) {
    console.log('[ChartRecovery] Hard reinit error:', error);
    throw error;
  }
}
