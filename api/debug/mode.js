export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    res.status(200).json({
      TRADING_MODE: process.env.TRADING_MODE || null,
      NEXT_PUBLIC_TRADING_MODE: process.env.NEXT_PUBLIC_TRADING_MODE || null,
      BINANCE_TESTNET: process.env.BINANCE_TESTNET || null,
      BINANCE_API_KEY: process.env.BINANCE_API_KEY ? '***configured***' : null,
      BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY ? '***configured***' : null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Debug mode error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: Date.now()
    });
  }
}
