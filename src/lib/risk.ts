import { COMPLIANCE_CONFIG } from "../constants/compliance";

export function maxQtyByRisk(
  equityUSD: number,
  priceUSD: number,
  maxPct: number = COMPLIANCE_CONFIG.MAX_RISK_PERCENTAGE // 5%
) {
  if (equityUSD <= 0 || priceUSD <= 0 || maxPct <= 0) return 0;
  const maxUSD = equityUSD * maxPct;
  return +(maxUSD / priceUSD).toFixed(6);
}

export function clampQtyToMax(qty: number, maxQty: number) {
  return qty > maxQty ? maxQty : qty;
}

export function assertQtyWithinRisk(qty: number, maxQty: number) {
  if (qty > maxQty) {
    throw new Error(`risk_limit_exceeded:${qty}>${maxQty}`);
  }
}

export function getRiskStatus(equityUSD: number, priceUSD: number, qty: number, maxPct: number = COMPLIANCE_CONFIG.MAX_RISK_PERCENTAGE) {
  const maxQty = maxQtyByRisk(equityUSD, priceUSD, maxPct);
  const isWithinRisk = qty <= maxQty;
  const riskPercentage = equityUSD > 0 ? (qty * priceUSD / equityUSD) * 100 : 0;
  
  return {
    isWithinRisk,
    maxQty,
    riskPercentage: +riskPercentage.toFixed(2),
    maxRiskPercentage: maxPct * 100
  };
}

export function validateSymbol(symbol: string): boolean {
  return COMPLIANCE_CONFIG.ALLOWED_SYMBOLS.includes(symbol);
}

export function ensureQtyWithinRisk(
  qty: number, 
  equityUSD: number, 
  priceUSD: number,
  maxPct: number = COMPLIANCE_CONFIG.MAX_RISK_PERCENTAGE
): { success: boolean; maxQty: number; error?: string } {
  try {
    const maxQty = maxQtyByRisk(equityUSD, priceUSD, maxPct);
    assertQtyWithinRisk(qty, maxQty);
    return { success: true, maxQty };
  } catch (error: any) {
    return { 
      success: false, 
      maxQty: maxQtyByRisk(equityUSD, priceUSD, maxPct),
      error: error.message 
    };
  }
}