'use client';
import { useEventBus } from '@/lib/eventBus';

const fmt = (n:number) => new Date(n).toLocaleTimeString();

export default function LogsPanel() {
  const { logs, wsConnected } = useEventBus();
  
  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Logs</h3>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto text-xs space-y-1">
        {logs.length === 0 ? (
          <div className="text-zinc-500 text-center py-8">No logs yet</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="text-zinc-500 w-16 flex-shrink-0">{fmt(l.t)}</span>
              <span className={`flex-shrink-0 ${
                l.level==='error' ? 'text-red-400' :
                l.level==='warn'  ? 'text-yellow-400' : 'text-zinc-200'
              }`}>
                {l.tag}
              </span>
              <span className="text-zinc-300">{l.msg}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-xs text-gray-400">
        <span>Total: {logs.length}</span>
        <div className="flex space-x-4">
          <span>Info: {logs.filter(l => l.level === 'info').length}</span>
          <span>Warn: {logs.filter(l => l.level === 'warn').length}</span>
          <span>Error: {logs.filter(l => l.level === 'error').length}</span>
        </div>
      </div>
    </div>
  );
}
