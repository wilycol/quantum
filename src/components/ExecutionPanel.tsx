import React, { useState } from 'react';
import { useMarketStore } from '../stores/market';
import Tip from './ui/Tip';
import { GLOSS } from '../content/glossary';
import QtyHelp from './help/QtyHelp';
import SLHelp from './help/SLHelp';
import TPHelp from './help/TPHelp';

export default function ExecutionPanel() {
  const symbol = useMarketStore(s => s.symbol);
  const [qty, setQty] = useState('0.001');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleOrder = (side: 'buy' | 'sell') => {
    const quantity = parseFloat(qty) || 0;
    if (quantity <= 0) return;

    const orderData = {
      side,
      symbol,
      qty: quantity,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    };

    window.dispatchEvent(new CustomEvent("qt:order", { detail: orderData }));
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        {/* Quantity Input */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            Qty: <QtyHelp />
          </label>
          <input
            type="number"
            min="0"
            step="0.000001"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20 bg-neutral-800 text-gray-100 px-2 py-1 rounded text-xs outline-none border border-white/10"
            placeholder="0.001"
          />
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
