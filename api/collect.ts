export const config = { runtime: 'edge' };

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const ALLOWED = new Set([
  'ws/connected','ws/disconnected',
  'signal/preview','risk/decision',
  'order/accepted','order/filled',
  'health/degraded','health/recovered','system/error'
  // Removed: market/kline (too frequent), system/info/warn (too verbose)
]);

function validEvent(e:any){
  return e && typeof e==='object' && ALLOWED.has(e.type) && typeof e.t==='number';
}

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const e = await req.json();
    if (!validEvent(e)) return new Response('Bad Event', { status: 400 });

    const dt = new Date(e.t).toISOString().slice(0,10); // YYYY-MM-DD
    const key = `events:${dt}`;
    
    // Compress event data to save space
    const compressedEvent = {
      t: e.t,
      type: e.type,
      ...(e.symbol && { s: e.symbol }),
      ...(e.payload && { p: e.payload }),
      ...(e.session_id && { sid: e.session_id.slice(-8) }), // Short session ID
      ...(e.mode && { m: e.mode })
    };
    
    await redis.rpush(key, JSON.stringify(compressedEvent));
    await redis.expire(key, 60*60*24*7); // 7 días (plan free limit)

    return new Response(null, { status: 202 });
  } catch (err:any) {
    return new Response('Collect error', { status: 500 });
  }
}
