// /api/klines  -> proxy a Binance en Edge Runtime (rápido y sin CORS)
export const config = { runtime: 'edge' };

// lee desde env
const force = process.env.BINANCE_MIRROR; // 'vision' | 'us'

// Mirrors de Binance con fallback
const MIRRORS = [
  'https://api.binance.com',
  'https://data-api.binance.vision',
  'https://api.binance.us'
];

// Función para mover un mirror al inicio de la lista
function moveFirst(arr, item) {
  const index = arr.indexOf(item);
  if (index > 0) {
    arr.splice(index, 1);
    arr.unshift(item);
  }
}

// Configurar mirror preferido
if (force === 'vision') moveFirst(MIRRORS, 'https://data-api.binance.vision');
if (force === 'us')     moveFirst(MIRRORS, 'https://api.binance.us');

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const symbol   = searchParams.get('symbol')   ?? 'BTCUSDT';
  const interval = searchParams.get('interval') ?? '1m';
  const limit    = searchParams.get('limit')    ?? '200';

  // Intentar cada mirror hasta que uno funcione
  for (const baseUrl of MIRRORS) {
    try {
      const url = `${baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const r = await fetch(url);
      
      if (r.ok) {
        const arr = await r.json();
        const out = arr.map(k => ({ t:k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
        return new Response(JSON.stringify(out), {
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
      }
    } catch (e) {
      // Continuar con el siguiente mirror
      continue;
    }
  }

  // Si todos los mirrors fallan
  return new Response(JSON.stringify({ error: 'All Binance mirrors failed' }), {
    status: 503,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
}
