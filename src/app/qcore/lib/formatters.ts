// src/app/qcore/lib/formatters.ts
// Formatters for QuantumCore v2

export function formatStatus(s: 'connected'|'connecting'|'disconnected') {
  if (s === 'connected') return 'WS: ON';
  if (s === 'connecting') return 'WS: …';
  return 'WS: OFF';
}

export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || !Number.isFinite(price)) {
    return '—';
  }
  return price.toFixed(2);
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || !Number.isFinite(amount)) {
    return '$0.00';
  }
  return `$${amount.toFixed(2)}`;
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '0.00%';
  }
  return `${value.toFixed(2)}%`;
}

export function formatPnL(pnl: number | undefined | null): string {
  if (pnl === undefined || pnl === null || !Number.isFinite(pnl)) {
    return '$0.00';
  }
  const formatted = pnl.toFixed(2);
  return pnl >= 0 ? `+$${formatted}` : `-$${Math.abs(pnl).toFixed(2)}`;
}

export function formatWinRate(rate: number | undefined | null): string {
  if (rate === undefined || rate === null || !Number.isFinite(rate)) {
    return '0.0%';
  }
  return `${rate.toFixed(1)}%`;
}

export function formatTime(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms)) {
    return '00:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatRelativeTime(timestamp: number | undefined | null): string {
  if (timestamp === undefined || timestamp === null || !Number.isFinite(timestamp)) {
    return '—';
  }
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function formatConfidence(conf: number | undefined | null): string {
  if (conf === undefined || conf === null || !Number.isFinite(conf)) {
    return '0%';
  }
  return `${(conf * 100).toFixed(1)}%`;
}

export function formatTimestamp(timestamp: number | undefined | null): string {
  if (timestamp === undefined || timestamp === null || !Number.isFinite(timestamp)) {
    return '—';
  }
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

export function formatLogLevel(level: string | undefined | null): string {
  if (!level) return 'INFO';
  return level.toUpperCase();
}