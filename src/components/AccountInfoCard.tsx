import { useAccountStore } from "@/stores/account";

export default function AccountInfoCard() {
  const { equity, cash, pos, unrealized, resetPaper } = useAccountStore();
  const price = pos ? pos.avg : null;
  const fmt = (n: number, p=2) => n.toLocaleString(undefined, { minimumFractionDigits: p, maximumFractionDigits: p });

  return (
    <div className="bg-neutral-900 rounded-xl border border-white/10 p-3">
      <div className="text-gray-200 font-semibold mb-2 text-sm">Account Info</div>
      <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-300">
        <div>Equity</div><div className="text-right">${fmt(equity)}</div>
        <div>Cash</div><div className="text-right">${fmt(cash)}</div>
        <div>Position</div>
        <div className="text-right">
          {pos && pos.qty !== 0 ? `${pos.symbol} • ${pos.qty} @ ${fmt(pos.avg)}` : "—"}
        </div>
        <div>Unrealized PnL</div>
        <div className={`text-right ${unrealized>=0? "text-emerald-400":"text-rose-400"}`}>
          {unrealized>=0? "+" : ""}${fmt(unrealized)}
        </div>
      </div>
      <button
        onClick={resetPaper}
        className="mt-2 w-full px-2 py-1 rounded-md bg-neutral-800 text-gray-200 border border-white/10 hover:bg-neutral-700 text-xs"
      >
        Reset Paper
      </button>
    </div>
  );
}
