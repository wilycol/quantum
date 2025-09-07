import { COMPLIANCE_SETTINGS } from "../constants/compliance";

export interface RiskParams {
  equityUSD: number;
  priceUSD: number;
  maxPct?: number;
}

export function maxQtyByRisk({ 
  equityUSD, 
  priceUSD, 
  maxPct = COMPLIANCE_SETTINGS.MAX_RISK_PERCENTAGE 
}: RiskParams): number {
  if (equityUSD <= 0 || priceUSD <= 0) return 0;
  const maxUSD = equityUSD * maxPct;
  return +(maxUSD / priceUSD).toFixed(6);
}

export function ensureQtyWithinRisk(qty: number, maxQty: number): void {
  if (qty > maxQty) {
    throw new Error(`risk_limit_exceeded:${qty}>${maxQty}`);
  }
}

export function validateSymbol(symbol: string): boolean {
  return COMPLIANCE_SETTINGS.ALLOWED_SYMBOLS.includes(symbol);
}

export function validateOrderSize(orderValueUSD: number): boolean {
  return orderValueUSD <= COMPLIANCE_SETTINGS.MAX_ORDER_SIZE_USD;
}

export function validateMinEquity(equityUSD: number): boolean {
  return equityUSD >= COMPLIANCE_SETTINGS.MIN_EQUITY_USD;
}

export function calculateRiskPercentage(qty: number, priceUSD: number, equityUSD: number): number {
  if (equityUSD <= 0) return 0;
  const orderValueUSD = qty * priceUSD;
  return +(orderValueUSD / equityUSD).toFixed(4);
}

export function getRiskStatus(qty: number, priceUSD: number, equityUSD: number): {
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  message: string;
} {
  const percentage = calculateRiskPercentage(qty, priceUSD, equityUSD);
  const maxPct = COMPLIANCE_SETTINGS.MAX_RISK_PERCENTAGE;
  
  if (percentage <= maxPct * 0.5) {
    return {
      percentage,
      status: 'safe',
      message: 'Riesgo bajo'
    };
  } else if (percentage <= maxPct) {
    return {
      percentage,
      status: 'warning',
      message: 'Riesgo moderado'
    };
  } else {
    return {
      percentage,
      status: 'danger',
      message: 'Riesgo alto - Límite excedido'
    };
  }
}
