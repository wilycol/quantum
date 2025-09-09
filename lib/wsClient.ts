// lib/wsClient.ts
export function connectWS(path = '/api/ws') {
  // Para desarrollo local, usar el servidor WebSocket dedicado
  const url = 'ws://localhost:3001';

  let ws: WebSocket;
  let tries = 0;

  const connect = () => {
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      console.log('[WS] open');
      tries = 0;
      ws.send(JSON.stringify({ op: 'hello' }));
      // opcional: latido cliente→server
      setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 'ping' })), 15000);
    });
    ws.addEventListener('message', (e) => console.log('[WS] message', e.data));
    ws.addEventListener('error', (e) => console.warn('[WS] error', e));
    ws.addEventListener('close', () => {
      const delay = Math.min(1000 * 2 ** Math.min(tries++, 5), 30000);
      console.log(`[WS] closed, retry in ${delay}ms`);
      setTimeout(connect, delay);
    });
  };

  connect();
  return () => ws && ws.close();
}
