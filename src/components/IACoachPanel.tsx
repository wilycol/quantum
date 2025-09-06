// src/components/IACoachPanel.tsx
import React from 'react';
import { useCoach } from '../ai/coach';
import type { Candle } from '../types/candle';

export function IACoachPanel({ candles, onAction }: { candles: Candle[]; onAction: (side: 'BUY'|'SELL')=>void }) {
  const { state, startRound, stopRound, remainingMs } = useCoach(candles, 15000);

  const active = state.active;
  const pct = active ? Math.max(0, Math.min(100, (remainingMs / (active.deadlineAt - active.startedAt)) * 100)) : 0;

  return (
    <div style={{border:'1px solid #222', borderRadius:12, padding:12}}>
      <div style={{fontWeight:700, marginBottom:6}}>IA Coach</div>

      {!active && (
        <button className="btn" onClick={startRound}>Nueva señal</button>
      )}

      {active && (
        <div>
          <div style={{marginBottom:6}}>
            <span style={{fontWeight:700}}>Señal:</span> {active.signal}
            <div style={{fontSize:12, color:'#aaa'}}>Razón: {active.reason}</div>
          </div>

          <div style={{height:8, background:'#333', borderRadius:6, overflow:'hidden', margin:'8px 0'}}>
            <div style={{height:8, width:`${pct}%`, background:'#22c55e'}}/>
          </div>
          <div style={{fontSize:12, color:'#aaa'}}>Tiempo restante: {(remainingMs/1000).toFixed(1)}s</div>

          <div style={{display:'flex', gap:8, marginTop:10}}>
            <button className="btn" onClick={() => { onAction('BUY'); stopRound('BUY'); }}>Tomé BUY</button>
            <button className="btn ghost" onClick={() => { onAction('SELL'); stopRound('SELL'); }}>Tomé SELL</button>
            <button className="btn ghost" onClick={() => stopRound('HOLD')}>Ignorar</button>
          </div>
        </div>
      )}

      <div style={{marginTop:12, fontSize:12}}>
        <div><b>Rondas:</b> {state.stats.rounds}</div>
        <div><b>Aciertos:</b> {state.stats.correct}</div>
        <div><b>T. medio reacción:</b> {state.stats.avgMs}ms</div>
      </div>
    </div>
  );
}
