import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../stores/market';
import { usePriceFeed } from '../hooks/usePriceFeed';
import { useAccountStore } from '../stores/account';
import { getAllowedRiskPct, getRiskConfig } from '../config/risk';
import { maxQtyByRisk, clampQtyToMax } from '../lib/risk';
import Tip from './ui/Tip';
import { GLOSS } from '../content/glossary';
import QtyHelp from './help/QtyHelp';
import SLHelp from './help/SLHelp';
import TPHelp from './help/TPHelp';

export default function ExecutionPanel() {
  const symbol = useMarketStore(s => s.symbol);
  const interval = useMarketStore(s => s.interval);
  const { candles } = usePriceFeed(symbol, interval);
  const { equity } = useAccountStore();
  
  // Configuración de riesgo
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV || "development";
  const appMode = "demo_hibrido"; // TODO: obtener del estado de la app
  const riskConfig = getRiskConfig(vercelEnv, appMode);
  
  // Estado de cantidad
  const [qty, setQty] = useState<number>(0.001);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  // Calcular cantidad máxima permitida
  const currentPrice = candles && candles.length > 0 && candles[candles.length - 1]?.c;
  const maxQty = currentPrice && equity > 0 ? maxQtyByRisk(equity, currentPrice, riskConfig.allowedPct) : 0;
  
  // Auto-ajustar cantidad cuando cambie el precio o equity
  useEffect(() => {
    if (maxQty > 0) {
      setQty(prev => clampQtyToMax(prev, maxQty));
    }
  }, [maxQty]);

  const handleOrder = (side: 'buy' | 'sell') => {
    const quantity = qty;
    if (quantity <= 0) {
      console.error('Invalid quantity:', quantity);
      return;
    }

    // Obtener el precio actual de la última vela
    if (!currentPrice || !isFinite(currentPrice)) {
      console.error('No valid price available for order. Candles:', candles?.length, 'Last candle:', candles?.[candles.length - 1]);
      return;
    }

    // Confirmación para límites de riesgo elevados (solo Demo/Preview)
    const needsConfirm = riskConfig.allowedPct > 0.05 && vercelEnv !== "production";
    if (needsConfirm) {
      const ok = window.confirm(
        `Estás usando un límite de riesgo del ${(riskConfig.allowedPct * 100).toFixed(0)}% para fines EDUCATIVOS (paper/testnet).\n` +
        `Máx Qty calculado: ${maxQty.toFixed(6)}\n` +
        `Cantidad solicitada: ${quantity.toFixed(6)}\n` +
        `¿Deseas continuar?`
      );
      if (!ok) return;
      
      // Log de auditoría (opcional)
      console.log('[ExecutionPanel] High risk order confirmed:', {
        side,
        symbol,
        quantity,
        riskPct: riskConfig.allowedPct,
        maxQty,
        timestamp: new Date().toISOString()
      });
    }

    const orderData = {
      side,
      symbol,
      price: currentPrice,
      qty: quantity,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    };

    console.log('[ExecutionPanel] Dispatching order:', orderData);
    window.dispatchEvent(new CustomEvent("qt:order", { detail: orderData }));
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        {/* Quantity Input with Risk Management */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-200">
            Qty
            <Tip label={`${GLOSS.qty}\n\nMáx (${(riskConfig.allowedPct * 100).toFixed(0)}%): ${maxQty.toFixed(6)}`}>
              <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-sky-600 text-white text-[10px]">i</span>
            </Tip>
          </label>
          <input
            type="number"
            min="0"
            step="0.000001"
            value={qty}
            onChange={(e) => setQty(clampQtyToMax(+e.target.value || 0, maxQty))}
            className="w-20 bg-neutral-800 text-gray-100 px-2 py-1 rounded text-xs outline-none border border-white/10"
            placeholder="0.001"
          />
          
          {/* Quick percentage buttons */}
          <div className="flex gap-1">
            <button 
              onClick={() => setQty(+((maxQty * 0.25).toFixed(6)))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              25%
            </button>
            <button 
              onClick={() => setQty(+((maxQty * 0.5).toFixed(6)))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              50%
            </button>
            <button 
              onClick={() => setQty(+((maxQty * 1.0).toFixed(6)))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              100%
            </button>
            <button 
              onClick={() => setQty(maxQty)}
              className="px-2 py-1 rounded text-xs bg-neutral-800 border border-white/10 text-gray-200 hover:bg-neutral-700"
            >
              Set Max ({(riskConfig.allowedPct * 100).toFixed(0)}%)
            </button>
          </div>
        </div>

        {/* Stop Loss */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            SL: <SLHelp />
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-16 bg-neutral-800 text-gray-100 px-2 py-1 rounded text-xs outline-none border border-white/10"
            placeholder="SL"
          />
        </div>

        {/* Take Profit */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            TP: <TPHelp />
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-16 bg-neutral-800 text-gray-100 px-2 py-1 rounded text-xs outline-none border border-white/10"
            placeholder="TP"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Tip label={GLOSS.buy}>
            <button
              onClick={() => handleOrder('buy')}
              className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              BUY
            </button>
          </Tip>
          <Tip label={GLOSS.sell}>
            <button
              onClick={() => handleOrder('sell')}
              className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
            >
              SELL
            </button>
          </Tip>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setQty('0.001')}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.001
          </button>
          <button
            onClick={() => setQty('0.01')}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.01
          </button>
          <button
            onClick={() => setQty('0.1')}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.1
          </button>
        </div>
      </div>
    </div>
  );
}
