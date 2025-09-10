'use client';
import { useEffect, useState } from 'react';
import { useRisk } from '@/lib/riskStore';
import { useWS } from '@/app/providers/WSProvider';
import { useMarket } from '@/lib/marketStore';
import { send } from '@/lib/wsClient';
import { useUILayout } from '../lib/uiLayoutStore';

export default function ControlDock() {
  const { connected } = useWS();
  const { binanceConnected } = useMarket();
  const { level, killSwitch, setLevel, toggleKillSwitch, setLimits } = useRisk();
  const { load } = useUILayout();
  const [mode, setMode] = useState<'SHADOW' | 'LIVE'>('SHADOW');

  useEffect(() => { 
    load(); 
  }, [load]);

  const preset = (lvl: 'low' | 'medium' | 'high') => {
    if (lvl === 'low') {
      setLimits({ 
        maxTradePercent: 1, 
        maxDailyPercent: 5, 
        maxOpenPositions: 2,
        stopLossPercent: 2,
        takeProfitPercent: 3
      });
    }
    if (lvl === 'medium') {
      setLimits({ 
        maxTradePercent: 2, 
        maxDailyPercent: 10, 
        maxOpenPositions: 3,
        stopLossPercent: 3,
        takeProfitPercent: 5
      });
    }
    if (lvl === 'high') {
      setLimits({ 
        maxTradePercent: 5, 
        maxDailyPercent: 20, 
        maxOpenPositions: 5,
        stopLossPercent: 5,
        takeProfitPercent: 8
      });
    }
    setLevel(lvl);
  };

  const start = () => {
    console.log('[ControlDock] Starting bot...');
    send({ op: 'bot_start', t: Date.now() });
  };
  
  const stop = () => {
    console.log('[ControlDock] Stopping bot...');
    send({ op: 'bot_stop', t: Date.now() });
  };
  
  const reset = () => {
    console.log('[ControlDock] Resetting bot...');
    send({ op: 'bot_reset', t: Date.now() });
  };

  return (
    <div className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-zinc-800">
      <div className="px-4 py-3 flex items-center gap-4 text-sm">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-medium">Mode:</label>
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value as 'SHADOW' | 'LIVE')} 
            className="bg-zinc-900 px-3 py-1 rounded border border-zinc-700 text-white"
          >
            <option value="SHADOW">SHADOW</option>
            <option value="LIVE">LIVE</option>
          </select>
        </div>

        {/* Kill Switch */}
        <button 
          onClick={toggleKillSwitch}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            killSwitch 
              ? 'bg-red-700 text-white hover:bg-red-600' 
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          Kill-Switch: {killSwitch ? 'ON' : 'OFF'}
        </button>

        {/* Bot Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={start} 
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            Start
          </button>
          <button 
            onClick={stop}  
            className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors"
          >
            Stop
          </button>
          <button 
            onClick={reset} 
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Risk Presets */}
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-medium">Presets:</span>
          <button 
            onClick={() => preset('low')} 
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              level === 'low' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            Low
          </button>
          <button 
            onClick={() => preset('medium')} 
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              level === 'medium' ? 'bg-yellow-600 text-white' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            Med
          </button>
          <button 
            onClick={() => preset('high')} 
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              level === 'high' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            High
          </button>
        </div>

        {/* Connection Status */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
              WS {connected ? '●' : '○'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${binanceConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={`text-xs font-medium ${binanceConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              Market {binanceConnected ? '●' : '○'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
