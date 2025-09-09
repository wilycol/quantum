import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODE = process.env.TRADING_MODE || "paper"; // prod: 'paper' por defecto
const ALLOWED_SYMBOLS = (process.env.ALLOWED_SYMBOLS || "BTCUSDT,ETHUSDT").split(",");
const MAX_PCT = Number(process.env.MAX_RISK_PCT || "0.05"); // 5%

// Función auxiliar para obtener equity del usuario (mock por ahora)
async function getUserEquityUSD(req: VercelRequest): Promise<number> {
  // En una implementación real, esto vendría de la base de datos o API del exchange
  // Por ahora retornamos un valor mock
  return 10000; // $10,000 USD mock
}

// Función auxiliar para obtener precio actual
async function getLastPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw new Error(`Failed to get price for ${symbol}`);
  }
}

// Función auxiliar para calcular cantidad máxima por riesgo
function maxQtyByRisk(equityUSD: number, priceUSD: number, maxPct: number): number {
  if (equityUSD <= 0 || priceUSD <= 0) return 0;
  const maxUSD = equityUSD * maxPct;
  return +(maxUSD / priceUSD).toFixed(6);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Solo permitir POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "method_not_allowed" });
    }

    const { symbol, side, qty, type = "MARKET" } = req.body || {};

    // Validar parámetros requeridos
    if (!symbol || !side || !qty) {
      return res.status(400).json({ error: "bad_request", message: "Missing required parameters" });
    }

    // Validar símbolo permitido
    if (!ALLOWED_SYMBOLS.includes(symbol)) {
      return res.status(400).json({ 
        error: "symbol_not_allowed", 
        message: `Symbol ${symbol} not allowed. Allowed: ${ALLOWED_SYMBOLS.join(", ")}` 
      });
    }

    // Validar lado de la orden
    if (!["BUY", "SELL"].includes(side.toUpperCase())) {
      return res.status(400).json({ error: "invalid_side", message: "Side must be BUY or SELL" });
    }

    // Validar cantidad positiva
    if (qty <= 0) {
      return res.status(400).json({ error: "invalid_qty", message: "Quantity must be positive" });
    }

    // En modo paper, simular orden exitosa
    if (MODE === "paper") {
      return res.status(200).json({ 
        ok: true, 
        mode: "paper", 
        simulated: true,
        order: {
          symbol,
          side: side.toUpperCase(),
          qty,
          type,
          status: "FILLED",
          timestamp: Date.now()
        }
      });
    }

    // Si estuviera habilitado real: validar tamaño por equity
    const equityUSD = await getUserEquityUSD(req);
    const priceUSD = await getLastPrice(symbol);
    const maxQty = maxQtyByRisk(equityUSD, priceUSD, MAX_PCT);

    if (qty > maxQty) {
      return res.status(400).json({ 
        error: "risk_limit_exceeded", 
        message: `Quantity ${qty} exceeds maximum allowed ${maxQty} (${MAX_PCT * 100}% of equity)`,
        maxQty,
        equityUSD,
        priceUSD
      });
    }

    // Aquí iría la lógica para colocar orden real o testnet
    // const result = await placeOrder(symbol, side, qty, type);
    
    return res.status(200).json({ 
      ok: true, 
      mode: "live",
      message: "Order validation passed (live trading not implemented yet)"
    });

  } catch (error: any) {
    console.error("Order API error:", error);
    return res.status(500).json({ 
      error: "server_error", 
      detail: String(error?.message || error) 
    });
  }
}
