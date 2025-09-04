export function useEnvironment() {
  const get = (key: string, def: string = '') =>
    (import.meta as any)?.env?.[`VITE_${key}`] ??
    (import.meta as any)?.env?.[key] ??
    (typeof process !== 'undefined' ? (process as any).env?.[key] : undefined) ??
    def;

  return {
    APP_NAME: get('APP_NAME', 'QuantumTrade'),
    ENABLE_AI: get('ENABLE_AI', '0'),
    PAPER: get('PAPER', '1'),
    MODE: get('MODE', 'demo'),
    SYMBOL: get('SYMBOL', 'BTC/USDT'),
    TIMEFRAME: get('TIMEFRAME', '1m'),
    // Compatibilidad con nombres anteriores
    appName: get('APP_NAME', 'QuantumTrade'),
    enableAI: get('ENABLE_AI', '0') === '1',
    paper: get('PAPER', '1') === '1',
    mode: get('MODE', 'demo').toUpperCase(),
    symbol: get('SYMBOL', 'BTC/USDT'),
    timeframe: get('TIMEFRAME', '1m'),
  };
}