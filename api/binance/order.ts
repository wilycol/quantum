// api/binance/order.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { placeSpotOrder, SpotOrderReq } from '../../lib/binance';

// Compliance settings
const COMPLIANCE = {
  MAX_RISK_PERCENTAGE: 0.05, // 5%
  ALLOWED_SYMBOLS: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'],
  MIN_EQUITY_USD: 10,
  MAX_ORDER_SIZE_USD: 1000,
  TRADING_MODE: process.env.TRADING_MODE || 'paper', // prod -> paper por convención
} as const;

const ALLOWED = new Set(COMPLIANCE.ALLOWED_SYMBOLS);
const CAPS: Record<string, { maxQty?: number; minQty?: number; maxQuote?: number }> = {
  BTCUSDT: { minQty: 0.0001, maxQty: 0.05 },
  ETHUSDT: { minQty: 0.001,  maxQty: 1 },
  BNBUSDT: { minQty: 0.01,   maxQty: 10 },
  ADAUSDT: { minQty: 1,      maxQty: 1000 },
  SOLUSDT: { minQty: 0.01,   maxQty: 10 },
};

// Helper functions for compliance
async function getLastPrice(symbol: string): Promise<number> {
  // Mock implementation - in production, fetch from exchange
  const mockPrices: Record<string, number> = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3000,
    'BNBUSDT': 300,
    'ADAUSDT': 0.5,
    'SOLUSDT': 100,
  };
  return mockPrices[symbol] || 0;
}

async function getEquityFromExchangeOrCache(user: string): Promise<number> {
  // Mock implementation - in production, fetch from exchange or cache
  return 1000; // Mock $1000 equity
}

function maxQtyByRisk(equityUSD: number, priceUSD: number, maxPct: number = COMPLIANCE.MAX_RISK_PERCENTAGE): number {
  if (equityUSD <= 0 || priceUSD <= 0) return 0;
  const maxUSD = equityUSD * maxPct;
  return +(maxUSD / priceUSD).toFixed(6);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as SpotOrderReq;

    // 1. Validaciones básicas
    if (!body?.symbol || !body?.side || !body?.type) {
      return res.status(400).json({ ok: false, error: 'symbol/side/type requeridos' });
    }

    // 2. Validar símbolo permitido
    if (!ALLOWED.has(body.symbol as string)) {
      return res.status(400).json({ ok: false, error: 'symbol_not_allowed' });
    }

    // 3. Validaciones de cantidad
    const cap = CAPS[body.symbol] || {};
    if (cap.minQty && body.quantity && body.quantity < cap.minQty) {
      return res.status(400).json({ ok: false, error: `qty < minQty (${cap.minQty})` });
    }
    if (cap.maxQty && body.quantity && body.quantity > cap.maxQty) {
      return res.status(400).json({ ok: false, error: `qty > maxQty (${cap.maxQty})` });
    }
    if (cap.maxQuote && body.quoteOrderQty && body.quoteOrderQty > cap.maxQuote) {
      return res.status(400).json({ ok: false, error: `quote > maxQuote (${cap.maxQuote})` });
    }

    // 4. Validaciones de compliance y riesgo
    const priceUSD = await getLastPrice(body.symbol);
    const orderValueUSD = (body.quantity || 0) * priceUSD;
    
    // Validar tamaño máximo de orden
    if (orderValueUSD > COMPLIANCE.MAX_ORDER_SIZE_USD) {
      return res.status(400).json({ ok: false, error: 'order_size_exceeded' });
    }

    // 5. Modo de trading
    if (COMPLIANCE.TRADING_MODE === 'paper') {
      // Simular orden en modo paper
      return res.status(200).json({ 
        ok: true, 
        mode: 'paper', 
        simulated: true,
        data: {
          symbol: body.symbol,
          side: body.side,
          quantity: body.quantity,
          price: priceUSD,
          orderValue: orderValueUSD
        }
      });
    }

    // 6. Validaciones de riesgo para trading real (si está habilitado)
    if (COMPLIANCE.TRADING_MODE === 'live') {
      const user = 'default_user'; // En producción, obtener del token/auth
      const equityUSD = await getEquityFromExchangeOrCache(user);
      
      if (equityUSD < COMPLIANCE.MIN_EQUITY_USD) {
        return res.status(400).json({ ok: false, error: 'insufficient_equity' });
      }

      const maxQty = maxQtyByRisk(equityUSD, priceUSD, COMPLIANCE.MAX_RISK_PERCENTAGE);
      if (body.quantity && body.quantity > maxQty) {
        return res.status(400).json({ ok: false, error: 'risk_limit_exceeded' });
      }
    }

    // 7. Ejecutar orden real (solo si está en modo live y pasa todas las validaciones)
    const data = await placeSpotOrder({
      symbol: body.symbol,
      side: body.side,
      type: body.type,
      quantity: body.quantity,
      quoteOrderQty: body.quoteOrderQty,
      price: body.price,
      timeInForce: body.timeInForce,
      test: body.test ?? false,
    });

    res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error('[order] error:', e?.message, e?.stack);
    res.status(500).json({ ok: false, where: 'order', error: e?.message || 'unknown' });
  }
}