import { useEffect, useState } from "react";
import { fetchKlines, genSimCandles, Candle } from "../lib/klines";

export function usePriceFeed(symbol="BTCUSDT", interval="1m") {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const DATA_MODE = import.meta.env.VITE_DATA_MODE ?? "live";

  useEffect(() => {
    let timer:any;
    const load = async () => {
      try {
        if (DATA_MODE === "live") {
          const ks = await fetchKlines(symbol, interval, 500);
          setCandles(ks);
        } else {
          setCandles(genSimCandles(500));
        }
        setError(null);
      } catch (e:any) {
        console.error("[KLINES] fetch error:", e?.message || e);
        setError(String(e?.message || e));
        setCandles(genSimCandles(500)); // no dejar vacío
      } finally {
        setLoading(false);
      }
    };
    load();
    if (DATA_MODE === "live") timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [symbol, interval, DATA_MODE]);

  return { candles, loading, error, mode: DATA_MODE };
}
