// src/app/lib/env.ts
// Environment variables for Vite (not Next.js)

export const ENV = {
  WS_URL: import.meta.env.VITE_WS_URL as string | undefined,
  QCORE_V2: import.meta.env.VITE_QCORE_V2 === '1',
  FEATURE_BINARY: import.meta.env.VITE_FEATURE_BINARY === '1',
  DATA_MODE: import.meta.env.VITE_DATA_MODE as string | undefined,
  SYMBOL: import.meta.env.VITE_SYMBOL as string | undefined,
  TIMEFRAME: import.meta.env.VITE_TIMEFRAME as string | undefined,
  GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY as string | undefined,
};

// WebSocket connection safety guards
export function canConnect(url?: string): boolean {
  if (!url) return false;
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') return false;
  
  // Mixed content protection: HTTPS site with WS URL
  if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
    console.warn('WS: Mixed content blocked - HTTPS site with WS URL');
    return false;
  }
  
  // Localhost protection: localhost URL in production
  if (url.includes('localhost') && window.location.hostname !== 'localhost') {
    console.warn('WS: localhost URL blocked in production');
    return false;
  }
  
  return true;
}

// Get safe WebSocket URL
export function getSafeWSURL(): string | null {
  if (!canConnect(ENV.WS_URL)) {
    return null;
  }
  
  return ENV.WS_URL || null;
}
