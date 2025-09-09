// ws-mock.mjs
// WebSocket Mock Server for QuantumCore v2 Development

import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fixtures
const fixtures = {
  preview_spot: JSON.parse(readFileSync(join(__dirname, 'fixtures', 'preview_spot.json'), 'utf8')),
  executed_spot: JSON.parse(readFileSync(join(__dirname, 'fixtures', 'executed_spot.json'), 'utf8')),
  preview_binary: JSON.parse(readFileSync(join(__dirname, 'fixtures', 'preview_binary.json'), 'utf8')),
  executed_binary: JSON.parse(readFileSync(join(__dirname, 'fixtures', 'executed_binary.json'), 'utf8'))
};

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: 8080,
  path: '/ws'
});

console.log('🚀 WebSocket Mock Server running on ws://localhost:8080/ws');

// Event sequence
const eventSequence = [
  'preview_spot',
  'executed_spot', 
  'preview_binary',
  'executed_binary'
];

let currentEventIndex = 0;
let intervalId = null;

// Send event to all connected clients
function broadcastEvent(eventType) {
  const event = { ...fixtures[eventType] };
  
  // Update timestamp
  event.ts = Date.now();
  
  // Add some randomness to prices
  if (event.price) {
    event.price = event.price + (Math.random() - 0.5) * 100;
  }
  if (event.fillPrice) {
    event.fillPrice = event.fillPrice + (Math.random() - 0.5) * 50;
  }
  if (event.strike) {
    event.strike = event.strike + (Math.random() - 0.5) * 50;
  }
  
  // Add some randomness to confidence
  if (event.conf) {
    event.conf = Math.max(0.3, Math.min(0.9, event.conf + (Math.random() - 0.5) * 0.2));
  }
  
  const message = JSON.stringify({
    type: 'event',
    data: event,
    timestamp: Date.now()
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      console.log(`📡 Sent ${eventType}:`, event.t || event.ticketId || event.orderId);
    }
  });
}

// Start event broadcasting
function startEventBroadcast() {
  if (intervalId) return;
  
  console.log('⏰ Starting event broadcast every 2 seconds...');
  
  intervalId = setInterval(() => {
    const eventType = eventSequence[currentEventIndex];
    broadcastEvent(eventType);
    
    currentEventIndex = (currentEventIndex + 1) % eventSequence.length;
  }, 2000);
}

// Stop event broadcasting
function stopEventBroadcast() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏹️ Event broadcast stopped');
  }
}

// Handle new connections
wss.on('connection', (ws, req) => {
  console.log('🔌 New client connected from:', req.socket.remoteAddress);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    data: { message: 'Connected to QuantumCore Mock WebSocket' },
    timestamp: Date.now()
  }));
  
  // Start broadcasting if this is the first client
  if (wss.clients.size === 1) {
    startEventBroadcast();
  }
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type);
      
      // Handle ping
      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      }
      
      // Handle state updates
      if (message.type === 'event' && message.data) {
        console.log('📊 State update received:', message.data);
      }
      
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    
    // Stop broadcasting if no clients connected
    if (wss.clients.size === 0) {
      stopEventBroadcast();
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('❌ WebSocket Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket Mock Server...');
  stopEventBroadcast();
  wss.close(() => {
    console.log('✅ WebSocket Mock Server closed');
    process.exit(0);
  });
});

console.log('📋 Available events:');
console.log('  - preview_spot: Spot trading preview');
console.log('  - executed_spot: Spot trading executed');
console.log('  - preview_binary: Binary options preview');
console.log('  - executed_binary: Binary options executed');
console.log('\n🎯 Events will be broadcast every 2 seconds');
console.log('💡 Press Ctrl+C to stop the server');
