// app/api/ws/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('ping') === '1') {
    return new Response('ok', { status: 200 });
  }

  if ((req.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // @ts-ignore - WebSocketPair está en Edge runtime
  const { 0: client, 1: server } = new WebSocketPair();
  // @ts-ignore
  server.accept();

  // Heartbeat cada 30s
  const hb = setInterval(() => {
    try { server.send(JSON.stringify({ op: 'heartbeat', t: Date.now() })); } catch {}
  }, 30000);

  // Echo + rutas básicas
  // @ts-ignore
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const msg = JSON.parse(String(event.data || '{}'));
      if (msg.op === 'ping') {
        server.send(JSON.stringify({ op: 'pong', t: Date.now() }));
        return;
      }
      if (msg.op === 'hello') {
        server.send(JSON.stringify({ op: 'welcome', t: Date.now() }));
        return;
      }
      server.send(JSON.stringify({ op: 'echo', data: msg }));
    } catch {
      server.send(JSON.stringify({ op: 'echo', data: String(event.data) }));
    }
  });

  // @ts-ignore
  server.addEventListener('close', () => clearInterval(hb));

  return new Response(null, { status: 101, webSocket: client });
}
