export const config = { runtime: 'edge' };

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const ALLOWED = new Set([
  'ws/connected','ws/disconnected',
  'market/kline','signal/preview','risk/decision',
  'order/accepted','order/filled',
  'health/degraded','health/recovered','system/info','system/warn','system/error'
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
    await redis.rpush(key, JSON.stringify(e));
    await redis.expire(key, 60*60*24*90); // 90 días

    return new Response(null, { status: 202 });
  } catch (err:any) {
    return new Response('Collect error', { status: 500 });
  }
}
