'use client';
import { useEventBus } from '@/lib/eventBus';
import { useState } from 'react';

const fmt = (n:number) => new Date(n).toLocaleTimeString();

export default function LogsPanel() {
  const { logs, wsConnected, clear } = useEventBus();
  const [copied, setCopied] = useState(false);
  
  const copyAllLogs = async () => {
    const logText = logs.map(l => 
      `${fmt(l.t)} [${l.level.toUpperCase()}] ${l.tag}: ${l.msg}${l.data ? ` | Data: ${JSON.stringify(l.data)}` : ''}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };
  
  return (
    <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Logs</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={copyAllLogs}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Copy all logs to clipboard"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            onClick={clear}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            title="Clear all logs"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
      
      {/* Logs container with fixed height for ~10 lines */}
      <div className="h-64 overflow-y-auto text-xs space-y-1 bg-gray-800 rounded p-2 border border-gray-600">
        {logs.length === 0 ? (
          <div className="text-zinc-500 text-center py-8">No logs yet</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex items-start gap-2 py-1 hover:bg-gray-700/50 rounded px-1">
              <span className="text-zinc-500 w-16 flex-shrink-0 font-mono text-xs">{fmt(l.t)}</span>
              <span className={`flex-shrink-0 font-semibold ${
                l.level==='error' ? 'text-red-400' :
                l.level==='warn'  ? 'text-yellow-400' : 'text-zinc-200'
              }`}>
                {l.tag}
              </span>
              <span className="text-zinc-300 flex-1">{l.msg}</span>
              {l.data && (
                <span className="text-zinc-500 text-xs font-mono">
                  {JSON.stringify(l.data).length > 50 
                    ? JSON.stringify(l.data).substring(0, 50) + '...'
                    : JSON.stringify(l.data)
                  }
                </span>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer with stats */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-700 text-xs text-gray-400">
        <span>Total: {logs.length}</span>
        <div className="flex space-x-4">
          <span className="text-zinc-200">Info: {logs.filter(l => l.level === 'info').length}</span>
          <span className="text-yellow-400">Warn: {logs.filter(l => l.level === 'warn').length}</span>
          <span className="text-red-400">Error: {logs.filter(l => l.level === 'error').length}</span>
        </div>
      </div>
    </div>
  );
}
