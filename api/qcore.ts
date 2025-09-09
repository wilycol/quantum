export const config = { runtime: 'edge' };

const FIXTURES = [
  { t:'preview', broker:'binance', pair:'BTCUSDT', side:'BUY', price:111842.8, sl:11153, tp:11315, rr:4.3, conf:0.62, ts: Date.now() },
  { t:'executed', broker:'binance', orderId:'A1', pair:'BTCUSDT', side:'BUY', fillPrice:111840.2, pnl:-2.89, ts: Date.now()+1000 },
  { t:'binary_preview', broker:'zaffer', asset:'BTCUSD', dir:'CALL', strike:111840, expiry:60, amount:50, conf:0.58, ts: Date.now()+2000 },
  { t:'binary_executed', broker:'zaffer', ticketId:'Z9', asset:'BTCUSD', result:'WIN', amount:50, payout:0.93, net:46.5, ts: Date.now()+3000 }
];

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('ping') === '1') return new Response('ok', { status: 200 });

  // @ts-ignore
  const pair = new WebSocketPair();
  // @ts-ignore
  const client = pair[0], server = pair[1];
  server.accept();

  const hb = setInterval(() => { try { server.send(JSON.stringify({ t:'heartbeat', ts: Date.now() })); } catch {} }, 10000);
  let i = 0;
  const loop = setInterval(() => {
    try { server.send(JSON.stringify({ ...FIXTURES[i++ % FIXTURES.length], ts: Date.now() })); } catch {}
  }, 2000);

  server.addEventListener('close', () => { clearInterval(loop); clearInterval(hb); });
  server.addEventListener('error', () => { try { server.close(); } catch {} });

  // @ts-ignore
  return new Response(null, { status: 101, webSocket: client });
}