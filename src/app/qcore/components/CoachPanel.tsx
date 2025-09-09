// src/app/qcore/components/CoachPanel.tsx
// IA Coach panel for QuantumCore v2

import React, { useState, useEffect } from 'react';
import { 
  useBroker,
  useStrategy,
  useMode,
  useAssets
} from '../hooks/useQcoreState';
import { useEventBus } from '../../../hooks/useEventBus';
import { WsEvent, CoachMessage } from '../lib/types';
import { formatConfidence, formatRelativeTime } from '../lib/formatters';

interface CoachPanelProps {
  className?: string;
}

export default function CoachPanel({ className = '' }: CoachPanelProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const mode = useMode();
  const assets = useAssets();

  // Local state
  const [currentMessage, setCurrentMessage] = useState<CoachMessage | null>(null);
  const [nextHintIn, setNextHintIn] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0.62);
  const [reactionTime, setReactionTime] = useState<number>(0);

  // WebSocket connection
  const { connected: wsConnected, onPreview, onExecuted, onState } = useEventBus({
    autoConnect: true,
    debug: false
  });

  // Set up event listeners
  useEffect(() => {
    const unsubscribePreview = onPreview((event) => {
      handleWebSocketEvent(event as any);
    });
    
    const unsubscribeExecuted = onExecuted((event) => {
      handleWebSocketEvent(event as any);
    });
    
    const unsubscribeState = onState((state) => {
      // Handle state changes for coach recommendations
      console.log('State changed:', state);
    });
    
    return () => {
      unsubscribePreview();
      unsubscribeExecuted();
      unsubscribeState();
    };
  }, [onPreview, onExecuted, onState]);

  // Mock coach messages based on strategy
  const mockMessages: CoachMessage[] = [
    {
      id: '1',
      timestamp: Date.now() - 30000,
      message: 'Prepárate para una señal CALL en 10 segundos...',
      confidence: 0.75,
      reactionTime: 1200,
      nextHintIn: 10
    },
    {
      id: '2',
      timestamp: Date.now() - 60000,
      message: 'RSI en zona de sobreventa, considerando entrada LONG',
      confidence: 0.68,
      reactionTime: 800,
      nextHintIn: 45
    },
    {
      id: '3',
      timestamp: Date.now() - 90000,
      message: 'Grid nivel 3 alcanzado, esperando rebote',
      confidence: 0.82,
      reactionTime: 600,
      nextHintIn: 30
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    if (mockMessages.length > 0) {
      setCurrentMessage(mockMessages[0]);
      setNextHintIn(mockMessages[0].nextHintIn || 0);
      setConfidence(mockMessages[0].confidence);
      setReactionTime(mockMessages[0].reactionTime || 0);
    }
  }, []);

  // Countdown effect
  useEffect(() => {
    if (nextHintIn > 0) {
      const interval = setInterval(() => {
        setNextHintIn(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [nextHintIn]);

  // Handle WebSocket events
  function handleWebSocketEvent(event: WsEvent) {
    // Generate coach message based on event
    let message = '';
    let newConfidence = confidence;
    let newReactionTime = reactionTime;

    if (event.t === 'preview' || event.t === 'binary_preview') {
      if (strategy === 'grid') {
        message = `Señal ${event.side} detectada en ${event.pair} a ${event.price}`;
        newConfidence = event.conf || 0.65;
        newReactionTime = Math.random() * 1000 + 500;
      } else if (strategy === 'binary') {
        message = `Oportunidad ${event.dir} en ${event.asset} con strike ${event.strike}`;
        newConfidence = event.conf || 0.58;
        newReactionTime = Math.random() * 800 + 400;
      }
    } else if (event.t === 'executed' || event.t === 'binary_executed') {
      if (strategy === 'grid') {
        message = `Orden ${event.side} ejecutada en ${event.pair} a ${event.fillPrice}`;
        newConfidence = 0.95;
        newReactionTime = 0;
      } else if (strategy === 'binary') {
        message = `Binary ${event.dir} ejecutado - Resultado: ${event.result}`;
        newConfidence = event.result === 'WIN' ? 0.95 : 0.15;
        newReactionTime = 0;
      }
    }

    if (message) {
      const newMessage: CoachMessage = {
        id: `coach_${Date.now()}`,
        timestamp: Date.now(),
        message,
        confidence: newConfidence,
        reactionTime: newReactionTime,
        nextHintIn: Math.floor(Math.random() * 60) + 10
      };

      setCurrentMessage(newMessage);
      setConfidence(newConfidence);
      setReactionTime(newReactionTime);
      setNextHintIn(newMessage.nextHintIn || 0);
    }
  }

  // Get confidence color
  const confidenceFormatted = formatConfidence(confidence);

  // Get reaction time color
  const getReactionTimeColor = (time: number) => {
    if (time === 0) return 'text-gray-400';
    if (time < 500) return 'text-green-500';
    if (time < 1000) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">IA Coach</h3>
      
      {/* Current Message */}
      {currentMessage && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-gray-400">
              {formatRelativeTime(currentMessage.timestamp)}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Confidence:</span>
              <span className={`text-xs font-semibold ${confidenceFormatted.color}`}>
                {confidenceFormatted.text}
              </span>
            </div>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {currentMessage.message}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase">Next Hint</div>
          <div className="text-lg font-bold text-blue-500">
            {nextHintIn > 0 ? `${nextHintIn}s` : 'Now'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase">Reaction Time</div>
          <div className={`text-lg font-bold ${getReactionTimeColor(reactionTime)}`}>
            {reactionTime > 0 ? `${reactionTime}ms` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Strategy-specific Insights */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Strategy Insights</h4>
        <div className="text-xs text-gray-400 space-y-1">
          {strategy === 'grid' ? (
            <>
              <div>• Grid trading activo en {assets[0]}</div>
              <div>• Monitoreando niveles de soporte/resistencia</div>
              <div>• RSI: 45.2 (Neutral)</div>
              <div>• Volumen: Alto</div>
            </>
          ) : (
            <>
              <div>• Binary options en {assets[0]}</div>
              <div>• Análisis de momentum a corto plazo</div>
              <div>• Volatilidad: Media</div>
              <div>• Tendencias: Alcista</div>
            </>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
        <span className="text-xs text-gray-400">Mode:</span>
        <span className={`text-xs font-semibold ${
          mode === 'live' ? 'text-orange-500' : 'text-blue-500'
        }`}>
          {mode.toUpperCase()}
        </span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between p-2 bg-gray-700 rounded mt-2">
        <span className="text-xs text-gray-400">Connection:</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Broker Info */}
      <div className="flex items-center justify-between p-2 bg-gray-700 rounded mt-2">
        <span className="text-xs text-gray-400">Broker:</span>
        <span className="text-xs text-white">{broker.toUpperCase()}</span>
      </div>
    </div>
  );
}
