import { useEffect, useState } from 'react';
import { fetchKlines, genSimCandles, Candle } from '../lib/fetchKlines';

export default function PriceChart() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const DATA_MODE = import.meta.env.VITE_DATA_MODE ?? 'live';
  const symbol = 'BTCUSDT';
  const interval = '1m';

  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        if (DATA_MODE === 'live') {
          const ks = await fetchKlines(symbol, interval, 500);
          setCandles(ks);
        } else {
          setCandles(genSimCandles(500));
        }
      } catch (e) {
        console.error('[KLINES]', e);
      }
    };
    load();
    if (DATA_MODE === 'live') {
      timer = setInterval(load, 60_000);
    }
    return () => clearInterval(timer);
  }, [DATA_MODE]);

  if (!candles.length) return <div>Chart aquí (cargando velas)…</div>;
  return <div>Chart aquí (usa candles del estado) - {candles.length} velas cargadas</div>; // usa el componente que ya tengas
}
