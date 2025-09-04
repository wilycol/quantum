import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';
import { createSimulator } from '../core/manualTrading/simulator';
import { coach, nextAdvice, feedback } from '../core/manualTrading/coach';
import { getSignal } from '../core/manualTrading/strategy';
import { State, Trade, Advice, TradeFeedback } from '../core/manualTrading/types';
import { useEnvironment } from '../hooks/useEnvironment';
import { ensureArray, toNumber } from '../lib/safe';
import { useContainerReady } from '../hooks/useContainerReady';

export default function TradingManualView() {
  const { ref, ready } = useContainerReady();
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
      qty: quantity,
      price: state.lastPrice
    });

    // Calcular feedback
    const signal = getSignal(state.closes);
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

  // Preparar datos para el gráfico (blindados)
  const rawCloses = state?.closes ?? [];
  const chartData = ensureArray(rawCloses).map((close, index) => ({
    time: index,
    price: toNumber(close),
    rsi: toNumber(state?.rsi, 50)
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manual Trading - Módulo 3
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Modo:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            mode === 'Demo' ? 'bg-blue-100 text-blue-800' :
            mode === 'Hybrid' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {mode}
          </span>
          
          {/* Estado del Sistema */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">Paper:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              paper ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {paper ? 'ON' : 'OFF'}
            </span>
            <span className="text-gray-600">•</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              enableAI ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
            }`}>
              AI: {enableAI ? 'Active' : 'Mock'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Principal - Gráfico y Controles */}
        <div className="lg:col-span-3 space-y-6">
          {/* Gráfico */}
          <div className="bg-white rounded-lg shadow-md p-6" ref={ref} style={{minHeight: 320}}>
            <h2 className="text-xl font-semibold mb-4">Precio en Tiempo Real</h2>
            {ready && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    formatter={(value: any) => [formatPrice(value), 'Precio']}
                    labelFormatter={(label) => `Tick ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    yAxisId={1}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 16, color: '#888', textAlign: 'center', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ready ? 'No hay datos para mostrar todavía.' : 'Inicializando gráfico…'}
              </div>
            )}
          </div>

          {/* Controles de Trading */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Controles de Trading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selección de Side */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSide('buy')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedSide === 'buy' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    COMPRAR
                  </button>
                  <button
                    onClick={() => setSelectedSide('sell')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedSide === 'sell' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    VENDER
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
                  className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Trade Now
                </button>
              </div>
            </div>
          </div>

          {/* Historial de Trades */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Historial de Trades</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Side
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ensureArray(state?.trades).slice().reverse().map((trade: any) => (
                    <tr key={trade.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.time.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trade.side === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatQuantity(trade.qty)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(trade.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(trade.fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(trade.total)}
                      </td>
                    </tr>
                  ))}
                  {state.trades.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No hay trades aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral - IA Coach */}
        <div className="lg:col-span-1 space-y-6">
          {/* Estado del Mercado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Estado del Mercado</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Precio Actual:</span>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(state.lastPrice)}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">RSI:</span>
                <div className="text-lg font-semibold text-gray-900">
                  {state.rsi ? state.rsi.toFixed(2) : 'N/A'}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Señal Sugerida:</span>
                <div className={`mt-1 px-3 py-2 rounded-lg text-center font-medium ${getSignalBgColor(state.side)}`}>
                  <span className={getSignalColor(state.side)}>
                    {state.side.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">PnL Total:</span>
                <div className={`text-lg font-semibold ${
                  state.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPrice(state.pnl)}
                </div>
              </div>
            </div>
          </div>

          {/* IA Coach */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">IA Coach</h2>
            <div className="space-y-4">
              {/* Consejo Actual */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Consejo Actual:</h3>
                <p className="text-blue-800 text-sm mb-3">
                  {currentAdvice.message}
                </p>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {countdown}s
                  </div>
                  <div className="text-xs text-blue-500">Próximo consejo</div>
                </div>
              </div>

              {/* Feedback del último trade */}
              {lastFeedback && (
                <div className={`p-4 rounded-lg ${
                  lastFeedback.correctness === 'correct' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-2">Feedback:</h3>
                  <p className={`text-sm ${
                    lastFeedback.correctness === 'correct' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastFeedback.message}
                  </p>
                </div>
              )}

              {/* Estado del simulador */}
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  state.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    state.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {state.isActive ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
