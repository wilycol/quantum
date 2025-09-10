export const runtime = 'edge';

export async function GET(req: Request) {
  const upgrade = (req.headers.get('upgrade') || '').toLowerCase();
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // @ts-ignore - disponible en Edge
  const { 0: client, 1: server } = new WebSocketPair();
  // @ts-ignore
  server.accept();

  const welcome = (msg: string) =>
    server.send(JSON.stringify({ op: 'welcome', message: msg, timestamp: Date.now() }));

  welcome('Connected to Quantum Core WebSocket');

  const hb = setInterval(() => {
    try { server.send(JSON.stringify({ op: 'heartbeat', timestamp: Date.now() })); } catch {}
  }, 30000);

  // @ts-ignore
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const m = JSON.parse(String(event.data || '{}'));
      if (m.op === 'ping') return server.send(JSON.stringify({ op: 'pong', t: m.t ?? Date.now() }));
      if (m.op === 'hello') return welcome('Hello from Quantum Core!');
      server.send(JSON.stringify({ op: 'echo', data: m, timestamp: Date.now() }));
    } catch {
      server.send(JSON.stringify({ op: 'echo', data: String(event.data) }));
    }
  });

  // @ts-ignore
  server.addEventListener('close', () => clearInterval(hb));

  return new Response(null, { 
    status: 101, 
    // @ts-ignore
    webSocket: client 
  });
}
