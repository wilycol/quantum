// --- Flags (seguras para Vite) ---
const ENABLE_AI = (import.meta.env?.VITE_ENABLE_AI ?? import.meta.env?.ENABLE_AI ?? '0') === '1';
const HAS_KEY = !!(import.meta.env?.VITE_GEMINI_API_KEY ?? import.meta.env?.GEMINI_API_KEY);

// Utilidad mock
function delay(ms = 200) { return new Promise(res => setTimeout(res, ms)); }

export async function fetchMarketInsights(prompt: string) {
  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    return { text: `AI offline (mock): ${prompt.slice(0, 80)}...`, sources: [] };
  }
  // TODO: integrar API real aquí
  await delay();
  return { text: `AI (placeholder): análisis de "${prompt.slice(0, 60)}"`, sources: [] };
}

export async function getTradeAdvice(instrument: string, tradeType?: 'BUY'|'SELL') {
  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    const side = tradeType ?? (Math.random() > 0.5 ? 'BUY' : 'SELL');
    return `AI offline (mock): ${side} ${instrument} con riesgo moderado.`;
  }
  await delay();
  return `AI (placeholder): ${tradeType ?? 'HOLD'} en ${instrument}.`;
}

export async function getPortfolioAnalysis(assets: any[]) {
  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    return {
      summary: `AI offline (mock): cartera con ${assets?.length ?? 0} activos; diversificación básica.`,
      notes: ['BTC/ETH dominan el riesgo', 'Revisa límites de exposición', 'Usa PAPER=1 para probar cambios'],
    };
  }
  await delay();
  return { summary: 'AI (placeholder): cartera balanceada.', notes: [] };
}

export async function getComparisonAnalysis(current: any, benchmark: any) {
  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    return {
      summary: 'AI offline (mock): rendimiento cercano al benchmark, varianza aceptable.',
      notes: ['Alpha ~0.1%', 'Drawdown controlado'],
    };
  }
  await delay();
  return { summary: 'AI (placeholder): comparación positiva.', notes: [] };
}

export async function submitSupportQuestion(question: string) {
  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    return { answer: `AI offline (mock): tu pregunta fue "${question.slice(0,80)}". Revisa la documentación y el Modo DEMO.` };
  }
  await delay();
  return { answer: 'AI (placeholder): estamos procesando tu consulta.' };
}
