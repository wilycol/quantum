export const LEGAL_DISCLAIMER = `
QuantumTrade AI es una plataforma educativa. No provee asesoría financiera,
recomendaciones de inversión ni ofertas de valores. El trading con criptoactivos
conlleva alto riesgo, incluida la pérdida total. Usa Demo/Paper para practicar.
`;

export const PRIVACY_NOTE = `
Claves y endpoints sensibles no se exponen al cliente. Integraciones usan
variables privadas del servidor. Revisa Términos y Privacidad en /legal.
`;

export const COMPLIANCE_CONFIG = {
  MAX_RISK_PERCENTAGE: 0.05, // 5%
  DEFAULT_TRADING_MODE: 'paper',
  ALLOWED_SYMBOLS: ['BTCUSDT', 'ETHUSDT'],
  LEGAL_VERSION: 'v1'
} as const;