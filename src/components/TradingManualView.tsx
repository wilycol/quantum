import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Area, Bar, CartesianGrid,
} from 'recharts';
import { createSimulator } from '../core/manualTrading/simulator';
import { coach, nextAdvice, feedback } from '../core/manualTrading/coach';
import { getSignal } from '../core/manualTrading/strategy';
import { State, Trade, Advice, TradeFeedback } from '../core/manualTrading/types';
import { useEnvironment } from '../hooks/useEnvironment';
import { ensureArray, num, hasAllKeys, onlyFinite } from '../lib/safe';
import { useContainerReady } from '../hooks/useContainerReady';
import { useCandles } from '../hooks/useCandles';

export default function TradingManualView() {
  const { ref, ready } = useContainerReady();
  const { data: candles, loading, error, symbol, timeframe } = useCandles();
  const [state, setState] = useState<State>({
    closes: [100],
    lastPrice: 100,
    rsi: null,
    side: 'hold',
    trades: [],
    pnl: 0,
    isActive: false
  });
  
  const [currentAdvice, setCurrentAdvice] = useState<Advice>({ message: '', countdown: 10 });
  const [countdown, setCountdown] = useState(10);
  const [quantity, setQuantity] = useState(100);
  const [selectedSide, setSelectedSide] = useState<'buy' | 'sell'>('buy');
  const [lastFeedback, setLastFeedback] = useState<TradeFeedback | null>(null);
  const { mode: envMode, paper, enableAI } = useEnvironment();
  const [mode, setMode] = useState<'Demo' | 'Hybrid' | 'Live'>('Demo');
  
  const simulatorRef = useRef<any>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Crear simulador
    simulatorRef.current = createSimulator({
      tickInterval: 1000,
      initialPrice: 100,
      volatility: 0.02
    });

    // Iniciar simulador
    simulatorRef.current.start();

    // Iniciar countdown del coach
    coach.startCountdown((count) => {
      setCountdown(count);
      if (count === 0) {
        const newAdvice = nextAdvice();
        setCurrentAdvice(newAdvice);
      }
    });

    // Obtener primer consejo
    const initialAdvice = nextAdvice();
    setCurrentAdvice(initialAdvice);

    // Actualizar estado cada segundo
    const updateInterval = setInterval(() => {
      if (simulatorRef.current) {
        const newState = simulatorRef.current.getState();
        setState(newState);
      }
    }, 1000);

    return () => {
      if (simulatorRef.current) {
        simulatorRef.current.destroy();
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      clearInterval(updateInterval);
      coach.destroy();
    };
  }, []);

  const handleTrade = () => {
    if (!simulatorRef.current) return;

    const trade = simulatorRef.current.applyTrade({
      side: selectedSide,
      qty: num(quantity),
      price: num(state?.lastPrice)
    });

    // Calcular feedback
    const signal = getSignal(ensureArray(state?.closes));
    const isCorrect = signal === selectedSide;
    
    // Calcular timing (simplificado)
    const timing = countdown > 7 ? 'early' : countdown < 3 ? 'late' : 'perfect';
    
    const tradeFeedback = feedback({
      timing,
      correctness: isCorrect ? 'correct' : 'incorrect'
    });

    setLastFeedback(tradeFeedback);
    
    // Limpiar feedback después de 5 segundos
    setTimeout(() => setLastFeedback(null), 5000);
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatQuantity = (qty: number) => qty.toLocaleString();

  const getSignalColor = (side: string) => {
    switch (side) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSignalBgColor = (side: string) => {
    switch (side) {
      case 'buy': return 'bg-green-100';
      case 'sell': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  // Normalizamos a un shape simple: {t,o,h,l,c,v,label,close,volume}
  const rows = ensureArray(candles)
    .filter(c => hasAllKeys(c, ['t','o','h','l','c','v']))
    .map(c => ({
      t: num((c as any).t),
      o: num((c as any).o),
      h: num((c as any).h),
      l: num((c as any).l),
      c: num((c as any).c),
      v: num((c as any).v),
    }))
    .filter(r => onlyFinite(r, ['o','h','l','c','v']))
    .map(r => ({
      ...r,
      label: new Date(r.t).toLocaleTimeString(),
      close: r.c,
      volume: r.v,
    }));

  const hasData = rows.length > 0;

  // Manejo de errores
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div style={{padding: 16, color: '#f88', textAlign: 'center'}}>
          Error: {String(error.message || error)}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:16}}>
      <div className="q-grid">
        <div className="panel chart-card" ref={ref}>
            <h2 className="text-xl font-semibold mb-4">Precio en Tiempo Real</h2>
            
            {/* Encabezado / badges */}
            <div style={{display:'flex',gap:8,alignItems:'center',padding:'8px 0'}}>
              <span>Symbol: <b>{symbol}</b></span>
              <span>• TF: <b>{timeframe}</b></span>
            </div>

            {loading && <div style={{padding:16,color:'#888'}}>Cargando datos…</div>}
            {!loading && !ready && <div style={{padding:16,color:'#888'}}>Inicializando gráfico…</div>}
            {!loading && ready && !hasData && (
              <div style={{padding:16,color:'#888'}}>No hay datos para mostrar todavía.</div>
            )}

            {ready && hasData && (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis yAxisId="p" />
                  <YAxis yAxisId="v" orientation="right" hide />
                  <Tooltip />
                  <Area
                    yAxisId="p"
                    type="monotone"
                    dataKey="close"
                    fillOpacity={0.2}
                  />
                  <Bar
                    yAxisId="v"
                    dataKey="volume"
                    barSize={3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
        </div>

        <div className="panel side-card">
          <h2 className="text-xl font-semibold mb-4">Estado del Mercado</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Precio Actual:</span>
              <span className="text-lg font-semibold">
                {formatPrice(num(state?.lastPrice))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">RSI:</span>
              <span className="text-lg font-semibold">
                {state?.rsi ? num(state.rsi).toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Señal:</span>
              <div className={`mt-1 px-3 py-2 rounded-lg text-center font-medium ${getSignalBgColor(state?.side ?? 'hold')}`}>
                <span className={getSignalColor(state?.side ?? 'hold')}>
                  {(state?.side ?? 'hold').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">PnL:</span>
              <span className={`text-lg font-semibold ${
                num(state?.pnl) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPrice(num(state?.pnl))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Estado:</span>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                state?.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  state?.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {state?.isActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{height:16}} />
      <div className="panel side-card">
        <h2 className="text-xl font-semibold mb-4">Controles de Trading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selección de Side */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dirección
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSide('buy')}
                    className={`btn ${selectedSide === 'buy' ? '' : 'ghost'}`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setSelectedSide('sell')}
                    className={`btn ${selectedSide === 'sell' ? '' : 'ghost'}`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  step="1"
                />
              </div>

              {/* Botón Trade Now */}
              <div className="flex items-end">
                <button
                  onClick={handleTrade}
                  className="btn w-full"
                >
                  Trade Now
                </button>
              </div>
            </div>
      </div>

      <div style={{height:16}} />
      <div className="panel side-card">
        <h2 className="text-xl font-semibold mb-4">Historial de Trades</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-left">Hora</th>
                <th className="text-left">Side</th>
                <th className="text-left">Cantidad</th>
                <th className="text-left">Precio</th>
                <th className="text-left">PnL</th>
                <th className="text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ensureArray(state?.trades).slice().reverse().map((trade: any) => (
                <tr key={trade?.id}>
                  <td>{trade?.time?.toLocaleTimeString() ?? 'N/A'}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade?.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade?.side?.toUpperCase() ?? 'N/A'}
                    </span>
                  </td>
                  <td>{trade?.qty ?? 'N/A'}</td>
                  <td>{formatPrice(num(trade?.price))}</td>
                  <td className={num(trade?.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPrice(num(trade?.pnl))}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trade?.status ?? 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
              {ensureArray(state?.trades).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center muted">
                    No hay trades aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
