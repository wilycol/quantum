// src/components/TradingManualView.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { AppMode } from '../state/app';
import { getKlinesLive, getKlinesMock } from '../services/market';
import { Candle } from '../types/candle';
import { usePaper } from '../hooks/usePaper';
import { placeOrderBinance, getBalances } from '../services/api';
import { IACoachPanel } from './IACoachPanel';

// Helpers UI
const fmt = (n:number) => isFinite(n) ? '$'+n.toFixed(2) : '-';

export default function TradingManualView() {
  // ---- modo app
  const [appMode, setAppMode] = useState<AppMode>('demo-hybrid');

  // ---- datos mercado
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastClose = candles.length ? candles[candles.length - 1].c : 0;

  // ---- paper
  const { state, unrealized, equity, submit, reset } = usePaper(lastClose);

  // ---- exec
  const [qty, setQty] = useState(0.001);
  const [msg, setMsg] = useState<string>();
  const [loading, setLoading] = useState(false);

  // cargar velas según modo
  const fetchCandles = useCallback(async () => {
    try {
      setMsg(undefined);
      if (appMode === 'demo-full') {
        setCandles(getKlinesMock(500));
      } else {
        const data = await getKlinesLive('BTCUSDT', '1m', 500);
        setCandles(data);
      }
    } catch (e:any) {
      setMsg(`ERROR klines: ${e?.message||e}`);
    }
  }, [appMode]);

  useEffect(() => { fetchCandles(); }, [fetchCandles]);

  // guardrails 5% equity
  const riskOk = useMemo(() => {
    const maxBase = equity > 0 ? (equity * 0.05) / Math.max(1, lastClose) : 0;
    return qty <= maxBase + 1e-9;
  }, [equity, lastClose, qty]);

  // determina si ejecución real está habilitada
  const canReal = useMemo(() => {
    const isProd = (import.meta.env?.PROD ?? false) === true; // build flag
    if (appMode === 'live-trading') {
      // En Preview → Testnet. En Production → forzamos paper por seguridad.
      return !isProd; // true solo en preview
    }
    return false;
  }, [appMode]);

  // Trade Now (desde botones o desde IA Coach)
  async function onOrder(side: 'BUY'|'SELL') {
    try {
      setLoading(true); setMsg(undefined);

      if (!canReal) {
        // Paper
        submit(side, Number(qty));
        setMsg(`PAPER ${side} ${qty}`);
        return;
      }

      // Live-Trading (Preview=Testnet)
      if (!riskOk) { setMsg('ALERTA: qty > 5% equity'); return; }
      const res = await placeOrderBinance({
        symbol: 'BTCUSDT',
        side, type: 'MARKET',
        quantity: Number(qty),
        test: false,
      });
      setMsg(`TESTNET OK: ${side} ${qty} -> ${JSON.stringify(res.data ?? {})}`);
    } catch (e: any) {
      setMsg(`ERROR: ${e?.message||e}`);
    } finally { setLoading(false); }
  }

  async function onCheckBalances() {
    try {
      setLoading(true);
      const r = await getBalances();
      setMsg(`Balances: ${JSON.stringify(r.data)}`);
    } catch (e: any) {
      setMsg(`ERROR balances: ${e?.message||e}`);
    } finally { setLoading(false); }
  }

  return (
    <div style={{display:'grid', gap:12}}>
      {/* Header: selector de modo */}
      <ModeSwitch onChange={setAppMode} />

      {/* Layout principal */}
      <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 360px'}}>
        {/* Columna izquierda */}
        <div>
          {/* Chart */}
          <div style={{height:320, border:'1px solid #222', borderRadius:12, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', position:'relative'}}>
            {candles.length ? 'Chart aquí (usa candles del estado)' : 'Cargando velas...'}
            {/* Botón Trade Now sobre el chart */}
            <div style={{position:'absolute', right:12, bottom:12, display:'flex', gap:8}}>
              <button disabled={loading} onClick={()=>onOrder('BUY')}>Trade Now (BUY)</button>
              <button disabled={loading} onClick={()=>onOrder('SELL')}>Trade Now (SELL)</button>
            </div>
          </div>

          {/* Controles de ejecución */}
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <input type="number" step="0.0001" min="0" value={qty} onChange={e=>setQty(Number(e.target.value)||0)} />
            <button disabled={loading} onClick={()=>onOrder('BUY')}>BUY</button>
            <button disabled={loading} onClick={()=>onOrder('SELL')}>SELL</button>
            {canReal && (<button disabled={loading} onClick={onCheckBalances}>Balances</button>)}
            <button disabled={loading} onClick={reset}>Reset (paper)</button>
            <span style={{color: riskOk ? '#16a34a' : '#dc2626'}}>Riesgo: {riskOk?'OK':'ALERTA'}</span>
            <span style={{opacity:.7}}>
              Exec: {canReal ? 'REAL (Testnet en Preview)' : 'PAPER'}
            </span>
          </div>

          {/* Métricas paper */}
          <div style={{marginTop:8, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8}}>
            <div>Precio: {lastClose?fmt(lastClose):'-'}</div>
            <div style={{color: unrealized>=0?'#22c55e':'#ef4444'}}>PnL: {(unrealized>=0?'+':'')+fmt(Math.abs(unrealized))}</div>
            <div>Cash: {fmt(state.cash)}</div>
            <div>Posición: {state.pos ? `${state.pos.side} ${state.pos.qty} @ ${fmt(state.pos.avg)}` : '—'}</div>
            <div>Equity: {fmt(equity)}</div>
          </div>

          {/* Mensajes */}
          {msg && <pre style={{whiteSpace:'pre-wrap', fontSize:12, background:'#111', color:'#ddd', padding:8, borderRadius:8, marginTop:8}}>
            {msg}
          </pre>}
        </div>

        {/* Columna derecha: IA Coach */}
        <div>
          <IACoachPanel
            candles={candles}
            onAction={(side) => {
              // acciones del coach disparan la misma orden
              onOrder(side);
            }}
          />
        </div>
      </div>
    </div>
  );
}