import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { usePaper } from '../hooks/usePaper';
import { CLIENT_TRADING_MODE, MODE_BADGE } from '../lib/mode';
import { getBalances, placeOrderBinance } from '../services/api';

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
  const [nextIn, setNextIn] = useState(3);
  const [quantity, setQuantity] = useState(100);
  const [selectedSide, setSelectedSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(0.001); // en BTC para BTCUSDT
  const [lastFeedback, setLastFeedback] = useState<TradeFeedback | null>(null);
  const [tradingLoading, setTradingLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>(undefined);
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

  // Timer del coach para evitar re-render brusco
  useEffect(() => {
    const id = setInterval(() => setNextIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
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

  // Mensajes cortos del coach
  const getCoachMessage = () => {
    const messages = [
      "Volatilidad alta, espera mejor entrada",
      "Tendencia lateral: tamaño chico",
      "RSI sobrecomprado, considera vender",
      "Soporte fuerte, oportunidad de compra",
      "Resistencia cercana, toma ganancias",
      "Mercado consolidando, mantén posición",
      "Breakout confirmado, sigue la tendencia",
      "Volumen bajo, evita trades grandes"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

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

  // Componente Row para mostrar información
  const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="flex justify-between items-center">
      <span className="text-sm muted">{label}:</span>
      <span className="text-lg font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );

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

  // Calcular precio actual desde las velas reales
  const last = rows.at(-1);
  const lastClose = last?.close ?? 0;

  // Hook de paper trading
  const { state: paperState, unrealized, equity, submit, reset } = usePaper(lastClose);

  // RSI simple (14)
  function calcRSI(data: typeof rows, period = 14) {
    const closes = data.map(d => d.close);
    if (closes.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    const rs = (gains / period) / ((losses || 1e-9) / period);
    return Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
  }

  const rsi = useMemo(() => calcRSI(rows, 14), [rows]);

  const signal =
    rsi > 70 ? 'SELL' :
    rsi < 30 ? 'BUY'  : 'HOLD';

  // Límites de riesgo
  const maxQtyPerTrade = Math.floor(equity * 0.05); // 5% del equity
  const canSell = paperState.pos && paperState.pos.side === 'BUY' && paperState.pos.qty > 0;
  const canBuy = qty <= maxQtyPerTrade;
  const canSellQty = canSell && qty <= (paperState.pos?.qty || 0);
  
  // Estado de riesgo
  const riskStatus = qty > maxQtyPerTrade ? 'ALERTA' : 'OK';
  const riskColor = riskStatus === 'OK' ? '#22c55e' : '#ef4444';

  // Validación de riesgo para Binance
  const riskOk = useMemo(() => {
    // guardrail simple: 5% del equity como máximo
    const maxBase = equity > 0 ? (equity * 0.05) / lastClose : 0.0;
    return qty <= maxBase + 1e-9;
  }, [equity, lastClose, qty]);

  // Funciones de orden
  type Side = 'BUY' | 'SELL';

  async function onOrder(side: Side) {
    try {
      setTradingLoading(true); 
      setMsg(undefined);

      if (CLIENT_TRADING_MODE === 'paper') {
        // Paper: usa el motor local
        submit(side, Number(qty));
        setMsg(`PAPER ${side} ${qty}`);
        return;
      }

      // TESTNET: valida guardrails mínimos en cliente
      if (!riskOk) { 
        setMsg('ALERTA: qty excede límite de 5% de equity'); 
        return; 
      }

      const payload = {
        symbol: 'BTCUSDT',
        side,
        type: 'MARKET' as const,
        quantity: Number(qty),
        test: false, // pon true las primeras veces si quieres "/order/test"
      };

      const res = await placeOrderBinance(payload);
      setMsg(`TESTNET OK: ${side} ${qty} -> ${JSON.stringify(res.data ?? {})}`);
    } catch (e: any) {
      setMsg(`ERROR: ${e?.message || e}`);
    } finally {
      setTradingLoading(false);
    }
  }

  async function onCheckBalances() {
    try {
      setTradingLoading(true);
      const r = await getBalances();
      setMsg(`Balances: ${JSON.stringify(r.data)}`);
    } catch (e: any) {
      setMsg(`ERROR balances: ${e?.message || e}`);
    } finally {
      setTradingLoading(false);
    }
  }

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
                  <XAxis dataKey="label" minTickGap={32} />
                  <YAxis yAxisId="p" domain={['dataMin - 50', 'dataMax + 50']}
                         tickFormatter={(v)=> v.toLocaleString('en-US')} />
                  <YAxis yAxisId="v" orientation="right" hide />
                  <Tooltip formatter={(v: any, name: string) => {
                    if (name === 'volume') return [v.toLocaleString('en-US'), 'Volume'];
                    return [Number(v).toLocaleString('en-US', {maximumFractionDigits:2}), 'Close'];
                  }} />
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
                ${lastClose.toLocaleString('en-US', {maximumFractionDigits:2})}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">RSI:</span>
              <span className="text-lg font-semibold">
                {rsi.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Señal RSI:</span>
              <div className={`mt-1 px-3 py-2 rounded-lg text-center font-medium ${getSignalBgColor(signal.toLowerCase())}`}>
                <span className={getSignalColor(signal.toLowerCase())}>
                  {signal}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Riesgo:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: riskColor }}>
                  {riskStatus}
                </span>
                <span className="text-xs text-gray-500">
                  (Max: {maxQtyPerTrade})
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

        <div className="panel side-card">
          <h2 className="text-xl font-semibold mb-4">IA Coach</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm muted">Próximo consejo:</span>
              <span className="text-lg font-semibold text-blue-600">
                {nextIn}s
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                {getCoachMessage()}
              </p>
            </div>
            {lastFeedback && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Feedback:</strong> {lastFeedback.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel side-card">
        <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
        <div className="space-y-4">
          <Row label="Precio Actual" value={"$" + lastClose.toLocaleString()} />
          <Row 
            label="PnL" 
            value={(unrealized >= 0 ? '+' : '') + "$" + unrealized.toFixed(2)} 
            color={unrealized >= 0 ? '#22c55e' : '#ef4444'} 
          />
          <Row label="Cash" value={"$" + paperState.cash.toFixed(2)} />
          <Row 
            label="Posición" 
            value={paperState.pos ? `${paperState.pos.side} ${paperState.pos.qty} @ $${paperState.pos.avg.toFixed(2)}` : '—'} 
          />
          <Row label="Equity" value={"$" + equity.toFixed(2)} />
          <Row 
            label="Límite por Trade" 
            value={`${maxQtyPerTrade} (5% equity)`} 
          />
          <Row 
            label="Disponible para Venta" 
            value={paperState.pos?.qty || 0} 
          />
          <Row 
            label="Riesgo Binance" 
            value={riskOk ? 'OK' : 'ALERTA (qty > 5% equity)'}
            color={riskOk ? '#16a34a' : '#dc2626'}
          />
        </div>
      </div>

      <div style={{height:16}} />
      <div className="panel side-card">
        {/* Badge de modo */}
        <div style={{
          display:'inline-block', padding:'4px 8px', borderRadius:8,
          background: CLIENT_TRADING_MODE==='paper' ? '#fff7ed' : '#eef2ff',
          color: CLIENT_TRADING_MODE==='paper' ? '#9a3412' : '#3730a3',
          fontWeight:700, marginBottom:8
        }}>
          MODE: {MODE_BADGE}
        </div>

        <h2 className="text-xl font-semibold mb-4">Trading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Controles de trading */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cantidad
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={qty}
              onChange={e => setQty(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 items-end">
            <button 
              className={`btn ${!canBuy ? 'opacity-50 cursor-not-allowed' : ''} ${
                signal === 'BUY' ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => onOrder('BUY')}
              disabled={tradingLoading || !canBuy}
              title={!canBuy ? `Cantidad excede el límite de riesgo (${maxQtyPerTrade})` : signal === 'BUY' ? 'Señal RSI: BUY' : ''}
            >
              BUY {signal === 'BUY' && '✓'}
            </button>
            <button 
              className={`btn ghost ${!canSellQty ? 'opacity-50 cursor-not-allowed' : ''} ${
                signal === 'SELL' ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => onOrder('SELL')}
              disabled={tradingLoading || !canSellQty}
              title={!canSell ? 'No hay posición para vender' : !canSellQty ? `Cantidad excede la posición disponible (${paperState.pos?.qty || 0})` : signal === 'SELL' ? 'Señal RSI: SELL' : ''}
            >
              SELL {signal === 'SELL' && '✓'}
            </button>
          </div>

          <div className="flex gap-2 items-end">
            {CLIENT_TRADING_MODE !== 'paper' && (
              <button 
                disabled={tradingLoading} 
                onClick={onCheckBalances}
                className="btn ghost"
              >
                Balances
              </button>
            )}
            <button 
              disabled={loading} 
              onClick={reset}
              className="btn ghost"
            >
              Reset (paper)
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
                <th>TIEMPO</th>
                <th>SIDE</th>
                <th>CANTIDAD</th>
                <th>PRECIO</th>
                <th>FEE</th>
                <th>TOTAL PnL</th>
              </tr>
            </thead>
            <tbody>
              {paperState.trades.length === 0 && (
                <tr>
                  <td colSpan={6} style={{textAlign:'center',color:'#999'}}>
                    No hay trades aún
                  </td>
                </tr>
              )}
              {paperState.trades.slice().reverse().map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.ts).toLocaleTimeString()}</td>
                  <td>{t.side}</td>
                  <td>{t.qty}</td>
                  <td>${t.price.toFixed(2)}</td>
                  <td>${t.fee.toFixed(2)}</td>
                  <td style={{color: t.pnl>=0?'#22c55e':'#ef4444'}}>
                    ${t.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mensajes */}
      {msg && (
        <div style={{marginTop: 16}}>
          <div className="panel side-card">
            <h3 className="text-lg font-semibold mb-2">Mensajes del Sistema</h3>
            <pre style={{
              whiteSpace:'pre-wrap', 
              fontSize:12, 
              background:'#111', 
              color:'#ddd', 
              padding:8, 
              borderRadius:8,
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {msg}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
