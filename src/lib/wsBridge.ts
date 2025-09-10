import { useEventBus } from './eventBus';

let wired = false;

// Mock WebSocket client functions for now
// In a real implementation, these would connect to your actual WebSocket
function onConnected(callback: () => void) {
  // Mock connection - in real implementation, this would be from your WS client
  setTimeout(() => {
    console.log('[WS Bridge] Mock connection established');
    callback();
  }, 1000);
}

function onDisconnected(callback: () => void) {
  // Mock disconnection - in real implementation, this would be from your WS client
  // For now, we'll simulate a disconnection after 30 seconds
  setTimeout(() => {
    console.log('[WS Bridge] Mock disconnection');
    callback();
  }, 30000);
}

function onMessage(callback: (message: any) => void) {
  // Mock messages - in real implementation, this would be from your WS client
  const mockMessages = [
    { op: 'preview_trade', symbol: 'BTCUSDT', side: 'BUY', t: Date.now() },
    { op: 'order_accepted', id: 'order-1', symbol: 'BTCUSDT', side: 'BUY', price: 50000, amountUsd: 100, t: Date.now() + 1000 },
    { op: 'order_filled', id: 'order-1', symbol: 'BTCUSDT', side: 'BUY', price: 50050, qty: 0.002, pnl: 0.1, t: Date.now() + 2000 },
  ];

  mockMessages.forEach((msg, index) => {
    setTimeout(() => {
      console.log('[WS Bridge] Mock message:', msg);
      callback(msg);
    }, (index + 1) * 2000);
  });
}

export function wireWSBridge() {
  if (wired) return; 
  wired = true;
  
  console.log('[WS Bridge] Wiring WebSocket bridge to EventBus');
  const emit = useEventBus.getState().emit;

  onConnected(() => emit({ type:'ws/connected', t:Date.now() }));
  onDisconnected(() => emit({ type:'ws/disconnected', t:Date.now() }));
  
  onMessage((m:any) => {
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
