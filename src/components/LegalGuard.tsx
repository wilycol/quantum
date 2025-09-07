import { useEffect, useState } from "react";
import { LEGAL_DISCLAIMER, PRIVACY_NOTE, COMPLIANCE_CONFIG } from "../constants/compliance";
import { MainView } from "../types";

const KEY = `qt:legalAccepted:${COMPLIANCE_CONFIG.LEGAL_VERSION}`;

interface LegalGuardProps {
  onNavigateToLegal?: () => void;
}

export default function LegalGuard({ onNavigateToLegal }: LegalGuardProps) {
  const [ok, setOk] = useState(() => localStorage.getItem(KEY) === "1");

  useEffect(() => {
    if (!ok) {
      document.body.style.overflow = "hidden";
    }
    return () => { 
      document.body.style.overflow = ""; 
    };
  }, [ok]);

  if (ok) return null;

  const handleAccept = () => {
    localStorage.setItem(KEY, "1");
    setOk(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-neutral-900 border border-white/10 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-3">Aviso Legal</h3>
        <p className="text-gray-200 text-sm whitespace-pre-line mb-3">{LEGAL_DISCLAIMER}</p>
        <p className="text-gray-400 text-xs mb-4">{PRIVACY_NOTE}</p>
        <div className="flex gap-2">
          <button
            onClick={onNavigateToLegal}
            className="px-3 py-2 rounded-md bg-neutral-800 text-gray-200 border border-white/10 hover:bg-neutral-700 transition-colors"
          >
            Ver detalles
          </button>
          <button
            onClick={handleAccept}
            className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Acepto y continuar
          </button>
        </div>
      </div>
    </div>
  );
}