import { useEffect, useState } from "react";
import { LEGAL_DISCLAIMER, PRIVACY_NOTE } from "../constants/compliance";

const KEY = "qt:legalAccepted:v1";

export default function LegalGuard() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEY) === "1";
  });

  useEffect(() => { 
    if (!accepted) setOpen(true); 
  }, [accepted]);

  const handleAccept = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  if (accepted) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-neutral-900 border border-white/10 rounded-xl p-5">
        <h3 className="text-white text-lg font-semibold mb-2">⚠️ Aviso Legal</h3>
        <p className="text-gray-200 text-sm whitespace-pre-line mb-3">{LEGAL_DISCLAIMER}</p>
        <p className="text-gray-400 text-xs mb-4">{PRIVACY_NOTE}</p>
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
          <input 
            type="checkbox" 
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)} 
            className="rounded"
          />
          He leído y acepto el aviso legal y los riesgos.
        </label>
        <div className="flex gap-2">
          <button
            disabled={!accepted}
            onClick={handleAccept}
            className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
          >
            Continuar
          </button>
          <a 
            href="/legal" 
            className="px-3 py-2 rounded-md bg-neutral-800 text-gray-200 border border-white/10 hover:bg-neutral-700 transition-colors"
          >
            Ver detalles
          </a>
        </div>
      </div>
    </div>
  );
}
