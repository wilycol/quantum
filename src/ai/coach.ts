// src/ai/coach.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Candle } from '../types/candle';

export type CoachSignal = 'BUY' | 'SELL' | 'HOLD';
export type CoachRound = {
  id: string;
  startedAt: number;            // ms
  deadlineAt: number;           // ms
  signal: CoachSignal;
  reason: string;
  resolved?: {
    action?: 'BUY'|'SELL'|'HOLD';
    reactedAt: number;          // ms
    ms: number;                 // reaction time
    correct: boolean;
  };
};
export type CoachStats = {
  rounds: number;
  correct: number;
  avgMs: number;
};
export type CoachState = {
  active?: CoachRound;
  history: CoachRound[];
  stats: CoachStats;
};

const KEY = 'qt.coach.v1';

function load(): CoachState {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as CoachState; }
  catch { return { active: undefined, history: [], stats: { rounds:0, correct:0, avgMs:0 } }; }
}
function save(s: CoachState) { localStorage.setItem(KEY, JSON.stringify(s)); }

function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i-1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = losses === 0 ? 100 : gains / (losses || 1e-9);
  return 100 - 100 / (1 + rs);
}
function ema(values: number[], period: number): number {
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function pickSignal(candles: Candle[]): { signal: CoachSignal; reason: string } {
  const closes = candles.map(c => c.c);
  const last = closes[closes.length - 1];
  const ema9 = ema(closes.slice(-60), 9);
  const ema21 = ema(closes.slice(-60), 21);
  const _rsi = rsi(closes, 14);

  if (ema9 > ema21 && _rsi < 70) return { signal: 'BUY', reason: `EMA9>EMA21 y RSI ${_rsi.toFixed(1)}<70` };
  if (ema9 < ema21 && _rsi > 30) return { signal: 'SELL', reason: `EMA9<EMA21 y RSI ${_rsi.toFixed(1)}>30` };
  return { signal: 'HOLD', reason: `Cruce neutro / RSI ${_rsi.toFixed(1)}` };
}

export function useCoach(candles: Candle[], roundMs = 15000) {
  const [state, setState] = useState<CoachState>(() => load());
  const timer = useRef<any>(null);
  const now = Date.now();

  const startRound = useCallback(() => {
    const { signal, reason } = pickSignal(candles);
    const round: CoachRound = {
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      deadlineAt: Date.now() + roundMs,
      signal, reason
    };
    const next: CoachState = { ...state, active: round };
    setState(next); save(next);
  }, [candles, roundMs, state]);

  const stopRound = useCallback((action: 'BUY'|'SELL'|'HOLD'|undefined) => {
    const act = state.active;
    if (!act) return;
    const reactedAt = Date.now();
    const ms = Math.max(0, reactedAt - act.startedAt);
    const correct = action ? (action === act.signal) : false;

    const resolved: CoachRound = { ...act, resolved: { action: action || 'HOLD', reactedAt, ms, correct } };
    const history = [resolved, ...state.history].slice(0, 50);
    const rounds = history.length;
    const correctCount = history.filter(h => h.resolved?.correct).length;
    const avgMs = Math.round(history.reduce((a,b)=>a+(b.resolved?.ms||0),0) / Math.max(1, rounds));

    const next: CoachState = { active: undefined, history, stats: { rounds, correct: correctCount, avgMs } };
    setState(next); save(next);
  }, [state]);

  const remainingMs = useMemo(() => {
    if (!state.active) return 0;
    return Math.max(0, state.active.deadlineAt - now);
  }, [state.active, now]);

  useEffect(() => {
    if (!state.active) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const left = state.active!.deadlineAt - Date.now();
      if (left <= 0) { clearInterval(timer.current); stopRound(undefined); }
    }, 200);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [state.active, stopRound]);

  return {
    state,
    startRound,
    stopRound,
    remainingMs
  };
}
