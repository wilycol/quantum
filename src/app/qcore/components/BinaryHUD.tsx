// src/app/qcore/components/BinaryHUD.tsx
// Binary options HUD with countdown and status

import { useEffect, useMemo, useState } from 'react';

export type BinaryHUDProps = {
  asset: string;            // BTCUSD, etc.
  price?: number;           // precio spot actual
  strike?: number;          // strike de la operación binaria
  amount: number;           // monto en $
  expirySec: number;        // 30 | 60 | 120 | ...
  direction: 'CALL'|'PUT';  // dirección
  startedAt?: number;       // epoch (ms o s normalizado) cuando inició el ticket
  onExpire?: () => void;    // callback cuando llega a cero
};

export default function BinaryHUD(props: BinaryHUDProps) {
  const { asset, price, strike, amount, expirySec, direction, startedAt, onExpire } = props;
  const start = useMemo(() => normalizeTs(startedAt ?? Date.now()), [startedAt]);
  const [now, setNow] = useState<number>(normalizeTs(Date.now()));

  useEffect(() => {
    const id = setInterval(() => setNow(normalizeTs(Date.now())), 500);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - start);
  const remain = Math.max(0, expirySec - elapsed);
  useEffect(() => { if (remain === 0 && onExpire) onExpire(); }, [remain, onExpire]);

  return (
    <div className="binary-hud bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <strong className="text-white">{asset}</strong>
          <span className="text-gray-300">{direction}</span>
          <span className="text-brand-gold">${amount}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Strike: {fmt(strike)}</span>
          <span className="text-gray-400">Price: {fmt(price)}</span>
          <span className="text-white font-bold">Expira en: {fmtSec(remain)}</span>
        </div>
        
        <div className="flex items-center justify-center">
          {strike && price ? (
            <OutcomePreview dir={direction} price={price} strike={strike} />
          ) : (
            <em className="text-gray-500">Defina strike</em>
          )}
        </div>
      </div>
    </div>
  );
}

function OutcomePreview({dir, price, strike}:{dir:'CALL'|'PUT'; price:number; strike:number}) {
  const inTheMoney = dir === 'CALL' ? price >= strike : price <= strike;
  return (
    <span className={`px-2 py-1 rounded text-sm font-semibold ${
      inTheMoney ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {inTheMoney ? 'ITM' : 'OTM'}
    </span>
  );
}

function normalizeTs(ts:number){ return ts > 2e10 ? Math.floor(ts/1000) : Math.floor(ts); }
function fmt(n?:number){ return typeof n === 'number' ? n.toFixed(2) : '—'; }
function fmtSec(s:number){ const m = Math.floor(s/60), r = s%60; return `${m}:${String(r).padStart(2,'0')}`; }
