export const LEGAL_DISCLAIMER = `
QuantumTrade AI es una plataforma educativa. No provee asesoría financiera,
inversiones ni recomendaciones de compra/venta. El trading con criptoactivos
implica alto riesgo de pérdida total. Usa los modos Demo/Paper para practicar.
`;

export const PRIVACY_NOTE = `No almacenamos claves en el cliente. Las integraciones usan variables privadas de servidor.`;

export const RISK_WARNING = `
ADVERTENCIA DE RIESGO: El trading de criptomonedas conlleva un alto riesgo de pérdida.
Nunca invierta más de lo que puede permitirse perder. Los resultados pasados no garantizan
resultados futuros. Esta plataforma es únicamente para fines educativos y de simulación.
`;

export const COMPLIANCE_SETTINGS = {
  MAX_RISK_PERCENTAGE: 0.05, // 5%
  ALLOWED_SYMBOLS: ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"],
  MIN_EQUITY_USD: 10, // Mínimo $10 para trading
  MAX_ORDER_SIZE_USD: 1000, // Máximo $1000 por orden
} as const;
