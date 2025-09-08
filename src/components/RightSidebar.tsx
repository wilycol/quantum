import { useUiStore } from "../stores/ui";
import { useMarketStore } from "../stores/market";
import { useMarketWatch } from "../hooks/useMarketWatch";
import SymbolSearch from "./SymbolSearch";
import { useState } from "react";
import Tip from "./ui/Tip";
import { GLOSS } from "../content/glossary";

const SYMBOLS = ["BTCUSDT","ETHUSDT","BNBUSDT","ADAUSDT","SOLUSDT"];
const TFS = ["1m","5m","15m","1h","4h","1d"];

export default function RightSidebar() {
  const { rightOpen, toggleRight } = useUiStore();
  const symbol = useMarketStore(s=>s.symbol);
  const setSymbol = useMarketStore(s=>s.setSymbol);
  const interval = useMarketStore(s=>s.interval);
  const setInterval = useMarketStore(s=>s.setInterval);
  const marketData = useMarketWatch();
  
  // Estado para los símbolos seleccionados en el Market Watch
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"
  ]);

  // Helper para formatear precios
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(4)}`;
  };

  // Filtrar marketData para mostrar solo los símbolos seleccionados
  const filteredMarketData = marketData.filter(item => selectedSymbols.includes(item.symbol));

  return (
    <aside className={`transition-all duration-300 ${rightOpen? "w-80" : "w-0"} overflow-hidden`}>
      <div className="sticky top-2 space-y-3 p-2">

        {/* Market Watch - con búsqueda de símbolos */}
        <details open className="bg-neutral-900 border border-white/10 rounded-xl">
          <summary className="cursor-pointer px-3 py-2 text-gray-100">Market Watch</summary>
          <div className="p-2 space-y-3">
            {/* Búsqueda de símbolos */}
            <SymbolSearch
              selectedSymbols={selectedSymbols}
              onSymbolsChange={setSelectedSymbols}
              maxSymbols={5}
            />
            
            {/* Lista de símbolos seleccionados */}
            <ul className="space-y-1">
              {filteredMarketData.map(item => (
                <li key={item.symbol}>
                  <button
                    onClick={()=> setSymbol(item.symbol)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      item.symbol === symbol 
                        ? "bg-yellow-500/10 border border-yellow-500/40 text-yellow-200" 
                        : "bg-neutral-800 text-gray-200 border border-white/10 hover:bg-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.symbol}</span>
                        <span className="text-xs text-gray-400">{formatPrice(item.price)}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${item.changeColor}`}>
                          {item.change}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* Timeframes */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-2">
          <div className="grid grid-cols-6 gap-2">
            {TFS.map(tf => (
              <Tip key={tf} label={GLOSS.timeframe}>
                <button onClick={()=> setInterval(tf)}
                  className={`px-2 py-1 rounded-md border text-xs ${tf===interval? "bg-sky-600 text-white" : "bg-neutral-800 text-gray-200 border-white/10"}`}>
                  {tf}
                </button>
              </Tip>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
