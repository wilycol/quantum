export function isChartHealthy(params: {
  wsConnected: boolean; 
  binanceConnected: boolean;
  lastKlineTs?: number; 
  maxStaleMs?: number;
}) {
  const { wsConnected, binanceConnected, lastKlineTs, maxStaleMs = 20_000 } = params;
  const fresh = lastKlineTs ? (Date.now() - lastKlineTs) <= maxStaleMs : false;
  return wsConnected && binanceConnected && fresh;
}

export function getHealthStatus(params: {
  wsConnected: boolean; 
  binanceConnected: boolean;
  lastKlineTs?: number; 
  maxStaleMs?: number;
}) {
  const healthy = isChartHealthy(params);
  
  if (healthy) {
    return { status: 'healthy', color: 'green', message: 'All systems operational' };
  }
  
  if (!params.wsConnected) {
    return { status: 'degraded', color: 'yellow', message: 'WebSocket disconnected' };
  }
  
  if (!params.binanceConnected) {
    return { status: 'degraded', color: 'yellow', message: 'Market data disconnected' };
  }
  
  if (params.lastKlineTs && (Date.now() - params.lastKlineTs) > (params.maxStaleMs || 20_000)) {
    return { status: 'degraded', color: 'yellow', message: 'Market data stale' };
  }
  
  return { status: 'error', color: 'red', message: 'System error' };
}
