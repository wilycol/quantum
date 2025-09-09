'use client';
import { useMarket } from '../../../../lib/marketStore';
import { useWS } from '../../providers/WSProvider';

export default function IACoach() {
  const { lastPrice, binanceConnected } = useMarket();
  const { connected } = useWS();

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-white mb-2">IA Coach</h4>
      <div className="text-sm space-y-1">
        <div>Mode: <b>SHADOW</b></div>
        <div>Connection: <span className={connected ? 'text-green-400' : 'text-red-400'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span></div>
        <div>Market: <span className={binanceConnected ? 'text-green-400' : 'text-yellow-400'}>
          {binanceConnected ? 'Live' : 'Backfill'}
        </span></div>
        <div>Last Price: <b>{lastPrice?.toFixed(2) ?? '—'}</b></div>
      </div>
    </div>
  );
}
