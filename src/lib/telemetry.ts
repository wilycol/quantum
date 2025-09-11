// src/lib/telemetry.ts
// Telemetry system for data collection

export function emitTelemetry(e: any) {
  try {
    const body = JSON.stringify(e);
    if ('sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/collect', blob);
    } else {
      fetch('/api/collect', { 
        method: 'POST', 
        body, 
        headers: {'content-type': 'application/json'}, 
        keepalive: true 
      });
    }
  } catch (error) {
    console.warn('[Telemetry] Failed to emit event:', error);
  }
}
