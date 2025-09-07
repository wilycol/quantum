// src/components/TradingManualView.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { AppMode } from '../state/app';
import { getKlinesLive, getKlinesMock } from '../services/market';
import { Candle } from '../types/candle';
import { usePaper } from '../hooks/usePaper';
import { placeOrderBinance, getBalances } from '../services/api';
import { IACoachPanel } from './IACoachPanel';
import ChartArea from './ChartArea';
import RightSidebar from './RightSidebar';
import Card from './ui/Card';
import { maxQtyByRisk, ensureQtyWithinRisk, getRiskStatus, validateSymbol } from '../lib/risk';
import { useUiStore } from '../stores/ui';

// Helpers UI
const fmt = (n:number) => isFinite(n) ? '$'+n.toFixed(2) : '-';

export default function TradingManualView() {
  // ---- modo app
  const [appMode, setAppMode] = useState<AppMode>('demo-hybrid');
  const { rightOpen, toggleRight } = useUiStore();

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
      setLoading(true);
      const data = appMode === 'demo-hybrid' 
        ? getKlinesMock()
        : await getKlinesLive(selectedSymbol, selectedTimeframe);
      setCandles(data);
    } catch (e:any) {
      setMsg(`ERROR klines: ${e?.message||e}`);
    }
  }, [appMode, selectedSymbol, selectedTimeframe]);

  useEffect(() => { fetchCandles(); }, [appMode, selectedSymbol, selectedTimeframe]);

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

  // determina si ejecución real está habilitada
  const canReal = useMemo(() => {
    return appMode === 'live' && process.env.NODE_ENV === 'development';
  }, [appMode]);

  // ---- handlers de trading
  const handleTrade = async (side: 'buy' | 'sell') => {
    if (loading) return;
    
    try {
      setLoading(true);
      setMsg('');

      const currentPrice = lastClose;
      if (!currentPrice) {
        setMsg('ERROR: Sin precio actual');
        return;
      }

      // 1. Validar símbolo
      if (!validateSymbol(selectedSymbol)) {
        setMsg(`ERROR: Símbolo ${selectedSymbol} no permitido`);
        return;
      }

      // 2. Validar cantidad
      const orderQty = Number(qty);
      if (orderQty <= 0) {
        setMsg('ERROR: Cantidad debe ser mayor a 0');
        return;
      }

      // 3. Calcular riesgo y validar límites
      const maxQty = maxQtyByRisk(equity, currentPrice, 0.05); // Usar el valor por defecto o de COMPLIANCE_CONFIG
      
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
        detail: { side, symbol: selectedSymbol, price: currentPrice, qty: orderQty }
      }));

      // 5. Ejecutar orden
      if (!canReal) {
        // Paper
        submit(side, orderQty);
        setMsg(`PAPER ${side.toUpperCase()} ${orderQty} @ ${fmt(currentPrice)} (${currentRiskStatus.riskPercentage.toFixed(1)}% riesgo)${tp ? ` TP:${fmt(tp)}` : ''}${sl ? ` SL:${fmt(sl)}` : ''}`);
        return;
      }

      // Real (solo en desarrollo)
      const res = await placeOrderBinance({
        symbol: selectedSymbol,
        side: side.toUpperCase() as 'BUY'|'SELL',
        type: 'MARKET',
        quantity: orderQty,
        test: false,
      });
      setMsg(`TESTNET OK: ${side.toUpperCase()} ${orderQty} @ ${fmt(currentPrice)} (${currentRiskStatus.riskPercentage.toFixed(1)}% riesgo) -> ${JSON.stringify(res.data ?? {})}`);
    } catch (e: any) {
      setMsg(`ERROR: ${e?.message||e}`);
    } finally { setLoading(false); }
  };

  const onBuy = () => handleTrade('buy');
  const onSell = () => handleTrade('sell');

  const onCheckBalances = async () => {
    try {
      setLoading(true);
      const res = await getBalances();
      setMsg(`BALANCES: ${JSON.stringify(res.data ?? {})}`);
    } catch (e: any) {
      setMsg(`ERROR balances: ${e?.message||e}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="px-4 py-3">
      {/* Header: selector de modo */}
      <div className="mb-4">
        <ModeSwitch onChange={setAppMode} />
      </div>

      {/* barra de acciones rápidas */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={toggleRight}
          className="px-3 py-1 rounded-md bg-neutral-800 text-gray-200 border border-white/10">
          {rightOpen ? "Ocultar panel" : "Mostrar panel"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* área de gráfico toma 12 o 9/10 columnas según sidebar */}
        <div className={rightOpen ? "col-span-12 xl:col-span-9 2xl:col-span-10" : "col-span-12"}>
          <ChartArea />
        </div>
        {/* sidebar derecha */}
        <div className="hidden xl:block xl:col-span-3 2xl:col-span-2">
          <RightSidebar />
        </div>
      </div>

      {/* Panel de información adicional debajo del chart */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información de la posición actual */}
        <Card className="bg-neutral-900 border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Trading</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Precio Actual</span>
              <span className="text-white font-semibold">{fmt(lastClose)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Equity</span>
              <span className="text-white font-semibold">{fmt(equity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">P&L No Realizado</span>
              <span className={`font-semibold ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fmt(unrealized)}
              </span>
            </div>
          </div>
        </Card>

        {/* Estado de riesgo */}
        <Card className="bg-neutral-900 border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Gestión de Riesgo</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Riesgo Actual</span>
              <span className={`font-semibold ${
                riskStatus.isWithinRisk ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {riskStatus.riskPercentage.toFixed(1)}% / {riskStatus.maxRiskPercentage}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {riskStatus.message}
            </div>
            <div className="text-xs text-gray-500">
              Max Qty: {riskStatus.maxQty.toFixed(6)}
            </div>
          </div>
        </Card>

        {/* Posiciones y mensajes */}
        <Card className="bg-neutral-900 border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Posiciones</h3>
          {state.positions.length > 0 ? (
            <div className="space-y-2">
              {state.positions.map((pos, index) => (
                <div key={index} className="bg-neutral-800 p-2 rounded text-sm">
                  <div className="flex justify-between">
                    <span className="text-white">{pos.side.toUpperCase()}</span>
                    <span className="text-white">{pos.qty}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Entry: {fmt(pos.entry)} | P&L: <span className={pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmt(pos.pnl)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Sin posiciones abiertas</div>
          )}
          
          {msg && (
            <div className="mt-3 p-2 bg-neutral-800 rounded text-sm text-gray-300">
              {msg}
            </div>
          )}
          
          <button
            onClick={reset}
            className="mt-3 w-full px-3 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 text-sm"
          >
            Reset Paper
          </button>
        </Card>
      </div>

      {/* Panel de IA Coach */}
      <div className="mt-6">
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
  );
}