import Tip from "../ui/Tip";
import { useAccountStore } from "../../stores/account";
import { useMarketStore } from "../../stores/market";
import { usePriceFeed } from "../../hooks/usePriceFeed";
import { maxQtyByRisk } from "../../lib/risk";
import { GLOSS } from "../../content/glossary";

export default function QtyHelp() {
  const equity = useAccountStore(s => s.equity);
  const symbol = useMarketStore(s => s.symbol);
  const { candles } = usePriceFeed(symbol);
  const price = candles && candles.length > 0 ? candles[candles.length - 1].c : 0;
  const maxQty = price > 0 ? maxQtyByRisk(equity, price, 0.05) : 0;
  const text = `${GLOSS.qty}\n\n${GLOSS.qtyMax(maxQty)}`;
  return <Tip label={text}><InfoDot /></Tip>;
}

function InfoDot() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold select-none">i</span>
  );
}
