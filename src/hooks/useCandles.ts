import { useState, useEffect } from 'react';
import { useEnvironment } from './useEnvironment';

// Tipos para los datos de velas
export interface CandleData {
  t: number;    // timestamp
  o: number;    // open
  h: number;    // high
  l: number;    // low
  c: number;    // close
  v: number;    // volume
}

// Función para obtener datos iniciales (mock o live)
const getInitialCandles = async (mode: string, symbol: string, timeframe: string) => {
  if (mode === 'mock') {
    // Datos mock
    return generateMockCandles(symbol, timeframe);
  } else {
    // Datos live (placeholder para futura implementación)
    // const liveData = await fetchLiveCandles(symbol, timeframe);
    // return liveData;
    
    // Por ahora, usar mock incluso en modo live
    return generateMockCandles(symbol, timeframe);
  }
};

// Hook para obtener datos de velas (mock o live según ENV)
export function useCandles() {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { dataMode, viteSymbol, viteTimeframe } = useEnvironment();

  useEffect(() => {

    const fetchCandles = async () => {
      try {
        setLoading(true);
        setError(null);

        // después de resolver datos iniciales:
        getInitialCandles(dataMode, viteSymbol, viteTimeframe)
          .then(c => { 
            console.info('[DATA MODE]', dataMode, '• candles:', c.length); 
            setData(c); 
          })
          .catch(e => { 
            console.warn('[DATA ERROR]', e); 
            setError(e as Error); 
          })
          .finally(() => setLoading(false));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setData([]);
        setLoading(false);
      }
    };

    fetchCandles();
  }, [dataMode, viteSymbol, viteTimeframe]);

  // Refresco automático cada cierre de vela en modo live
  useEffect(() => {
    if (dataMode !== 'live') return;
    
    const tfMs = getIntervalMs(viteTimeframe);
    const id = window.setInterval(async () => {
      try {
        const fresh = await getInitialCandles('live', viteSymbol, viteTimeframe);
        console.info('[DATA REFRESH] live • candles:', fresh.length);
        setData(fresh);
      } catch (e) { 
        console.warn('[DATA REFRESH ERROR]', e); 
      }
    }, tfMs); // 1m => 60s
    
    return () => clearInterval(id);
  }, [dataMode, viteSymbol, viteTimeframe]);

  return { data, loading, error, symbol: viteSymbol, timeframe: viteTimeframe };
}

// Función para generar datos mock de velas
function generateMockCandles(symbol: string, timeframe: string): CandleData[] {
  const now = Date.now();
  const intervalMs = getIntervalMs(timeframe);
  const candles: CandleData[] = [];
  
  // Precio base según el símbolo
  const basePrice = getBasePrice(symbol);
  
  for (let i = 100; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02; // ±1% variación
    const open = price;
    const close = price + (Math.random() - 0.5) * basePrice * 0.01;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
    const volume = 1000 + Math.random() * 5000;
    
    candles.push({
      t: timestamp,
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume
    });
  }
  
  return candles;
}

// Función auxiliar para obtener el intervalo en milisegundos
function getIntervalMs(timeframe: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return intervals[timeframe] || intervals['1m'];
}

// Función auxiliar para obtener precio base según símbolo
function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3000,
    'ADAUSDT': 0.5,
    'SOLUSDT': 100,
    'DOTUSDT': 7,
    'LINKUSDT': 15,
  };
  return prices[symbol] || 100;
}
