interface EnvironmentConfig {
  appName: string;
  enableAI: boolean;
  paper: boolean;
  mode: string;
  symbol: string;
  timeframe: string;
}

export const useEnvironment = (): EnvironmentConfig => {
  // Obtener variables de entorno de manera segura
  const getEnvVar = (key: string, defaultValue: string = ''): string => {
    try {
      return import.meta.env[`VITE_${key}`] || process.env[key] || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Configuración por defecto
  const config: EnvironmentConfig = {
    appName: getEnvVar('APP_NAME', 'QuantumTrade'),
    enableAI: getEnvVar('ENABLE_AI', '0') === '1',
    paper: getEnvVar('PAPER', '1') === '1',
    mode: getEnvVar('MODE', 'demo').toUpperCase(),
    symbol: getEnvVar('SYMBOL', 'BTC/USDT'),
    timeframe: getEnvVar('TIMEFRAME', '1m'),
  };

  return config;
};
