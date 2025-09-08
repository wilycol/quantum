import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../stores/market';
import { usePriceFeed } from '../hooks/usePriceFeed';
import { useAccountStore } from '../stores/account';
import { getAllowedRiskPct, getRiskConfig } from '../config/risk';
import { maxQtyByRisk, clampQtyToMax } from '../lib/risk';
import { toNum, fmt } from '../lib/num';
import { useToast } from './ui/Toast';
import { validateTPSL } from '../utils/riskRules';
import RRBadge from './RRBadge';
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
  const { toast, ToastContainer } = useToast();
  
  // Configuración de riesgo con coerción numérica segura
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV || "development";
  const appMode = "demo_hibrido"; // TODO: obtener del estado de la app
  const riskConfig = getRiskConfig(vercelEnv, appMode);
  
  // Estado de cantidad (siempre numérico)
  const [qty, setQty] = useState<number>(0.001);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  
  // Calcular cantidad máxima permitida (siempre numérico)
  const equityNum = toNum(equity);
  const currentPrice = candles && candles.length > 0 && candles[candles.length - 1]?.c;
  const lastPrice = toNum(currentPrice);
  const maxQty = maxQtyByRisk(equityNum, lastPrice, riskConfig.allowedPct);
  
  // Auto-ajustar cantidad cuando cambie el precio o equity
  useEffect(() => {
    if (Number.isFinite(maxQty) && maxQty > 0) {
      setQty(prev => clampQtyToMax(toNum(prev), maxQty));
    }
  }, [equityNum, lastPrice, riskConfig.allowedPct]);
  
  // Actualizar precio de entrada cuando cambie el precio actual
  useEffect(() => {
    if (Number.isFinite(lastPrice) && lastPrice > 0) {
      setEntryPrice(lastPrice);
    }
  }, [lastPrice]);
  
  // Validaciones para botones blindados
  const qtyInvalid = !Number.isFinite(qty) || qty <= 0;
  const overMax = qty > maxQty;
  
  // Validaciones TP/SL
  const slNum = toNum(stopLoss);
  const tpNum = toNum(takeProfit);
  const entryNum = toNum(entryPrice);
  
  // Determinar lado de la operación (asumimos long por defecto, se puede mejorar)
  const side = 'long' as const;
  
  // Validar TP/SL si están definidos
  const tpSlValidation = (slNum > 0 && tpNum > 0 && entryNum > 0) 
    ? validateTPSL({ side, entry: entryNum, tp: tpNum, sl: slNum, price: lastPrice })
    : { ok: true };

  const handleOrder = async (side: 'buy' | 'sell') => {
    // Validaciones blindadas
    if (qtyInvalid) {
      toast("Cantidad inválida", 'error');
      return;
    }
    
    if (overMax) {
      toast(`Qty > Máx (${fmt(maxQty, 6)}) por el límite de riesgo`, 'error');
      return;
    }

    // Obtener el precio actual de la última vela
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
      toast("Precio no disponible", 'error');
      return;
    }
    
    // Validar TP/SL si están definidos
    if (!tpSlValidation.ok) {
      if (tpSlValidation.error) {
        toast(tpSlValidation.error, 'error');
      } else if (tpSlValidation.warn) {
        toast(tpSlValidation.warn, 'warning');
      }
      return;
    }

    // Confirmación para límites de riesgo elevados (solo Demo/Preview)
    const needsConfirm = riskConfig.allowedPct > 0.05 && vercelEnv !== "production";
    if (needsConfirm) {
      const ok = window.confirm(
        `Estás usando un límite de riesgo del ${Math.round(riskConfig.allowedPct * 100)}% para fines EDUCATIVOS (paper/testnet).\n` +
        `Máx Qty calculado: ${fmt(maxQty, 6)}\n` +
        `Cantidad solicitada: ${fmt(qty, 6)}\n` +
        `¿Deseas continuar?`
      );
      if (!ok) return;
      
      // Log de auditoría (opcional)
      console.log('[ExecutionPanel] High risk order confirmed:', {
        side,
        symbol,
        quantity: qty,
        riskPct: riskConfig.allowedPct,
        maxQty,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const orderData = {
        side,
        symbol,
        price: lastPrice,
        qty,
        stopLoss: stopLoss ? toNum(stopLoss) : undefined,
        takeProfit: takeProfit ? toNum(takeProfit) : undefined
      };

      console.log('[ExecutionPanel] Dispatching order:', orderData);
      window.dispatchEvent(new CustomEvent("qt:order", { detail: orderData }));
      
      // Disparar evento de ejecución exitosa para markers
      window.dispatchEvent(new CustomEvent("qt:order:executed", {
        detail: { 
          side, 
          symbol, 
          price: lastPrice, 
          qty, 
          ts: Date.now() 
        }
      }));
      
      toast(`${side.toUpperCase()} enviado: ${fmt(qty, 6)}`, 'success');
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("risk_limit_exceeded")) {
        const m = /risk_limit_exceeded:.*>([\d.]+)/.exec(msg);
        const lim = m ? m[1] : fmt(maxQty, 6);
        toast(`Bloqueado por riesgo. Máx: ${lim}`, 'error');
      } else {
        toast(`Error: ${msg}`, 'error');
      }
    }
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        {/* Quantity Input with Risk Management */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-200">
            Qty
            <Tip label={`${GLOSS.qty}\n\nMáx (${Math.round(riskConfig.allowedPct * 100)}%): ${fmt(maxQty, 6)}`}>
              <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-sky-600 text-white text-[10px]">i</span>
            </Tip>
          </label>
          <input
            type="number"
            min="0"
            step="0.000001"
            value={Number.isFinite(qty) ? qty : 0}
            onChange={(e) => setQty(clampQtyToMax(toNum(e.target.value), maxQty))}
            className="w-20 bg-neutral-800 text-gray-100 px-2 py-1 rounded text-xs outline-none border border-white/10"
            placeholder="0.001"
          />
          
          {/* Quick percentage buttons */}
          <div className="flex gap-1">
            <button 
              onClick={() => setQty(+(maxQty * 0.25).toPrecision(8))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              25%
            </button>
            <button 
              onClick={() => setQty(+(maxQty * 0.50).toPrecision(8))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              50%
            </button>
            <button 
              onClick={() => setQty(+(maxQty * 1.00).toPrecision(8))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              100%
            </button>
            <button 
              onClick={() => setQty(maxQty)}
              className="px-2 py-1 rounded text-xs bg-neutral-800 border border-white/10 text-gray-200 hover:bg-neutral-700"
            >
              Set Max ({Math.round(riskConfig.allowedPct * 100)}%)
            </button>
          </div>
        </div>

        {/* Stop Loss with Quick Chips */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-200">
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
          <div className="flex gap-1">
            <button 
              onClick={() => setStopLoss((entryNum - lastPrice * 0.005).toFixed(2))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              −0.5%
            </button>
            <button 
              onClick={() => setStopLoss((entryNum - lastPrice * 0.010).toFixed(2))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              −1%
            </button>
          </div>
        </div>

        {/* Take Profit with Quick Chips */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-200">
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
          <div className="flex gap-1">
            <button 
              onClick={() => setTakeProfit((entryNum + lastPrice * 0.010).toFixed(2))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              +1%
            </button>
            <button 
              onClick={() => setTakeProfit((entryNum + lastPrice * 0.020).toFixed(2))}
              className="px-2 py-1 rounded text-xs bg-neutral-700 text-gray-300 hover:bg-neutral-600 border border-white/10"
            >
              +2%
            </button>
          </div>
        </div>

        {/* R:R Badge */}
        {slNum > 0 && tpNum > 0 && entryNum > 0 && (
          <div className="flex items-center">
            <RRBadge 
              side={side} 
              entry={entryNum} 
              tp={tpNum} 
              sl={slNum}
              className="bg-neutral-800 border border-white/10"
            />
          </div>
        )}

        {/* Action Buttons - Blindados */}
        <div className="flex items-center gap-2">
          <Tip label={GLOSS.buy}>
            <button
              disabled={qtyInvalid || overMax}
              onClick={() => handleOrder('buy')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                qtyInvalid || overMax 
                  ? 'bg-neutral-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              BUY
            </button>
          </Tip>
          <Tip label={GLOSS.sell}>
            <button
              disabled={qtyInvalid || overMax}
              onClick={() => handleOrder('sell')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                qtyInvalid || overMax 
                  ? 'bg-neutral-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              SELL
            </button>
          </Tip>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setQty(clampQtyToMax(0.001, maxQty))}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.001
          </button>
          <button
            onClick={() => setQty(clampQtyToMax(0.01, maxQty))}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.01
          </button>
          <button
            onClick={() => setQty(clampQtyToMax(0.1, maxQty))}
            className="px-2 py-1 rounded bg-neutral-700 text-gray-300 text-xs hover:bg-neutral-600 transition-colors"
          >
            0.1
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
