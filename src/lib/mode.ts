// src/lib/mode.ts
export type TradingMode = 'paper' | 'testnet' | 'live';

function readEnv(name: string): string | undefined {
  // Vite expone import.meta.env
  // (algunos proyectos traen NEXT_PUBLIC_* por transición)
  // @ts-ignore
  return (import.meta.env as any)?.[name];
}

export const CLIENT_TRADING_MODE: TradingMode =
  (readEnv('VITE_TRADING_MODE') as TradingMode) ||
  (readEnv('NEXT_PUBLIC_TRADING_MODE') as TradingMode) ||
  'paper';

export const MODE_BADGE = CLIENT_TRADING_MODE.toUpperCase();
