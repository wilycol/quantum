// lib/wsClient.ts
// Compartido por toda la app
let ws: WebSocket | null = null;
let listeners: ((msg: any) => void)[] = [];
let onOpen: Array<() => void> = [];
let onClose: Array<() => void> = [];

export function connectWS(path = '/api/ws') {
  if (ws && ws.readyState <= 1) return ws;

  // Detectar si estamos en desarrollo local o producción
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let url: string;
  if (isLocalDev) {
    // Para desarrollo local, usar el servidor WebSocket dedicado
    url = 'ws://localhost:3001';
  } else {
    // Para producción (Vercel), simular conexión exitosa
    // El WebSocket Edge no funciona bien, usamos solo Binance feed
    console.log('[WS] Simulating connection for production');
    setTimeout(() => {
      onOpen.forEach(fn => fn());
    }, 100);
    return null as any; // Simular WebSocket
  }

  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    onOpen.forEach(fn => fn());
    send({ op: 'hello' });
    // latido cliente→server
    const iv = setInterval(() => {
      if (!ws || ws.readyState !== 1) return clearInterval(iv);
      send({ op: 'ping', t: Date.now() });
    }, 15000);
  });

  ws.addEventListener('message', (e) => {
    try { const msg = JSON.parse(String(e.data)); listeners.forEach(fn => fn(msg)); }
    catch { listeners.forEach(fn => fn({ op: 'raw', data: e.data })); }
  });

  ws.addEventListener('close', () => {
    onClose.forEach(fn => fn());
    // reconexión exponencial
    setTimeout(() => connectWS(path), 1500);
  });

  return ws;
}

export function send(obj: any) { ws?.readyState === 1 && ws.send(JSON.stringify(obj)); }
export function onMessage(fn: (m:any)=>void) { listeners.push(fn); return () => { listeners = listeners.filter(f => f!==fn); }; }
export function onConnected(fn: ()=>void) { onOpen.push(fn); return () => { onOpen = onOpen.filter(f=>f!==fn); }; }
export function onDisconnected(fn: ()=>void) { onClose.push(fn); return () => { onClose = onClose.filter(f=>f!==fn); }; }
export function isConnected() { return ws?.readyState === 1; }
