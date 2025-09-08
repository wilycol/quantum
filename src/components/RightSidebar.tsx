import { useUiStore } from "../stores/ui";
import { useMarketStore } from "../stores/market";
import { useMarketWatch } from "../hooks/useMarketWatch";

const SYMBOLS = ["BTCUSDT","ETHUSDT","BNBUSDT","ADAUSDT","SOLUSDT"];
const TFS = ["1m","5m","15m","1h","4h","1d"];

export default function RightSidebar() {
  const { rightOpen, toggleRight } = useUiStore();
  const symbol = useMarketStore(s=>s.symbol);
  const setSymbol = useMarketStore(s=>s.setSymbol);
  const interval = useMarketStore(s=>s.interval);
  const setInterval = useMarketStore(s=>s.setInterval);
  const marketData = useMarketWatch();

  // Helper para formatear precios
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <aside className={`transition-all duration-300 ${rightOpen? "w-80" : "w-0"} overflow-hidden`}>
      <div className="sticky top-2 space-y-3 p-2">
        <button onClick={toggleRight} className="w-full px-3 py-2 rounded-md bg-neutral-800 text-gray-200 border border-white/10">
          {rightOpen ? "Ocultar panel" : "Mostrar panel"}
        </button>

        {/* Market Watch - desplegable simple */}
        <details open className="bg-neutral-900 border border-white/10 rounded-xl">
          <summary className="cursor-pointer px-3 py-2 text-gray-100">Market Watch</summary>
          <ul className="p-2 space-y-1">
            {marketData.map(item => (
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
        </details>

        {/* Timeframes */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-2">
          <div className="grid grid-cols-6 gap-2">
            {TFS.map(tf => (
              <button key={tf} onClick={()=> setInterval(tf)}
                className={`px-2 py-1 rounded-md border text-xs ${tf===interval? "bg-sky-600 text-white" : "bg-neutral-800 text-gray-200 border-white/10"}`}>
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Controles de ejecución (botones dentro del panel) */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-3 space-y-2">
          <div className="text-gray-200 text-sm">Execution</div>
          <div className="flex items-center gap-2">
            <input id="execQty" type="number" min="0" step="0.000001"
              className="w-28 bg-neutral-800 text-gray-100 px-2 py-1 rounded-md outline-none border border-white/10"
              placeholder="qty" />
            <button className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs"
              onClick={()=>{
                const qty = +((document.getElementById("execQty") as HTMLInputElement)?.value || 0);
                window.dispatchEvent(new CustomEvent("qt:order", { detail: { side:"buy", symbol, qty } }));
              }}>BUY</button>
            <button className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs"
              onClick={()=>{
                const qty = +((document.getElementById("execQty") as HTMLInputElement)?.value || 0);
                window.dispatchEvent(new CustomEvent("qt:order", { detail: { side:"sell", symbol, qty } }));
              }}>SELL</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
