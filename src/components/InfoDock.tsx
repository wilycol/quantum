import { useAccountStore } from "@/stores/account";
import { useMarketStore } from "@/stores/market";

export default function InfoDock() {
  const { pos, unrealized } = useAccountStore();
  const symbol = useMarketStore(s => s.symbol);
  const fmt = (n:number,p=2)=> n.toLocaleString(undefined,{minimumFractionDigits:p,maximumFractionDigits:p});

  return (
    <div className="absolute right-3 bottom-3 z-10 bg-neutral-900/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 shadow-md">
      <div className="font-semibold">{symbol}</div>
      <div>PnL: <span className={unrealized>=0?"text-emerald-400":"text-rose-400"}>
        {unrealized>=0? "+": ""}${fmt(unrealized)}
      </span></div>
      {pos && pos.qty !== 0 && (
        <div className="text-[11px] text-gray-400">Pos: {pos.qty} @ {fmt(pos.avg)}</div>
      )}
    </div>
  );
}
