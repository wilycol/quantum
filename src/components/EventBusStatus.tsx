// src/components/EventBusStatus.tsx
// Event Bus connection status component for QuantumCore

import React, { useState, useEffect } from 'react';
import { useEventBus } from '../hooks/useEventBus';
import { StateEvent } from '../types/eventBus';

interface EventBusStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function EventBusStatus({ className = '', showDetails = false }: EventBusStatusProps) {
  const { 
    connected, 
    connecting, 
    error, 
    connect, 
    disconnect,
    onPreview,
    onExecuted,
    onState
  } = useEventBus({
    autoConnect: true,
    debug: true
  });
  
  const [lastEvent, setLastEvent] = useState<string>('');
  const [eventCount, setEventCount] = useState(0);

  // Listen to events for status display
  useEffect(() => {
    const unsubscribePreview = onPreview((event) => {
      setLastEvent(`Preview: ${event.t} - ${event.broker || 'binary'}`);
      setEventCount(prev => prev + 1);
    });
    
    const unsubscribeExecuted = onExecuted((event) => {
      setLastEvent(`Executed: ${event.t} - ${event.pair || event.ticketId}`);
      setEventCount(prev => prev + 1);
    });
    
    const unsubscribeState = onState((state) => {
      setLastEvent(`State: ${state.broker} - ${state.mode}`);
      setEventCount(prev => prev + 1);
    });
    
    return () => {
      unsubscribePreview();
      unsubscribeExecuted();
      unsubscribeState();
    };
  }, [onPreview, onExecuted, onState]);

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (connecting) return 'text-yellow-500';
    if (connected) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (connecting) return 'Connecting...';
    if (connected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (error) return '🔴';
    if (connecting) return '🟡';
    if (connected) return '🟢';
    return '⚫';
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <div className={`font-semibold ${getStatusColor()}`}>
              Event Bus: {getStatusText()}
            </div>
            {showDetails && (
              <div className="text-xs text-gray-400">
                Events: {eventCount} | Last: {lastEvent || 'None'}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!connected && !connecting && (
            <button
              onClick={connect}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          )}
          
          {connected && (
            <button
              onClick={disconnect}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
          Error: {error}
        </div>
      )}
      
      {showDetails && (
        <div className="mt-3 text-xs text-gray-400">
          <div>WebSocket URL: ws://localhost:8080/ws</div>
          <div>Auto-reconnect: Enabled</div>
          <div>Heartbeat: 30s</div>
        </div>
      )}
    </div>
  );
}

// Event Bus Test Component
export function EventBusTest() {
  const { 
    connected, 
    sendPreview, 
    sendExecuted, 
    sendState,
    createPreview,
    createBinaryPreview,
    createExecuted,
    createState
  } = useEventBus();

  const testPreview = () => {
    const event = createPreview(
      'binance',
      'BTCUSDT',
      'BUY',
      111842.8,
      0.62,
      11153,
      11315
    );
    sendPreview(event);
  };

  const testBinaryPreview = () => {
    const event = createBinaryPreview(
      'BTCUSD',
      'CALL',
      112000,
      60,
      50,
      0.93,
      0.58
    );
    sendPreview(event);
  };

  const testExecuted = () => {
    const event = createExecuted(
      'order_123',
      'BTCUSDT',
      'BUY',
      111840.2,
      0.00891,
      -2.89,
      11153,
      11315
    );
    sendExecuted(event);
  };

  const testState = () => {
    const state = createState(
      'binance',
      'shadow',
      ['BTCUSDT', 'ETHUSDT'],
      true,
      { maxOrderPct: 0.05, dailyStopPct: 0.1 },
      { size: 7, lower: 11000, upper: 11400, stepPct: 0.4 },
      { amount: 50, expiry: 60, direction: 'CALL' }
    );
    sendState(state);
  };

  if (!connected) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="text-gray-400 text-center">
          Event Bus not connected. Connect to test events.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Event Bus Test</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={testPreview}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Test Preview
        </button>
        <button
          onClick={testBinaryPreview}
          className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
        >
          Test Binary Preview
        </button>
        <button
          onClick={testExecuted}
          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
        >
          Test Executed
        </button>
        <button
          onClick={testState}
          className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
        >
          Test State
        </button>
      </div>
    </div>
  );
}
