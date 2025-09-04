import { Tick } from './types';
import { ensureArray } from '../../lib/ensureArray';

/**
 * Calcula el RSI (Relative Strength Index)
 * @param closes Array de precios de cierre
 * @param period Período para el cálculo (default: 14)
 * @returns Valor RSI entre 0-100 o null si no hay suficientes datos
 */
export function rsi(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  // Calcular ganancias y pérdidas iniciales
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calcular RSI inicial
  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));

  // Calcular RSI para el resto de los datos
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    let currentGain = 0;
    let currentLoss = 0;

    if (change > 0) {
      currentGain = change;
    } else {
      currentLoss = Math.abs(change);
    }

    // Promedio móvil exponencial
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
  }

  return Math.round(rsi * 100) / 100;
}

/**
 * Genera señal de trading basada en RSI y tendencia
 * @param closes Array de precios de cierre
 * @returns Señal: 'buy', 'sell', o 'hold'
 */
export function getSignal(closes: number[]): 'buy' | 'sell' | 'hold' {
  const rsiValue = rsi(closes);
  
  if (rsiValue === null) {
    return 'hold';
  }

  // Señales basadas en RSI
  if (rsiValue <= 30) {
    return 'buy'; // Sobreventa
  } else if (rsiValue >= 70) {
    return 'sell'; // Sobrecompra
  }

  // Análisis de tendencia simple
  if (closes.length >= 20) {
    const shortTerm = ensureArray(closes.slice(-5)).reduce((a, b) => a + (b ?? 0), 0) / 5;
    const longTerm = ensureArray(closes.slice(-20)).reduce((a, b) => a + (b ?? 0), 0) / 20;
    
    if (shortTerm > longTerm * 1.02) {
      return 'sell'; // Tendencia alcista fuerte
    } else if (shortTerm < longTerm * 0.98) {
      return 'buy'; // Tendencia bajista fuerte
    }
  }

  return 'hold';
}
