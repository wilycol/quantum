import { usePriceFeed } from "../hooks/usePriceFeed";

export default function PriceChart() {
  const { candles, loading, error, mode } = usePriceFeed("BTCUSDT","1m");

  if (loading) return <div>Chart aquí (cargando velas)…</div>;
  if (!candles.length) return <div>⚠️ Sin velas (modo {mode})</div>;

  // Si tu lib de chart necesita otro shape, adapta aquí:
  return <div>Chart aquí (usa candles del estado) - {candles.length} velas cargadas (modo: {mode})</div>;
}
