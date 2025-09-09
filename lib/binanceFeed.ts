// Suscripción directa a Binance WS (solo market data)
export type Unsub = () => void;

export function subscribeKline(
  symbol = 'btcusdt',
  interval: '1m'|'3m'|'5m'|'15m'|'30m'|'1h'|'2h'|'4h'|'1d' = '1m',
  onMsg: (msg: any) => void
): Unsub {
  const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
  let ws: WebSocket;
  let retry = 0;

  const connect = () => {
    ws = new WebSocket(url);
    ws.addEventListener('open', () => { retry = 0; });
    ws.addEventListener('message', e => { try { onMsg(JSON.parse(String(e.data))); } catch {} });
    ws.addEventListener('close', () => {
      const delay = Math.min(1000 * 2 ** Math.min(retry++, 5), 30000);
      setTimeout(connect, delay);
    });
    ws.addEventListener('error', () => ws.close());
  };

  connect();
  return () => ws && ws.close();
}
