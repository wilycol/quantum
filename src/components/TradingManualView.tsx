// src/components/TradingManualView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { CLIENT_TRADING_MODE, CLIENT_FEED_MODE, MODE_BADGE, FEED_BADGE } from '../lib/mode';
import { getKlines } from '../services/market';
import { Candle } from '../types/candle';
import { usePaper } from '../hooks/usePaper';
import { placeOrderBinance, getBalances } from '../services/api';
import { IACoachPanel } from './IACoachPanel';

type Side = 'BUY'|'SELL';

export default function TradingManualView() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastClose = candles.length ? candles[candles.length - 1].c : 0;

  const { state, unrealized, equity, submit, reset } = usePaper(lastClose);
  const [qty, setQty] = useState(0.001);
  const [msg, setMsg] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await getKlines('BTCUSDT', '1m', 500);
      setCandles(data);
    })().catch(e => setMsg(`ERROR klines: ${e?.message||e}`));
  }, []);

  const riskOk = useMemo(() => {
    const maxBase = equity > 0 ? (equity * 0.05) / Math.max(1, lastClose) : 0;
    return qty <= maxBase + 1e-9;
  }, [equity, lastClose, qty]);

  async function onOrder(side: Side) {
    try {
      setLoading(true); setMsg(undefined);

      if (CLIENT_TRADING_MODE === 'paper') {
        submit(side, Number(qty));
        setMsg(`PAPER ${side} ${qty}`);
        return;
      }

      if (!riskOk) { setMsg('ALERTA: qty > 5% equity'); return; }

      const res = await placeOrderBinance({
        symbol: 'BTCUSDT',
        side, type: 'MARKET',
        quantity: Number(qty),
        test: false, // pon true la primera vez si quieres validar sin ejecutar
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
    <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 360px'}}>
      {/* Columna izquierda: Chart + Controles */}
      <div>
        {/* Badges */}
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
          <span className="badge">MODE: {MODE_BADGE}</span>
          <span className="badge">FEED: {FEED_BADGE}</span>
        </div>

        {/* TODO: tu Chart existente usa candles */}
        <div style={{height:320, border:'1px solid #222', borderRadius:12, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa'}}>
          {candles.length ? 'Chart aquí (usa candles del estado)' : 'Cargando velas...'}
        </div>

        {/* Controles de ejecución */}
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <input type="number" step="0.0001" min="0" value={qty} onChange={e=>setQty(Number(e.target.value)||0)} />
          <button disabled={loading} onClick={()=>onOrder('BUY')}>BUY</button>
          <button disabled={loading} onClick={()=>onOrder('SELL')}>SELL</button>
          {CLIENT_TRADING_MODE!=='paper' && (<button disabled={loading} onClick={onCheckBalances}>Balances</button>)}
          <button disabled={loading} onClick={reset}>Reset (paper)</button>
          <span style={{color: riskOk ? '#16a34a' : '#dc2626'}}>Riesgo: {riskOk?'OK':'ALERTA'}</span>
        </div>

        {/* Métricas paper */}
        <div style={{marginTop:8, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8}}>
          <div>Precio: ${lastClose ? lastClose.toLocaleString() : '-'}</div>
          <div style={{color: unrealized>=0?'#22c55e':'#ef4444'}}>PnL: {(unrealized>=0?'+':'')+'$'+unrealized.toFixed(2)}</div>
          <div>Cash: ${state.cash.toFixed(2)}</div>
          <div>Posición: {state.pos ? `${state.pos.side} ${state.pos.qty} @ $${state.pos.avg.toFixed(2)}` : '—'}</div>
          <div>Equity: ${isFinite(equity)?equity.toFixed(2):'-'}</div>
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
            // opcional: aquí también podrías disparar la orden real
            // onOrder(side)
          }}
        />
      </div>
    </div>
  );
}