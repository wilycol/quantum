// src/app/qcore/lib/events.ts
// WebSocket event types and handlers for QuantumCore v2

export type PreviewSpot = {
  t: 'preview'; 
  broker: 'binance';
  pair: string; 
  side: 'BUY'|'SELL'; 
  price: number; 
  sl?: number; 
  tp?: number; 
  rr?: number; 
  conf?: number; 
  ts: number;
};

export type ExecutedSpot = {
  t: 'executed'; 
  broker: 'binance';
  orderId: string; 
  pair: string; 
  side: 'BUY'|'SELL'; 
  fillPrice: number; 
  qty?: number; 
  pnl?: number; 
  ts: number;
};

export type PreviewBinary = {
  t: 'binary_preview'; 
  broker: 'zaffer';
  asset: string; 
  dir: 'CALL'|'PUT'; 
  strike: number; 
  expiry: number; 
  amount: number; 
  conf?: number; 
  ts: number;
};

export type ExecutedBinary = {
  t: 'binary_executed'; 
  broker: 'zaffer';
  ticketId: string; 
  asset: string; 
  result: 'WIN'|'LOSE'|'PENDING'; 
  amount: number; 
  payout?: number; 
  net?: number; 
  ts: number;
};

export type WsEvent = PreviewSpot | ExecutedSpot | PreviewBinary | ExecutedBinary;

// Handler recomendado para eventos WS
export function onMsg(evt: WsEvent) {
  switch (evt.t) {
    case 'preview':
      // pintar ◇, actualizar HUD Grid/SLTP
      console.log('[WS] Preview event:', evt);
      break;
    case 'executed':
      // pintar ◆, actualizar KPIs/logs/timeline
      console.log('[WS] Executed event:', evt);
      break;
    case 'binary_preview':
      // set strike+expiry+amount y disparar BinaryHUD
      console.log('[WS] Binary preview event:', evt);
      break;
    case 'binary_executed':
      // cerrar countdown, mostrar resultado y actualizar KPIs
      console.log('[WS] Binary executed event:', evt);
      break;
  }
}

// Helper functions for event validation
export function isValidWsEvent(event: any): event is WsEvent {
  return event && 
         typeof event.t === 'string' && 
         typeof event.ts === 'number' &&
         ['preview', 'executed', 'binary_preview', 'binary_executed'].includes(event.t);
}

export function isPreviewEvent(event: WsEvent): event is PreviewSpot | PreviewBinary {
  return event.t === 'preview' || event.t === 'binary_preview';
}

export function isExecutedEvent(event: WsEvent): event is ExecutedSpot | ExecutedBinary {
  return event.t === 'executed' || event.t === 'binary_executed';
}

export function isBinaryEvent(event: WsEvent): event is PreviewBinary | ExecutedBinary {
  return event.t === 'binary_preview' || event.t === 'binary_executed';
}

export function isSpotEvent(event: WsEvent): event is PreviewSpot | ExecutedSpot {
  return event.t === 'preview' || event.t === 'executed';
}
