// src/components/TradingManualView.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { AppMode } from '../state/app';
import { getKlinesLive, getKlinesMock } from '../services/market';
import { Candle } from '../types/candle';
import { useAccountStore } from '../stores/account';
import { placeOrderBinance, getBalances } from '../services/api';
import { IACoachPanel } from './IACoachPanel';
import ChartArea from './ChartArea';
import RightSidebar from './RightSidebar';
import ExecutionPanel from './ExecutionPanel';
import AccountInfoCard from './AccountInfoCard';
import Card from './ui/Card';
import CustomDropdown from './ui/CustomDropdown';
import { maxQtyByRisk, ensureQtyWithinRisk, getRiskStatus, validateSymbol } from '../lib/risk';
import { getAllowedRiskPct, getRiskConfig } from '../config/risk';
import { useUiStore } from '../stores/ui';
import { useTradeMarkers } from '../stores/tradeMarkers';

// Helpers UI
const fmt = (n:number) => n && isFinite(n) ? '$'+n.toFixed(2) : '-';

export default function TradingManualView() {
  // ---- modo app
  const [appMode, setAppMode] = useState<AppMode>('demo-hybrid');
  const { rightOpen, toggleRight } = useUiStore();

  // ---- datos mercado
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastClose = candles && candles.length > 0 && candles[candles.length - 1]?.c ? candles[candles.length - 1].c : 0;

  // ---- account state
  const { equity, cash, pos, unrealized, onOrder, resetPaper } = useAccountStore();
  
  // Configuración de riesgo
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV || "development";
  const riskConfig = getRiskConfig(vercelEnv, appMode);
  
  console.log('[TradingManualView] Account state:', { lastClose, equity, cash, pos, unrealized, riskConfig });

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
    { symbol: 'BTCUSDT', price: lastClose || 0, change: '+2.5%', changeColor: 'text-green-500' },
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
      
      // Validar que data sea un array
      if (Array.isArray(data)) {
        setCandles(data);
      } else {
        console.error('Data is not an array:', data);
        setCandles([]);
        setMsg('ERROR: Datos de velas no válidos');
      }
    } catch (e:any) {
      console.error('Error fetching candles:', e);
      setCandles([]);
      setMsg(`ERROR klines: ${e?.message||e}`);
    } finally {
      setLoading(false);
    }
  }, [appMode, selectedSymbol, selectedTimeframe]);

  useEffect(() => { fetchCandles(); }, [appMode, selectedSymbol, selectedTimeframe]);

  // Listener para órdenes desde el chart
  useEffect(() => {
    const handleOrder = (e: Event) => {
      const { side, symbol, price, qty } = (e as CustomEvent).detail;
      console.log('[TradingManualView] Order received:', { side, symbol, price, qty, equity });
      
      // Validar precio
      if (!price || !isFinite(price)) {
        console.error('[TradingManualView] Invalid price:', price);
        setMsg(`ERROR: Precio inválido: ${price}`);
        return;
      }
      
      // Validar símbolo
      if (!validateSymbol(symbol)) {
        console.error('[TradingManualView] Invalid symbol:', symbol);
        setMsg(`ERROR: Símbolo ${symbol} no permitido`);
        return;
      }
      
      // Validar cantidad por riesgo usando la configuración dinámica
      const maxQty = maxQtyByRisk(equity, price, riskConfig.allowedPct);
      const riskValidation = ensureQtyWithinRisk(qty, equity, price, riskConfig.allowedPct);
      console.log('[TradingManualView] Risk validation:', { 
        riskValidation, 
        maxQty, 
        allowedPct: riskConfig.allowedPct,
        isConfigurable: riskConfig.isConfigurable 
      });
      if (!riskValidation.success) {
        console.error('[TradingManualView] Risk validation failed:', riskValidation.error);
        setMsg(`RIESGO: ${riskValidation.error} (Máximo: ${riskValidation.maxQty.toFixed(6)} - ${(riskConfig.allowedPct * 100).toFixed(0)}%)`);
        return;
      }
      
      // Ejecutar orden en paper mode
      try {
        console.log('[TradingManualView] Executing paper trade:', { side, qty, price, symbol });
        onOrder(side, symbol, price, qty);
        
        // Disparar evento de ejecución exitosa para markers
        window.dispatchEvent(new CustomEvent("qt:order:executed", {
          detail: { 
            side, 
            symbol, 
            price, 
            qty, 
            ts: Date.now() 
          }
        }));
        
        setMsg(`PAPER ${side.toUpperCase()} ${qty} @ ${fmt(price)} (desde chart)`);
      } catch (error: any) {
        console.error('[TradingManualView] Paper trade error:', error);
        setMsg(`ERROR: ${error?.message || error}`);
      }
    };
    
    window.addEventListener("qt:order", handleOrder as EventListener);
    return () => window.removeEventListener("qt:order", handleOrder as EventListener);
  }, [equity, onOrder]);

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
    return getRiskStatus(equity, lastClose, Number(qty), riskConfig.allowedPct);
  }, [equity, lastClose, qty, riskConfig.allowedPct]);

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

      // 3. Calcular riesgo y validar límites usando configuración dinámica
      const maxQty = maxQtyByRisk(equity, currentPrice, riskConfig.allowedPct);
      
      const riskValidation = ensureQtyWithinRisk(orderQty, equity, currentPrice, riskConfig.allowedPct);
      if (!riskValidation.success) {
        setMsg(`RIESGO: ${riskValidation.error} (Máximo: ${riskValidation.maxQty.toFixed(6)} - ${(riskConfig.allowedPct * 100).toFixed(0)}%)`);
        return;
      }

      // 4. Obtener estado de riesgo para feedback
      const currentRiskStatus = getRiskStatus(equity, currentPrice, orderQty, riskConfig.allowedPct);

      // Disparar evento para el chart con precio actual y niveles TP/SL
      const tp = takeProfit > 0 ? takeProfit : undefined;
      const sl = stopLoss > 0 ? stopLoss : undefined;
      
      window.dispatchEvent(new CustomEvent("qt:order", {
        detail: { side, symbol: selectedSymbol, price: currentPrice, qty: orderQty }
      }));

      // 5. Ejecutar orden
      if (!canReal) {
        // Paper
        onOrder(side, selectedSymbol, currentPrice, orderQty);
        
        // Disparar evento de ejecución exitosa para markers
        window.dispatchEvent(new CustomEvent("qt:order:executed", {
          detail: { 
            side, 
            symbol: selectedSymbol, 
            price: currentPrice, 
            qty: orderQty, 
            ts: Date.now() 
          }
        }));
        
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

  // Opciones para el dropdown de modo
  const modeOptions = [
    { value: 'demo-full', label: 'Demo Full' },
    { value: 'demo-hybrid', label: 'Demo Híbrido' },
    { value: 'live-trading', label: 'Live Trading' }
  ];

  const getModeValue = (mode: AppMode) => {
    switch (mode) {
      case 'demo-full': return 'demo-full';
      case 'demo-hybrid': return 'demo-hybrid';
      case 'live-trading': return 'live-trading';
      default: return 'demo-hybrid';
    }
  };

  const handleModeChange = (value: string) => {
    setAppMode(value as AppMode);
  };

  return (
    <div className="px-4 py-3">
      {/* Paneles de información compactos arriba del gráfico */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Información de la posición actual */}
        <Card className="bg-neutral-900 border-neutral-700 p-3">
          <h3 className="text-sm font-semibold text-white mb-2">Estado de Trading</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Precio Actual</span>
              <span className="text-white font-semibold">{fmt(lastClose)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Equity</span>
              <span className="text-white font-semibold">{fmt(equity)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">P&L No Realizado</span>
              <span className={`font-semibold ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fmt(unrealized)}
              </span>
            </div>
          </div>
        </Card>

        {/* Estado de riesgo */}
        <Card className="bg-neutral-900 border-neutral-700 p-3">
          <h3 className="text-sm font-semibold text-white mb-2">Gestión de Riesgo</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
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
        <Card className="bg-neutral-900 border-neutral-700 p-3">
          <h3 className="text-sm font-semibold text-white mb-2">Posiciones</h3>
          {pos ? (
            <div className="space-y-2">
              <div className="bg-neutral-800 p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-white">{pos.qty > 0 ? 'LONG' : 'SHORT'}</span>
                  <span className="text-white">{pos.qty}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Entry: {fmt(pos.avg)} | P&L: <span className={unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmt(unrealized)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-xs">Sin posiciones abiertas</div>
          )}
          
          {msg && (
            <div className="mt-2 p-2 bg-neutral-800 rounded text-xs text-gray-300">
              {msg}
            </div>
          )}
          
          <div className="mt-2 flex gap-2">
            <button
              onClick={resetPaper}
              className="flex-1 px-2 py-1 bg-neutral-700 text-white rounded hover:bg-neutral-600 text-xs"
            >
              Reset Paper
            </button>
            <button
              onClick={() => {
                const key = `${selectedSymbol}:${selectedTimeframe}`;
                useTradeMarkers.getState().clear(key);
                // Re-pintar markers vacíos
                const chartElement = document.querySelector('[data-chart="price"]');
                if (chartElement) {
                  // Disparar evento para re-pintar markers
                  window.dispatchEvent(new CustomEvent("qt:markers:cleared", { detail: { key } }));
                }
              }}
              className="px-2 py-1 bg-neutral-800 border border-white/10 text-gray-200 rounded hover:bg-neutral-700 text-xs"
            >
              Clear Trades
            </button>
          </div>
        </Card>

        {/* Account Info Card */}
        <AccountInfoCard />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* área de gráfico toma 12 o 9/10 columnas según sidebar */}
        <div className={rightOpen ? "col-span-12 xl:col-span-9 2xl:col-span-10" : "col-span-12"}>
          {/* Panel de ejecución sticky encima del gráfico */}
          <div className="sticky top-[64px] z-20 bg-[#0b0b0b]/85 backdrop-blur supports-[backdrop-filter]:bg-[#0b0b0b]/60 border-b border-white/5">
            <ExecutionPanel />
          </div>
          <ChartArea />
        </div>
        {/* sidebar derecha */}
        <div className="hidden xl:block xl:col-span-3 2xl:col-span-2">
          <RightSidebar />
        </div>
      </div>

      {/* Panel de IA Coach */}
      <div className="mt-6">
        <IACoachPanel 
          candles={candles || []}
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