// src/app/qcore/components/ExecutedTimeline.tsx
// Executed timeline with sparkline for QuantumCore v2

import React, { useState, useEffect } from 'react';
import { 
  useBroker,
  useStrategy,
  useAssets
} from '../hooks/useQcoreState';
import { useEventBus } from '../../../hooks/useEventBus';
import { WsEvent } from '../lib/types';
import { formatTimestamp, formatCurrency } from '../lib/formatters';

interface ExecutedTimelineProps {
  className?: string;
}

interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'preview' | 'executed' | 'cancel';
  side?: 'BUY' | 'SELL';
  direction?: 'CALL' | 'PUT';
  symbol: string;
  price?: number;
  amount?: number;
  pnl?: number;
  result?: 'WIN' | 'LOSE' | 'PENDING';
}

export default function ExecutedTimeline({ className = '' }: ExecutedTimelineProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const assets = useAssets();

  // Local state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // WebSocket connection
  const { connected: wsConnected, onPreview, onExecuted } = useEventBus({
    autoConnect: true,
    debug: true
  });
  
  console.log('[ExecutedTimeline] useEventBus result:', { wsConnected });

  // Set up event listeners
  useEffect(() => {
    const unsubscribePreview = onPreview((event) => {
      handleWebSocketEvent(event as any);
    });
    
    const unsubscribeExecuted = onExecuted((event) => {
      handleWebSocketEvent(event as any);
    });
    
    return () => {
      unsubscribePreview();
      unsubscribeExecuted();
    };
  }, [onPreview, onExecuted]);

  // Initialize with mock data
  useEffect(() => {
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        timestamp: Date.now() - 300000,
        type: 'preview',
        side: 'BUY',
        symbol: 'BTCUSDT',
        price: 49500
      },
      {
        id: '2',
        timestamp: Date.now() - 250000,
        type: 'executed',
        side: 'BUY',
        symbol: 'BTCUSDT',
        price: 49520,
        amount: 0.1,
        pnl: 25.50
      },
      {
        id: '3',
        timestamp: Date.now() - 200000,
        type: 'preview',
        side: 'SELL',
        symbol: 'BTCUSDT',
        price: 49800
      },
      {
        id: '4',
        timestamp: Date.now() - 150000,
        type: 'executed',
        side: 'SELL',
        symbol: 'BTCUSDT',
        price: 49780,
        amount: 0.1,
        pnl: -15.20
      },
      {
        id: '5',
        timestamp: Date.now() - 100000,
        type: 'preview',
        direction: 'CALL',
        symbol: 'BTCUSD',
        price: 50000
      },
      {
        id: '6',
        timestamp: Date.now() - 50000,
        type: 'executed',
        direction: 'CALL',
        symbol: 'BTCUSD',
        amount: 50,
        result: 'WIN',
        pnl: 46.50
      }
    ];

    setTimelineEvents(mockEvents);
  }, [broker, strategy]);

  // Handle WebSocket events
  function handleWebSocketEvent(event: WsEvent) {
    let timelineEvent: TimelineEvent | null = null;

    switch (event.t) {
      case 'preview':
        timelineEvent = {
          id: `preview_${event.ts}`,
          timestamp: event.ts,
          type: 'preview',
          side: event.side,
          symbol: event.pair || '',
          price: event.price
        };
        break;

      case 'executed':
        timelineEvent = {
          id: `executed_${event.ts}`,
          timestamp: event.ts,
          type: 'executed',
          side: event.side,
          symbol: event.pair || '',
          price: event.fillPrice,
          amount: event.qty,
          pnl: event.pnl
        };
        break;

      case 'binary_preview':
        timelineEvent = {
          id: `binary_preview_${event.ts}`,
          timestamp: event.ts,
          type: 'preview',
          direction: event.dir,
          symbol: event.asset || '',
          price: event.strike
        };
        break;

      case 'binary_executed':
        timelineEvent = {
          id: `binary_executed_${event.ts}`,
          timestamp: event.ts,
          type: 'executed',
          direction: event.dir,
          symbol: event.asset || '',
          amount: event.amount,
          result: event.result,
          pnl: event.net
        };
        break;
    }

    if (timelineEvent) {
      setTimelineEvents(prev => [...prev, timelineEvent!]);
    }
  }

  // Get event icon
  const getEventIcon = (event: TimelineEvent) => {
    if (event.type === 'preview') {
      return '◇';
    } else if (event.type === 'executed') {
      return '◆';
    } else if (event.type === 'cancel') {
      return '×';
    }
    return '○';
  };

  // Get event color
  const getEventColor = (event: TimelineEvent) => {
    if (event.type === 'preview') {
      return 'text-blue-400';
    } else if (event.type === 'executed') {
      if (event.pnl && event.pnl > 0) {
        return 'text-green-400';
      } else if (event.pnl && event.pnl < 0) {
        return 'text-red-400';
      }
      return 'text-gray-400';
    } else if (event.type === 'cancel') {
      return 'text-yellow-400';
    }
    return 'text-gray-400';
  };

  // Get side/direction color
  const getSideColor = (event: TimelineEvent) => {
    if (event.side === 'BUY' || event.direction === 'CALL') {
      return 'text-green-500';
    } else if (event.side === 'SELL' || event.direction === 'PUT') {
      return 'text-red-500';
    }
    return 'text-gray-400';
  };

  // Generate sparkline data
  const generateSparklineData = () => {
    const data = timelineEvents
      .filter(event => event.type === 'executed' && event.pnl !== undefined)
      .map(event => ({
        x: event.timestamp,
        y: event.pnl || 0
      }))
      .sort((a, b) => a.x - b.x);

    return data;
  };

  const sparklineData = generateSparklineData();

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Executed Timeline</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-2">PnL Sparkline</div>
          <div className="h-16 bg-gray-900 rounded flex items-end justify-between px-2">
            {sparklineData.map((point, index) => {
              const maxPnL = Math.max(...sparklineData.map(p => Math.abs(p.y)));
              const height = maxPnL > 0 ? (Math.abs(point.y) / maxPnL) * 100 : 0;
              const color = point.y > 0 ? 'bg-green-500' : point.y < 0 ? 'bg-red-500' : 'bg-gray-500';
              
              return (
                <div
                  key={index}
                  className={`w-1 ${color} rounded-t`}
                  style={{ height: `${height}%` }}
                  title={`${formatCurrency(point.y)}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Events */}
      <div className="h-64 overflow-y-auto p-2">
        {timelineEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No executed events yet
          </div>
        ) : (
          <div className="space-y-2">
            {timelineEvents
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                    selectedEvent?.id === event.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'
                  }`}
                >
                  {/* Event Icon */}
                  <span className={`text-lg ${getEventColor(event)}`}>
                    {getEventIcon(event)}
                  </span>

                  {/* Event Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(event.timestamp)}
                      </span>
                      <span className={`text-xs font-semibold ${getSideColor(event)}`}>
                        {event.side || event.direction || 'N/A'}
                      </span>
                      <span className="text-xs text-white">
                        {event.symbol}
                      </span>
                    </div>
                    
                    {event.price && (
                      <div className="text-xs text-gray-300">
                        Price: {formatCurrency(event.price)}
                      </div>
                    )}
                    
                    {event.amount && (
                      <div className="text-xs text-gray-300">
                        Amount: {event.amount}
                      </div>
                    )}
                    
                    {event.pnl !== undefined && (
                      <div className={`text-xs font-semibold ${
                        event.pnl > 0 ? 'text-green-500' : event.pnl < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        PnL: {formatCurrency(event.pnl)}
                      </div>
                    )}
                    
                    {event.result && (
                      <div className={`text-xs font-semibold ${
                        event.result === 'WIN' ? 'text-green-500' : 
                        event.result === 'LOSE' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        Result: {event.result}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between p-2 border-t border-gray-700 bg-gray-900">
        <div className="text-xs text-gray-400">
          Total Events: {timelineEvents.length}
        </div>
        <div className="text-xs text-gray-400">
          Executed: {timelineEvents.filter(e => e.type === 'executed').length}
        </div>
        <div className="text-xs text-gray-400">
          Preview: {timelineEvents.filter(e => e.type === 'preview').length}
        </div>
      </div>
    </div>
  );
}
