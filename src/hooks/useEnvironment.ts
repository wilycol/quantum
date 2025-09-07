export function useEnvironment() {
  const get = (key: string, def: string = '') => {
    const value = (import.meta as any)?.env?.[`VITE_${key}`] ??
      (import.meta as any)?.env?.[key] ??
      (typeof process !== 'undefined' ? (process as any).env?.[key] : undefined) ??
      def;
    
    // Debug log para verificar variables (solo en desarrollo)
    if (key === 'DATA_MODE' && import.meta.env.DEV) {
      console.log('[ENV DEBUG]', {
        key: `VITE_${key}`,
        value,
        importMetaEnv: (import.meta as any)?.env,
        allViteVars: Object.keys((import.meta as any)?.env || {}).filter(k => k.startsWith('VITE_'))
      });
    }
    
    return value;
  };

  return {
    APP_NAME: get('APP_NAME', 'QuantumTrade'),
    ENABLE_AI: get('ENABLE_AI', '0'),
    PAPER: get('PAPER', '1'),
    MODE: get('MODE', 'demo'),
    SYMBOL: get('SYMBOL', 'BTC/USDT'),
    TIMEFRAME: get('TIMEFRAME', '1m'),
    // Nuevas variables de datos
    DATA_MODE: get('DATA_MODE', 'live'),
    VITE_SYMBOL: get('VITE_SYMBOL', 'BTCUSDT'),
    VITE_TIMEFRAME: get('VITE_TIMEFRAME', '1m'),
    // Compatibilidad con nombres anteriores
    appName: get('APP_NAME', 'QuantumTrade'),
    enableAI: get('ENABLE_AI', '0') === '1',
    paper: get('PAPER', '1') === '1',
    mode: get('MODE', 'demo').toUpperCase(),
    symbol: get('SYMBOL', 'BTC/USDT'),
    timeframe: get('TIMEFRAME', '1m'),
    // Nuevas propiedades de compatibilidad
    dataMode: get('DATA_MODE', 'live'),
    viteSymbol: get('VITE_SYMBOL', 'BTCUSDT'),
    viteTimeframe: get('VITE_TIMEFRAME', '1m'),
  };
}