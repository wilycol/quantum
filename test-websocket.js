// test-websocket.js
// Script de prueba para WebSocket Edge

import WebSocket from 'ws';

async function testWebSocket() {
  console.log('🧪 Probando WebSocket Edge...\n');
  
  // URL del WebSocket (ajustar según el entorno)
  const wsUrl = process.env.WS_URL || 'ws://localhost:5173/api/ws';
  
  console.log(`📡 Conectando a: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('✅ Conectado al WebSocket Edge!');
    
    // Enviar mensaje de saludo
    console.log('📤 Enviando hello...');
    ws.send(JSON.stringify({ op: 'hello' }));
    
    // Enviar ping después de 1 segundo
    setTimeout(() => {
      console.log('📤 Enviando ping...');
      ws.send(JSON.stringify({ op: 'ping' }));
    }, 1000);
    
    // Enviar mensaje de prueba después de 2 segundos
    setTimeout(() => {
      console.log('📤 Enviando mensaje de prueba...');
      ws.send(JSON.stringify({ 
        op: 'test', 
        data: { 
          message: 'Hello from test script!', 
          timestamp: Date.now() 
        } 
      }));
    }, 2000);
    
    // Cerrar conexión después de 5 segundos
    setTimeout(() => {
      console.log('🔌 Cerrando conexión...');
      ws.close();
    }, 5000);
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Mensaje recibido:`, message);
    } catch (error) {
      console.log(`📨 Mensaje raw:`, data.toString());
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Conexión cerrada. Código: ${code}, Razón: ${reason}`);
    console.log('\n✅ Prueba completada!');
  });
}

// Ejecutar prueba
testWebSocket().catch(console.error);
