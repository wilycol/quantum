// src/app/qcore/components/MiniMarketWatch.tsx
// Mini market watch for active assets only

export type Ticker = { 
  symbol: string; 
  price: number; 
  change24h?: number; 
  selected?: boolean 
};

interface MiniMarketWatchProps {
  items: Ticker[];
  onSelect: (symbol: string) => void;
}

export default function MiniMarketWatch({ items, onSelect }: MiniMarketWatchProps) {
  return (
    <div className="mini-watch bg-gray-800 border border-gray-700 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-white mb-3">Market Watch</h4>
      <div className="space-y-2">
        {items.map(t => (
          <button
            key={t.symbol}
            className={`mini-ticker w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
              t.selected 
                ? 'bg-brand-gold/20 border border-brand-gold/50 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            onClick={() => onSelect(t.symbol)}
            title={`${t.symbol} ${t.price}`}
          >
            <span className="font-medium">{t.symbol}</span>
            <div className="flex items-center space-x-2">
              <span className="text-white">{t.price.toFixed(2)}</span>
              {typeof t.change24h === 'number' && (
                <span className={`text-xs px-1 py-0.5 rounded ${
                  t.change24h >= 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
