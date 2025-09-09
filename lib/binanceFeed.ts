// Suscripción directa a Binance WS (solo market data)
export type Unsub = () => void;

export function subscribeKline(
  symbol = 'btcusdt',
  interval: '1m'|'3m'|'5m'|'15m'|'30m'|'1h'|'2h'|'4h'|'1d' = '1m',
  onMsg: (msg: any) => void
): Unsub {
  const url = `wss://stream.binance.com/ws/${symbol.toLowerCase()}@kline_${interval}`;
  console.log('[BINANCE FEED] Connecting to:', url);
  let ws: WebSocket;
  let retry = 0;

  const connect = () => {
    console.log('[BINANCE FEED] Attempting connection...');
    ws = new WebSocket(url);
    ws.addEventListener('open', () => { 
      console.log('[BINANCE FEED] Connected successfully!');
      retry = 0; 
    });
    ws.addEventListener('message', e => { 
      console.log('[BINANCE FEED] Message received:', e.data);
      try { onMsg(JSON.parse(String(e.data))); } catch {} 
    });
    ws.addEventListener('close', () => {
      console.log('[BINANCE FEED] Connection closed, retrying...');
      const delay = Math.min(1000 * 2 ** Math.min(retry++, 5), 30000);
      setTimeout(connect, delay);
    });
    ws.addEventListener('error', (error) => {
      console.error('[BINANCE FEED] Connection error:', error);
      ws.close();
    });
  };

  connect();
  return () => ws && ws.close();
}
