// src/lib/mode.ts
export type TradingMode = 'paper' | 'testnet' | 'live';
export type FeedMode = 'live' | 'mock';

function readEnv(name: string): string | undefined {
  // @ts-ignore
  return (import.meta.env as any)?.[name];
}

export const CLIENT_TRADING_MODE: TradingMode =
  (readEnv('VITE_TRADING_MODE') as TradingMode) ||
  (readEnv('NEXT_PUBLIC_TRADING_MODE') as TradingMode) || 'paper';

export const CLIENT_FEED_MODE: FeedMode =
  ((readEnv('VITE_DATA_MODE') || 'mock').toLowerCase() as FeedMode);

export const MODE_BADGE = CLIENT_TRADING_MODE.toUpperCase();
export const FEED_BADGE = CLIENT_FEED_MODE.toUpperCase();

// DEBUG banner (solo en navegador)
if (typeof window !== 'undefined') {
  // @ts-ignore
  const E = import.meta.env || {} as any;
  // eslint-disable-next-line no-console
  console.info('[QT] env preview:', {
    VITE_TRADING_MODE: E.VITE_TRADING_MODE,
    NEXT_PUBLIC_TRADING_MODE: E.NEXT_PUBLIC_TRADING_MODE,
    VITE_DATA_MODE: E.VITE_DATA_MODE,
  });
}
