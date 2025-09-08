// src/app/qcore/components/LogsPanel.tsx
// Logs panel for QuantumCore v2

import React, { useState, useEffect, useRef } from 'react';
import { 
  useBroker,
  useStrategy,
  useMode
} from '../hooks/useQcoreState';
import { useWebsocket } from '../hooks/useWebsocket';
import { WsEvent, LogEntry } from '../lib/types';
import { formatTimestamp, formatLogLevel } from '../lib/formatters';

interface LogsPanelProps {
  className?: string;
}

export default function LogsPanel({ className = '' }: LogsPanelProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const mode = useMode();

  // Local state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const { connected: wsConnected } = useWebsocket({
    onEvent: handleWebSocketEvent,
    onLog: handleLog
  });

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Initialize with mock logs
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: Date.now() - 30000,
        level: 'INFO',
        message: 'WebSocket connected to broker',
        data: { broker }
      },
      {
        id: '2',
        timestamp: Date.now() - 25000,
        level: 'INFO',
        message: 'Strategy initialized',
        data: { strategy, mode }
      },
      {
        id: '3',
        timestamp: Date.now() - 20000,
        level: 'WARN',
        message: 'Rate limit approaching',
        data: { remaining: 45 }
      },
      {
        id: '4',
        timestamp: Date.now() - 15000,
        level: 'INFO',
        message: 'Preview signal received',
        data: { type: 'preview', pair: 'BTCUSDT', side: 'BUY' }
      },
      {
        id: '5',
        timestamp: Date.now() - 10000,
        level: 'INFO',
        message: 'Order executed successfully',
        data: { orderId: '12345', pair: 'BTCUSDT', side: 'BUY', price: 50000 }
      },
      {
        id: '6',
        timestamp: Date.now() - 5000,
        level: 'ERROR',
        message: 'Connection timeout',
        data: { error: 'ECONNRESET' }
      }
    ];

    setLogs(mockLogs);
  }, [broker, strategy, mode]);

  // Handle WebSocket events
  function handleWebSocketEvent(event: WsEvent) {
    let level: 'INFO' | 'WARN' | 'ERROR' = 'INFO';
    let message = '';

    switch (event.t) {
      case 'preview':
        message = `PREVIEW ${event.side} signal for ${event.pair} at ${event.price}`;
        break;
      case 'executed':
        message = `EXECUTED ${event.side} order ${event.orderId} for ${event.pair} at ${event.fillPrice}`;
        break;
      case 'binary_preview':
        message = `BINARY PREVIEW ${event.dir} for ${event.asset} with strike ${event.strike}`;
        break;
      case 'binary_executed':
        message = `BINARY EXECUTED ${event.dir} ticket ${event.ticketId} - Result: ${event.result}`;
        level = event.result === 'WIN' ? 'INFO' : 'WARN';
        break;
      default:
        message = `Unknown event: ${event.t}`;
    }

    const logEntry: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      level,
      message,
      data: event
    };

    setLogs(prev => [...prev, logEntry]);
  }

  // Handle direct log entries
  function handleLog(log: LogEntry) {
    setLogs(prev => [...prev, log]);
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Filter logs by level
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const filteredLogs = logs.filter(log => 
    filterLevel === 'ALL' || log.level === filterLevel
  );

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Logs</h3>
        
        <div className="flex items-center space-x-2">
          {/* Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="ALL">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
          </select>

          {/* Auto-scroll toggle */}
          <label className="flex items-center space-x-1 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="form-checkbox h-3 w-3 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
            />
            <span>Auto-scroll</span>
          </label>

          {/* Clear button */}
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="h-64 overflow-y-auto p-2 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log) => {
            const levelFormatted = formatLogLevel(log.level);
            
            return (
              <div
                key={log.id}
                className="flex items-start space-x-2 p-2 hover:bg-gray-700/50 rounded transition-colors"
              >
                {/* Timestamp */}
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>

                {/* Level */}
                <span className={`text-xs font-semibold flex-shrink-0 ${levelFormatted.color}`}>
                  {levelFormatted.text}
                </span>

                {/* Message */}
                <span className="text-xs text-gray-300 flex-grow">
                  {log.message}
                </span>

                {/* Data indicator */}
                {log.data && (
                  <button
                    onClick={() => console.log('Log data:', log.data)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0"
                    title="View data"
                  >
                    📊
                  </button>
                )}
              </div>
            );
          })
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Total: {logs.length}</span>
          <span>Info: {logs.filter(l => l.level === 'INFO').length}</span>
          <span>Warn: {logs.filter(l => l.level === 'WARN').length}</span>
          <span>Error: {logs.filter(l => l.level === 'ERROR').length}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
