// src/app/qcore/lib/overlays.ts
// Grid/strike/SLTP helpers for QuantumCore charts

import { IChartApi } from 'lightweight-charts';
import { GridConfig, BinaryConfig } from './types';

export interface SLTPConfig {
  stopLoss?: number;
  takeProfit?: number;
}

// Grid overlay helpers
export function buildGridLines({ lower, upper, size }: { lower: number; upper: number; size: number }): number[] {
  if (!(upper > lower) || size <= 0) return [];
  const step = (upper - lower) / size;
  return Array.from({ length: size + 1 }, (_, i) => lower + i * step);
}

export function createGridOverlay(chart: IChartApi, config: GridConfig): void {
  if (!isValidGridConfig(config)) {
    console.warn('[Overlays] Invalid grid config:', config);
    return;
  }

  const gridLines = buildGridLines(config);
  
  gridLines.forEach((price, i) => {
    const isBoundary = i === 0 || i === gridLines.length - 1;
    
    chart.addPriceLine({
      price: price,
      color: isBoundary ? '#ef4444' : '#64748b',
      lineWidth: isBoundary ? 2 : 1,
      lineStyle: isBoundary ? 0 : 2, // 0 = solid, 2 = dashed
      axisLabelVisible: true,
      title: `Grid ${i}`
    });
  });
}

// Binary strike line helper
export function buildStrikeLine(strike: number | undefined): { price: number }[] {
  return Number.isFinite(strike) ? [{ price: strike! }] : [];
}

export function createStrikeOverlay(chart: IChartApi, strike: number): void {
  if (!Number.isFinite(strike) || strike <= 0) {
    console.warn('[Overlays] Invalid strike price:', strike);
    return;
  }

  chart.addPriceLine({
    price: strike,
    color: '#f59e0b',
    lineWidth: 2,
    lineStyle: 0,
    axisLabelVisible: true,
    title: 'Strike'
  });
}

// SL/TP lines helper
export function createSLTPOverlay(chart: IChartApi, config: SLTPConfig): void {
  if (config.stopLoss && Number.isFinite(config.stopLoss)) {
    chart.addPriceLine({
      price: config.stopLoss,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: 'SL'
    });
  }

  if (config.takeProfit && Number.isFinite(config.takeProfit)) {
    chart.addPriceLine({
      price: config.takeProfit,
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: 'TP'
    });
  }
}

// Validation helpers
export function isValidGridConfig(config: GridConfig): boolean {
  return (
    Number.isFinite(config.size) &&
    config.size > 0 &&
    Number.isFinite(config.lower) &&
    Number.isFinite(config.upper) &&
    config.upper > config.lower &&
    Number.isFinite(config.stepPct) &&
    config.stepPct > 0 &&
    config.stepPct <= 1
  );
}

export function isValidBinaryConfig(config: BinaryConfig): boolean {
  return (
    config.strike !== undefined &&
    Number.isFinite(config.strike) &&
    config.strike > 0 &&
    config.expiry !== undefined &&
    Number.isFinite(config.expiry) &&
    config.expiry > 0
  );
}

// Clear all overlays (simplified approach)
export function clearAllOverlays(chart: IChartApi): void {
  // Note: lightweight-charts doesn't have a direct "clear all" method
  // In a real implementation, you'd track overlay references and remove them
  // This is a placeholder for the concept
  console.log('[Overlays] Clearing overlays (placeholder)');
}

// Countdown helper for binary options
export function formatCountdown(expiryTime: number): string {
  const now = Date.now();
  const diff = expiryTime - now;
  
  if (diff <= 0) return 'Expired';
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Time normalization helper
export function normalizeTime(t: number): number {
  // Convert milliseconds to seconds if needed
  return t > 2e10 ? Math.floor(t / 1000) : t;
}
