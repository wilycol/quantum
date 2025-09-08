import { useState, useEffect } from 'react';

export interface BinanceSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
}

export function useBinanceSymbols() {
  const [symbols, setSymbols] = useState<BinanceSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymbols = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Usar el endpoint público de Binance para obtener información de exchange
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();
        
        if (data.symbols) {
          // Filtrar solo símbolos USDT que estén activos para trading spot
          const usdtSymbols = data.symbols
            .filter((symbol: any) => 
              symbol.quoteAsset === 'USDT' && 
              symbol.status === 'TRADING' &&
              symbol.isSpotTradingAllowed
            )
            .map((symbol: any) => ({
              symbol: symbol.symbol,
              baseAsset: symbol.baseAsset,
              quoteAsset: symbol.quoteAsset,
              status: symbol.status,
              isSpotTradingAllowed: symbol.isSpotTradingAllowed,
              isMarginTradingAllowed: symbol.isMarginTradingAllowed
            }))
            .sort((a: BinanceSymbol, b: BinanceSymbol) => a.symbol.localeCompare(b.symbol));
          
          setSymbols(usdtSymbols);
        }
      } catch (err) {
        console.error('Error fetching Binance symbols:', err);
        setError('Error al cargar símbolos de Binance');
        
        // Fallback a símbolos populares si falla la API
        setSymbols([
          { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true },
          { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', status: 'TRADING', isSpotTradingAllowed: true, isMarginTradingAllowed: true }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  return { symbols, loading, error };
}
