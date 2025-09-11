export const config = { runtime: 'edge' };

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: Request) {
  try {
    // Get memory info using Redis INFO command
    const info = await redis.sendCommand(['INFO', 'memory']);
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryInfo = memoryMatch ? parseInt(memoryMatch[1]) : 0;
    
    // Get today's event count
    const today = new Date().toISOString().slice(0, 10);
    const todayKey = `events:${today}`;
    const todayCount = await redis.llen(todayKey);
    
    // Get last 7 days event counts
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const key = `events:${dateStr}`;
      const count = await redis.llen(key);
      last7Days.push({ date: dateStr, count });
    }
    
    // Calculate usage
    const usedMemoryBytes = memoryInfo || 0;
    const maxMemoryBytes = 256 * 1024 * 1024; // 256 MB
    const usagePercentage = (usedMemoryBytes / maxMemoryBytes * 100).toFixed(2);
    
    return Response.json({
      memory: {
        used: `${(usedMemoryBytes / (1024 * 1024)).toFixed(2)}MB`,
        max: '256MB',
        percentage: `${usagePercentage}%`,
        bytes: usedMemoryBytes,
        maxBytes: maxMemoryBytes
      },
      events: {
        today: todayCount,
        last7Days: last7Days.reverse() // Most recent first
      },
      status: 'healthy'
    });
  } catch (error) {
    return Response.json({
      error: 'Failed to get Redis status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
