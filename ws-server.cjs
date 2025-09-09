// ws-server.js
// Servidor WebSocket simple para desarrollo local

const WebSocket = require('ws');
const { createServer } = require('http');

const PORT = 3001;

// Crear servidor HTTP
const server = createServer();

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

console.log(`🚀 WebSocket server starting on port ${PORT}...`);

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection from:', req.socket.remoteAddress);
  
  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({ 
    op: 'welcome', 
    message: 'Connected to Quantum Core WebSocket!',
    timestamp: Date.now() 
  }));

  // Heartbeat cada 30 segundos
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        op: 'heartbeat', 
        timestamp: Date.now() 
      }));
    }
  }, 30000);

  // Manejar mensajes
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);

      switch (message.op) {
        case 'ping':
          ws.send(JSON.stringify({ 
            op: 'pong', 
            timestamp: Date.now() 
          }));
          break;
        
        case 'hello':
          ws.send(JSON.stringify({ 
            op: 'welcome', 
            message: 'Hello from Quantum Core!',
            timestamp: Date.now() 
          }));
          break;
        
        case 'test':
          ws.send(JSON.stringify({ 
            op: 'echo', 
            data: message,
            timestamp: Date.now() 
          }));
          break;
        
        default:
          ws.send(JSON.stringify({ 
            op: 'echo', 
            data: message,
            timestamp: Date.now() 
          }));
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({ 
        op: 'error', 
        message: 'Invalid JSON message',
        timestamp: Date.now() 
      }));
    }
  });

  // Manejar cierre de conexión
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clearInterval(heartbeat);
  });

  // Manejar errores
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clearInterval(heartbeat);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📡 Ready to accept connections!`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
