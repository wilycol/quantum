// api/binance/order.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { placeSpotOrder, SpotOrderReq } from '../../lib/binance';

const ALLOWED = new Set(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']);
const CAPS: Record<string, { maxQty?: number; minQty?: number; maxQuote?: number }> = {
  BTCUSDT: { minQty: 0.0001, maxQty: 0.05 },
  ETHUSDT: { minQty: 0.001,  maxQty: 1 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as SpotOrderReq;

    if (!body?.symbol || !body?.side || !body?.type) {
      return res.status(400).json({ ok: false, error: 'symbol/side/type requeridos' });
    }
    if (!ALLOWED.has(body.symbol)) {
      return res.status(400).json({ ok: false, error: 'símbolo no permitido' });
    }
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