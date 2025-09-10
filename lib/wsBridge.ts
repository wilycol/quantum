import { useEventBus } from './eventBus';
import { connectWS, onMessage, onConnected, onDisconnected } from './wsClient';

let wired = false;

export function wireWSBridge() {
  if (wired) return; 
  wired = true;
  
  console.log('[WS Bridge] Wiring WebSocket bridge to EventBus');
  const emit = useEventBus.getState().emit;

  // Connect to real WebSocket
  connectWS('/api/ws');

  // Set up event listeners
  onConnected(() => {
    console.log('[WS Bridge] WebSocket connected');
    emit({ type:'ws/connected', t:Date.now() });
  });
  
  onDisconnected(() => {
    console.log('[WS Bridge] WebSocket disconnected');
    emit({ type:'ws/disconnected', t:Date.now() });
  });
  
  onMessage((m:any) => {
    console.log('[WS Bridge] Received message:', m);
    
    if (m.op === 'preview_trade') {
      emit({ 
        type:'signal/preview', 
        pair:m.symbol || m.pair, 
        side:m.side || 'BUY', 
        t:m.t || Date.now() 
      });
    }
    if (m.op === 'order_accepted') {
      emit({ 
        type:'order/accepted', 
        id:m.id, 
        symbol:m.symbol, 
        side:m.side || 'BUY', 
        price:m.price, 
        amountUsd:m.amountUsd, 
        t:m.t || Date.now() 
      });
    }
    if (m.op === 'order_filled') {
      emit({ 
        type:'order/filled', 
        id:m.id, 
        symbol:m.symbol, 
        side:m.side, 
        price:m.price, 
        qty:m.qty, 
        pnl:m.pnl, 
        t:m.t || Date.now() 
      });
    }
    if (m.op === 'error') {
      emit({ 
        type:'risk/error', 
        code:m.code, 
        detail:m.detail, 
        t:m.t || Date.now() 
      });
    }
  });
}
