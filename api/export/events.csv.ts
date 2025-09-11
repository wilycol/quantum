export const config = { runtime: 'edge' };
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v:any) => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const header = cols.join(',');
  const lines = rows.map(r => cols.map(c => esc(r[c])).join(','));
  return [header, ...lines].join('\n');
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const dt = url.searchParams.get('date') || new Date().toISOString().slice(0,10);
  const key = `events:${dt}`;
  const list = await redis.lrange<string>(key, 0, -1);
  const rows = list.map(x => JSON.parse(x));
  const csv = toCSV(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type':'text/csv; charset=utf-8',
      'content-disposition':`attachment; filename="events_${dt}.csv"`
    }
  });
}
