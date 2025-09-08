import React from 'react';
import { calculateRR, getRRStatus } from '../utils/riskRules';
import { toNum } from '../lib/num';

interface RRBadgeProps {
  side: 'long' | 'short';
  entry: number;
  tp: number;
  sl: number;
  className?: string;
}

export default function RRBadge({ side, entry, tp, sl, className = '' }: RRBadgeProps) {
  const entryNum = toNum(entry);
  const tpNum = toNum(tp);
  const slNum = toNum(sl);
  
  // Solo mostrar si tenemos valores válidos
  if (!(entryNum > 0 && tpNum > 0 && slNum > 0)) {
    return null;
  }
  
  const rr = calculateRR({ side, entry: entryNum, tp: tpNum, sl: slNum });
  const rrStatus = getRRStatus(rr);
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${rrStatus.color} ${className}`}>
      {rrStatus.label}
    </span>
  );
}
