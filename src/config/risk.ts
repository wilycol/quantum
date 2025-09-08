export const RISK_DEFAULT = 0.05;          // Producción (paper) fijo
export const RISK_PREVIEW_CAP = 0.20;      // Límite duro en Preview
export const RISK_PREVIEW_DEFAULT = 0.10;  // Valor por defecto en Preview/Demo

import { toNum } from "../lib/num";

export function getAllowedRiskPct(opts: { vercelEnv: string; appMode: "demo_full"|"demo_hibrido"|"live" }): number {
  const { vercelEnv, appMode } = opts;
  
  // En producción nunca >5%
  if (vercelEnv === "production") return RISK_DEFAULT;
  
  // En Preview/Demo permitimos subir con tope
  if (appMode === "demo_full" || appMode === "demo_hibrido") {
    const pctEnv = toNum(import.meta.env.VITE_RISK_PCT, NaN);
    const p = Number.isFinite(pctEnv) ? pctEnv : RISK_PREVIEW_DEFAULT;
    return Math.min(Math.max(p, 0.01), RISK_PREVIEW_CAP);
  }
  
  return RISK_DEFAULT;
}

export function getRiskConfig(vercelEnv: string, appMode: string) {
  const allowedPct = getAllowedRiskPct({ vercelEnv, appMode });
  const isProduction = vercelEnv === "production";
  const isConfigurable = !isProduction && (appMode === "demo_full" || appMode === "demo_hibrido");
  
  return {
    allowedPct,
    isProduction,
    isConfigurable,
    maxAllowed: isProduction ? RISK_DEFAULT : RISK_PREVIEW_CAP,
    default: isProduction ? RISK_DEFAULT : RISK_PREVIEW_DEFAULT
  };
}
