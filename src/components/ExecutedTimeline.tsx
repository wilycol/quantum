'use client';
import { useEventBus } from '@/lib/eventBus';

const fmt = (n:number) => new Date(n).toLocaleTimeString();

export default function ExecutedTimeline() {
  const { trades, wsConnected } = useEventBus();
  const rows = [...trades].sort((a,b) => a.t - b.t);
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Executed Timeline</h3>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
            {wsConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      {/* PnL Sparkline */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">PnL Sparkline</h4>
        <div className="flex items-end space-x-1 h-8">
          {rows.filter(r => r.pnl !== undefined).slice(-10).map((r, i) => (
            <div
              key={i}
              className={`w-2 rounded-sm ${
                (r.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ height: `${Math.min(Math.abs(r.pnl || 0) * 10, 100)}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="text-xs space-y-2">
        {rows.length === 0 ? (
          <div className="text-zinc-500 text-center py-4">No trades yet</div>
        ) : (
          rows.map(r => (
            <div key={r.id} className="flex items-center gap-3 py-1">
              <span className="text-zinc-500 w-16 flex-shrink-0">{fmt(r.t)}</span>
              <span className={`flex-shrink-0 ${
                r.status === 'filled' ? 'text-green-400' :
                r.status === 'accepted' ? 'text-blue-400' :
                r.status === 'preview' ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {r.status.toUpperCase()}
              </span>
              <span className="text-zinc-300">{r.side} {r.symbol}</span>
              {r.price !== undefined && (
                <span className="text-zinc-400">@ {r.price.toFixed(2)}</span>
              )}
              {r.qty !== undefined && (
                <span className="text-zinc-400">Qty: {r.qty}</span>
              )}
              {r.pnl !== undefined && (
                <span className={r.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  PnL: ${r.pnl.toFixed(2)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
