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

type NewsArticle = { id?: number|string; title: string; source?: string; url?: string };

export async function getNewsAnalysis(titleOrArticles: string | Array<{title:string; summary?:string}>, summary?: string) {
  const ENABLE_AI = (import.meta.env?.VITE_ENABLE_AI ?? import.meta.env?.ENABLE_AI ?? '0') === '1';
  const HAS_KEY = !!(import.meta.env?.VITE_GEMINI_API_KEY ?? import.meta.env?.GEMINI_API_KEY);

  // mock delay
  const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    
    // Detectar si es string (title) o array (articles)
    if (typeof titleOrArticles === 'string') {
      const title = titleOrArticles.slice(0, 60);
      return {
        summary: `AI offline (mock): análisis de "${title}"`,
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
        highlights: ['Análisis básico', 'Revisar contexto completo'],
      };
    } else {
      const count = titleOrArticles?.length ?? 0;
      const sample = (titleOrArticles?.[0]?.title ?? 'no titles').slice(0, 60);
      return {
        summary: `AI offline (mock): ${count} artículos. Ej: "${sample}"`,
        sentiment: count % 3 === 0 ? 'neutral' : (count % 2 === 0 ? 'bullish' : 'bearish'),
        highlights: [
          'Volumen de noticias estable',
          'Catalizadores a corto plazo limitados',
          'Usa PAPER=1 para testear reacciones a titulares'
        ],
      };
    }
  }

  // TODO: integración real (placeholder)
  await delay();
  return {
    summary: 'AI (placeholder): análisis básico de titulares.',
    sentiment: 'neutral',
    highlights: ['Sin señal fuerte', 'Monitorear próximos eventos'],
  };
}

export async function getSupportChatResponse(question: string, _faqs?: any): Promise<{answer:string}> {
  // Alias a submitSupportQuestion para mantener compatibilidad con SupportView
  const res = await submitSupportQuestion(question);
  return res; // { answer: string }
}

export async function getWeeklyAnalysis(trades?: any[]) {
  const ENABLE_AI = (import.meta.env?.VITE_ENABLE_AI ?? import.meta.env?.ENABLE_AI ?? '0') === '1';
  const HAS_KEY = !!(import.meta.env?.VITE_GEMINI_API_KEY ?? import.meta.env?.GEMINI_API_KEY);

  const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

  if (!ENABLE_AI || !HAS_KEY) {
    await delay();
    return { summary: 'AI offline (mock): análisis semanal básico.', insights: ['Mercado estable', 'Volatilidad moderada'] };
  }

  await delay();
  return { summary: 'AI (placeholder): análisis semanal completo.', insights: ['Tendencia alcista', 'Soporte fuerte'] };
}
