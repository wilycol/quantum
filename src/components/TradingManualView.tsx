// src/components/TradingManualView.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { AppMode } from '../state/app';
import { getKlinesLive, getKlinesMock } from '../services/market';
import { Candle } from '../types/candle';
import { usePaper } from '../hooks/usePaper';
import { placeOrderBinance, getBalances } from '../services/api';
import { IACoachPanel } from './IACoachPanel';
import CandleChart from './CandleChart';
import Card from './ui/Card';
import { maxQtyByRisk, ensureQtyWithinRisk, getRiskStatus, validateSymbol } from '../lib/risk';

// Helpers UI
const fmt = (n:number) => isFinite(n) ? '$'+n.toFixed(2) : '-';

export default function TradingManualView() {
  // ---- modo app
  const [appMode, setAppMode] = useState<AppMode>('demo-hybrid');

  // ---- datos mercado
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastClose = candles.length ? candles[candles.length - 1].c : 0;

  // ---- paper
  const { state, unrealized, equity, submit, reset } = usePaper(lastClose);

  // ---- exec
  const [qty, setQty] = useState(0.001);
  const [msg, setMsg] = useState<string>();
  const [loading, setLoading] = useState(false);

  // ---- nuevas funcionalidades según documentación
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [oneClickTrading, setOneClickTrading] = useState(false);
  const [tradeFromChart, setTradeFromChart] = useState(false);

  // ---- Market Watch data
  const marketWatchSymbols = [
    { symbol: 'BTCUSDT', price: lastClose, change: '+2.5%', changeColor: 'text-green-500' },
    { symbol: 'ETHUSDT', price: 3450.25, change: '+1.8%', changeColor: 'text-green-500' },
    { symbol: 'BNBUSDT', price: 320.45, change: '-0.5%', changeColor: 'text-red-500' },
    { symbol: 'ADAUSDT', price: 0.485, change: '+3.2%', changeColor: 'text-green-500' },
    { symbol: 'SOLUSDT', price: 98.75, change: '+5.1%', changeColor: 'text-green-500' },
  ];

  // cargar velas según modo
  const fetchCandles = useCallback(async () => {
    try {
      setMsg(undefined);
      if (appMode === 'demo-full') {
        setCandles(getKlinesMock(500));
      } else {
        const data = await getKlinesLive(selectedSymbol, selectedTimeframe, 500);
        setCandles(data);
      }
    } catch (e:any) {
      setMsg(`ERROR klines: ${e?.message||e}`);
    }
  }, [appMode, selectedSymbol, selectedTimeframe]);

  useEffect(() => { fetchCandles(); }, [fetchCandles]);

  // Listener para órdenes desde el chart
  useEffect(() => {
    const onOrder = (e: Event) => {
      const { side, symbol, price, qty } = (e as CustomEvent).detail;
      console.log('[TradingManualView] Order from chart:', { side, symbol, price, qty });
      
      // Validar símbolo
      if (!validateSymbol(symbol)) {
        setMsg(`ERROR: Símbolo ${symbol} no permitido`);
        return;
      }
      
      // Validar cantidad por riesgo
      const riskValidation = ensureQtyWithinRisk(qty, equity, price);
      if (!riskValidation.success) {
        setMsg(`RIESGO: ${riskValidation.error} (Máximo: ${riskValidation.maxQty.toFixed(6)})`);
        return;
      }
      
      // Ejecutar orden en paper mode
      try {
        submit(side, qty);
        setMsg(`PAPER ${side.toUpperCase()} ${qty} @ ${fmt(price)} (desde chart)`);
      } catch (error: any) {
        setMsg(`ERROR: ${error?.message || error}`);
      }
    };
    
    window.addEventListener("qt:order", onOrder as EventListener);
    return () => window.removeEventListener("qt:order", onOrder as EventListener);
  }, [equity, submit]);

  // guardrails 5% equity con estado de riesgo
  const riskStatus = useMemo(() => {
    if (equity <= 0 || lastClose <= 0) {
      return { 
        isWithinRisk: true, 
        maxQty: 0, 
        riskPercentage: 0, 
        maxRiskPercentage: 5,
        message: 'Sin datos' 
      };
    }
    return getRiskStatus(equity, lastClose, Number(qty));
  }, [equity, lastClose, qty]);

  const riskOk = riskStatus.isWithinRisk;

  // determina si ejecución real está habilitada
  const canReal = useMemo(() => {
    const isProd = (import.meta.env?.PROD ?? false) === true; // build flag
    if (appMode === 'live-trading') {
      // En Preview → Testnet. En Production → forzamos paper por seguridad.
      return !isProd; // true solo en preview
    }
    return false;
  }, [appMode]);

  // Trade Now (desde botones o desde IA Coach)
  async function onOrder(side: 'BUY'|'SELL') {
    try {
      setLoading(true); setMsg(undefined);

      // Validaciones de riesgo y compliance
      const currentPrice = lastClose;
      const orderQty = Number(qty);
      
      // 1. Validar símbolo
      if (!validateSymbol(selectedSymbol)) {
        setMsg(`ERROR: Símbolo ${selectedSymbol} no permitido`);
        return;
      }

      // 2. Validar cantidad mínima
      if (orderQty <= 0) {
        setMsg('ERROR: Cantidad debe ser mayor a 0');
        return;
      }

      // 3. Calcular riesgo y validar límites
      const maxQty = maxQtyByRisk(equity, currentPrice, 0.05);
      
      const riskValidation = ensureQtyWithinRisk(orderQty, equity, currentPrice);
      if (!riskValidation.success) {
        setMsg(`RIESGO: ${riskValidation.error} (Máximo: ${riskValidation.maxQty.toFixed(6)})`);
        return;
      }

      // 4. Obtener estado de riesgo para feedback
      const currentRiskStatus = getRiskStatus(equity, currentPrice, orderQty);

      // Disparar evento para el chart con precio actual y niveles TP/SL
      const tp = takeProfit > 0 ? takeProfit : undefined;
      const sl = stopLoss > 0 ? stopLoss : undefined;
      
      window.dispatchEvent(new CustomEvent("qt:order", { 
        detail: { 
          side: side.toLowerCase() as "buy"|"sell", 
          price: currentPrice, 
          tp, 
          sl 
        } 
      }));

      if (!canReal) {
        // Paper
        submit(side, orderQty);
        setMsg(`PAPER ${side} ${orderQty} @ ${fmt(currentPrice)} (${currentRiskStatus.riskPercentage.toFixed(1)}% riesgo)${tp ? ` TP:${fmt(tp)}` : ''}${sl ? ` SL:${fmt(sl)}` : ''}`);
        return;
      }

      // Live-Trading (Preview=Testnet)
      const res = await placeOrderBinance({
        symbol: selectedSymbol,
        side, type: 'MARKET',
        quantity: orderQty,
        test: false,
      });
      setMsg(`TESTNET OK: ${side} ${orderQty} @ ${fmt(currentPrice)} (${currentRiskStatus.riskPercentage.toFixed(1)}% riesgo) -> ${JSON.stringify(res.data ?? {})}`);
    } catch (e: any) {
      setMsg(`ERROR: ${e?.message||e}`);
    } finally { setLoading(false); }
  }

  // Funciones auxiliares para manejar órdenes con precios específicos
  const onBuy = (price?: number, tp?: number, sl?: number) => {
    const orderPrice = price || lastClose;
    const orderTp = tp || takeProfit;
    const orderSl = sl || stopLoss;
    
    window.dispatchEvent(new CustomEvent("qt:order", { 
      detail: { 
        side: "buy", 
        price: orderPrice, 
        tp: orderTp > 0 ? orderTp : undefined, 
        sl: orderSl > 0 ? orderSl : undefined 
      } 
    }));
    
    // Ejecutar la orden
    onOrder('BUY');
  };

  const onSell = (price?: number, tp?: number, sl?: number) => {
    const orderPrice = price || lastClose;
    const orderTp = tp || takeProfit;
    const orderSl = sl || stopLoss;
    
    window.dispatchEvent(new CustomEvent("qt:order", { 
      detail: { 
        side: "sell", 
        price: orderPrice, 
        tp: orderTp > 0 ? orderTp : undefined, 
        sl: orderSl > 0 ? orderSl : undefined 
      } 
    }));
    
    // Ejecutar la orden
    onOrder('SELL');
  };

  async function onCheckBalances() {
    try {
      setLoading(true);
      const r = await getBalances();
      setMsg(`Balances: ${JSON.stringify(r.data)}`);
    } catch (e: any) {
      setMsg(`ERROR balances: ${e?.message||e}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header: selector de modo */}
      <ModeSwitch onChange={setAppMode} />

      {/* Layout principal según documentación */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Market Watch - Columna izquierda */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Market Watch</h3>
            <div className="space-y-2">
              {marketWatchSymbols.map((item) => (
                <div 
                  key={item.symbol}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSymbol === item.symbol 
                      ? 'bg-brand-gold/20 border border-brand-gold' 
                      : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedSymbol(item.symbol)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">{item.symbol}</span>
                    <span className={`text-sm ${item.changeColor}`}>{item.change}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {fmt(item.price)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Timeframe Selector */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timeframe</h4>
              <div className="grid grid-cols-3 gap-1">
                {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedTimeframe === tf
                        ? 'bg-brand-gold text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Chart Panel - Columna central */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                📈 {selectedSymbol} - {selectedTimeframe}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeFromChart(!tradeFromChart)}
                  className={`px-3 py-1 text-xs rounded ${
                    tradeFromChart
                      ? 'bg-brand-gold text-black'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Trade from Chart
                </button>
              </div>
            </div>
            
            {/* Chart */}
            <div className="relative" style={{height:420}}>
              <CandleChart symbol={selectedSymbol} timeframe={selectedTimeframe} />
              {tradeFromChart && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-white text-sm">Click on chart to place trade</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Execution Panel */}
          <Card className="mt-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⚡ Execution Panel</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity & SL/TP */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    min="0" 
                    value={qty} 
                    onChange={e=>setQty(Number(e.target.value)||0)}
                    className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Stop Loss</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={stopLoss} 
                    onChange={e=>setStopLoss(Number(e.target.value)||0)}
                    className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Take Profit</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={takeProfit} 
                    onChange={e=>setTakeProfit(Number(e.target.value)||0)}
                    className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
              </div>

              {/* Trading Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="oneClick" 
                    checked={oneClickTrading}
                    onChange={e=>setOneClickTrading(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="oneClick" className="text-sm text-gray-700 dark:text-gray-300">1-Click Trading</label>
                </div>

                <div className="flex gap-2">
                  <button 
                    disabled={loading} 
                    onClick={()=>onBuy()}
                    className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    BUY
                  </button>
                  <button 
                    disabled={loading} 
                    onClick={()=>onSell()}
                    className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    SELL
                  </button>
                </div>

                <div className="flex gap-2">
                  {canReal && (
                    <button 
                      disabled={loading} 
                      onClick={onCheckBalances}
                      className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Balances
                    </button>
                  )}
                  <button 
                    disabled={loading} 
                    onClick={reset}
                    className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>

                <div className="text-xs space-y-1">
                  <div className={`${
                    riskStatus.isWithinRisk ? 'text-green-500' : 'text-red-500'
                  }`}>
                    Risk: {riskStatus.riskPercentage.toFixed(1)}% / {riskStatus.maxRiskPercentage}%
                  </div>
                  <div className="text-gray-500">
                    Exec: {canReal ? 'REAL (Testnet)' : 'PAPER'}
                  </div>
                  <div className="text-gray-500">
                    Max Qty: {riskStatus.maxQty.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Account Info & AI Coach - Columna derecha */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Info */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💰 Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price:</span>
                <span className="text-white">{lastClose ? fmt(lastClose) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">PnL:</span>
                <span className={unrealized >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {(unrealized >= 0 ? '+' : '') + fmt(Math.abs(unrealized))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cash:</span>
                <span className="text-white">{fmt(state.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Position:</span>
                <span className="text-white text-xs">
                  {state.pos ? `${state.pos.side} ${state.pos.qty} @ ${fmt(state.pos.avg)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Equity:</span>
                <span className="text-white font-semibold">{fmt(equity)}</span>
              </div>
            </div>
          </Card>

          {/* AI Coach Panel */}
          <IACoachPanel
            candles={candles}
            onAction={(side) => {
              if (side === 'BUY') {
                onBuy();
              } else {
                onSell();
              }
            }}
          />
        </div>
      </div>

      {/* Mensajes */}
      {msg && (
        <Card>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 rounded-lg">
            {msg}
          </pre>
        </Card>
      )}
    </div>
  );
}