import crypto from 'crypto';

// Configuración de Binance
const BINANCE_BASE_URL = process.env.BINANCE_TESTNET === 'true' 
  ? 'https://testnet.binance.vision' 
  : 'https://api.binance.com';

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;

// Función para crear firma HMAC
function createSignature(queryString) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

// Función para crear timestamp
function getTimestamp() {
  return Date.now();
}

// Función para hacer request a Binance
async function binanceRequest(endpoint, params = {}, method = 'GET') {
  const timestamp = getTimestamp();
  const queryString = new URLSearchParams({
    ...params,
    timestamp
  }).toString();
  
  const signature = createSignature(queryString);
  const url = `${BINANCE_BASE_URL}${endpoint}?${queryString}&signature=${signature}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Binance API Error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Endpoint principal
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { action, symbol, side, quantity, price, type = 'MARKET' } = req.body;
    
    // Validar parámetros requeridos
    if (!symbol || !side || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required parameters: symbol, side, quantity' 
      });
    }
    
    // Validar que tenemos las credenciales
    if (!API_KEY || !SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Binance credentials not configured' 
      });
    }
    
    let result;
    
    switch (action) {
      case 'place_order':
        // Crear orden en Binance
        const orderParams = {
          symbol: symbol.toUpperCase(),
          side: side.toUpperCase(),
          type: type.toUpperCase(),
          quantity: quantity.toString()
        };
        
        if (type === 'LIMIT' && price) {
          orderParams.price = price.toString();
          orderParams.timeInForce = 'GTC';
        }
        
        result = await binanceRequest('/api/v3/order', orderParams, 'POST');
        break;
        
      case 'get_account':
        // Obtener información de la cuenta
        result = await binanceRequest('/api/v3/account');
        break;
        
      case 'get_positions':
        // Obtener posiciones abiertas
        result = await binanceRequest('/api/v3/account');
        // Filtrar solo posiciones con balance > 0
        const positions = result.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
        result = { positions };
        break;
        
      case 'get_trades':
        // Obtener historial de trades
        const tradesParams = {
          symbol: symbol.toUpperCase(),
          limit: 100
        };
        result = await binanceRequest('/api/v3/myTrades', tradesParams);
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid action. Supported: place_order, get_account, get_positions, get_trades' 
        });
    }
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Binance API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}
