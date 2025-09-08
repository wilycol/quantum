// src/app/qcore/lib/formatters.ts
// Formatting utilities for QuantumCore v2

// Number formatting
export function formatPrice(price: number, decimals: number = 2): string {
  if (!isFinite(price)) return '0.00';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (!isFinite(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Time formatting
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// Binary countdown formatting
export function formatCountdown(expiryMs: number): string {
  const now = Date.now();
  const remaining = Math.max(0, expiryMs - now);
  
  if (remaining <= 0) return 'Expired';
  
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

// Asset symbol formatting
export function formatAssetSymbol(symbol: string): string {
  if (symbol.includes('USDT')) {
    return symbol.replace('USDT', '/USDT');
  }
  if (symbol.includes('USD')) {
    return symbol.replace('USD', '/USD');
  }
  return symbol;
}

export function formatAssetName(symbol: string): string {
  const names: Record<string, string> = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'BNB',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'BTCUSD': 'Bitcoin Binary',
    'ETHUSD': 'Ethereum Binary',
    'EURUSD': 'EUR/USD Binary',
    'GBPUSD': 'GBP/USD Binary'
  };
  return names[symbol] || symbol;
}

// PnL formatting with color
export function formatPnL(pnl: number): { text: string; color: string } {
  if (!isFinite(pnl)) return { text: '$0.00', color: 'text-gray-400' };
  
  const formatted = formatCurrency(pnl);
  const color = pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-gray-400';
  
  return { text: formatted, color };
}

// Win rate formatting
export function formatWinRate(winRate: number): { text: string; color: string } {
  if (!isFinite(winRate)) return { text: '0.0%', color: 'text-gray-400' };
  
  const formatted = formatPercentage(winRate);
  const color = winRate >= 70 ? 'text-green-500' : winRate >= 50 ? 'text-yellow-500' : 'text-red-500';
  
  return { text: formatted, color };
}

// Risk percentage formatting
export function formatRiskPct(riskPct: number): { text: string; color: string } {
  if (!isFinite(riskPct)) return { text: '0.0%', color: 'text-gray-400' };
  
  const formatted = formatPercentage(riskPct * 100);
  const color = riskPct <= 0.02 ? 'text-green-500' : riskPct <= 0.05 ? 'text-yellow-500' : 'text-red-500';
  
  return { text: formatted, color };
}

// Confidence formatting
export function formatConfidence(confidence: number): { text: string; color: string } {
  if (!isFinite(confidence)) return { text: '0%', color: 'text-gray-400' };
  
  const formatted = formatPercentage(confidence * 100);
  const color = confidence >= 0.8 ? 'text-green-500' : confidence >= 0.6 ? 'text-yellow-500' : 'text-red-500';
  
  return { text: formatted, color };
}

// Order side formatting
export function formatOrderSide(side: 'BUY' | 'SELL'): { text: string; color: string } {
  const color = side === 'BUY' ? 'text-green-500' : 'text-red-500';
  return { text: side, color };
}

// Binary direction formatting
export function formatBinaryDirection(direction: 'CALL' | 'PUT'): { text: string; color: string } {
  const color = direction === 'CALL' ? 'text-green-500' : 'text-red-500';
  return { text: direction, color };
}

// Status formatting
export function formatStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'connected': { text: 'Connected', color: 'text-green-500' },
    'connecting': { text: 'Connecting', color: 'text-yellow-500' },
    'disconnected': { text: 'Disconnected', color: 'text-red-500' },
    'shadow': { text: 'Shadow', color: 'text-blue-500' },
    'live': { text: 'Live', color: 'text-orange-500' },
    'running': { text: 'Running', color: 'text-green-500' },
    'stopped': { text: 'Stopped', color: 'text-gray-500' },
    'idle': { text: 'Idle', color: 'text-gray-400' }
  };
  
  return statusMap[status.toLowerCase()] || { text: status, color: 'text-gray-400' };
}

// Log level formatting
export function formatLogLevel(level: 'INFO' | 'WARN' | 'ERROR'): { text: string; color: string } {
  const levelMap: Record<string, { text: string; color: string }> = {
    'INFO': { text: 'INFO', color: 'text-blue-500' },
    'WARN': { text: 'WARN', color: 'text-yellow-500' },
    'ERROR': { text: 'ERROR', color: 'text-red-500' }
  };
  
  return levelMap[level] || { text: level, color: 'text-gray-400' };
}

// Grid level formatting
export function formatGridLevel(level: number, stepPct: number): string {
  return `${formatPrice(level)} (±${formatPercentage(stepPct * 100)})`;
}

// Binary payout formatting
export function formatBinaryPayout(payout: number): { text: string; color: string } {
  if (!isFinite(payout)) return { text: '0%', color: 'text-gray-400' };
  
  const formatted = formatPercentage(payout * 100);
  const color = payout >= 0.8 ? 'text-green-500' : payout >= 0.6 ? 'text-yellow-500' : 'text-red-500';
  
  return { text: formatted, color };
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Format large numbers with K/M/B suffixes
export function formatLargeNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}
