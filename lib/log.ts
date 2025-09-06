// lib/log.ts
export const vercelRegion = () => process.env.VERCEL_REGION || 'unknown';
const stamp = () => new Date().toISOString();

export function logInfo(msg: string, meta: Record<string, any> = {}) {
  // eslint-disable-next-line no-console
  console.log(`[INFO][${stamp()}][${vercelRegion()}] ${msg}`, meta);
}

export function logError(msg: string, meta: Record<string, any> = {}) {
  // eslint-disable-next-line no-console
  console.error(`[ERROR][${stamp()}][${vercelRegion()}] ${msg}`, meta);
}
