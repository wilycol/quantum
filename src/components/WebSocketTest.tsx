// src/components/WebSocketTest.tsx
// Componente de prueba para WebSocket Edge

import React, { useState, useEffect } from 'react';
import { connectWS } from '../lib/wsClient';

export default function WebSocketTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Para desarrollo local, usar el servidor WebSocket dedicado
    const url = 'ws://localhost:3001';
    
    console.log('[WebSocketTest] Connecting to:', url);
    
    const websocket = new WebSocket(url);
    setWs(websocket);

    websocket.addEventListener('open', () => {
      console.log('[WebSocketTest] Connected!');
      setConnected(true);
      addMessage('✅ Conectado al WebSocket Edge');
      
      // Enviar mensaje de prueba
      websocket.send(JSON.stringify({ op: 'hello' }));
    });

    websocket.addEventListener('message', (event) => {
      console.log('[WebSocketTest] Message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        addMessage(`📨 ${data.op}: ${JSON.stringify(data)}`);
      } catch {
        addMessage(`📨 Raw: ${event.data}`);
      }
    });

    websocket.addEventListener('error', (error) => {
      console.error('[WebSocketTest] Error:', error);
      addMessage('❌ Error en WebSocket');
    });

    websocket.addEventListener('close', () => {
      console.log('[WebSocketTest] Disconnected');
      setConnected(false);
      addMessage('🔌 Desconectado del WebSocket');
    });

    return () => {
      websocket.close();
    };
  }, []);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const sendPing = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: 'ping' }));
      addMessage('📤 Enviando ping...');
    }
  };

  const sendTestMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const testMsg = { 
        op: 'test', 
        data: { 
          message: 'Hello from Quantum Core!', 
          timestamp: Date.now() 
        } 
      };
      ws.send(JSON.stringify(testMsg));
      addMessage('📤 Enviando mensaje de prueba...');
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        🧪 WebSocket Edge Test
      </h3>
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`px-3 py-1 rounded text-sm font-medium ${
          connected 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {connected ? '🟢 Conectado' : '🔴 Desconectado'}
        </div>
        
        <button
          onClick={sendPing}
          disabled={!connected}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Ping
        </button>
        
        <button
          onClick={sendTestMessage}
          disabled={!connected}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Test Message
        </button>
      </div>

      <div className="bg-gray-900 rounded p-3 h-48 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2">Mensajes del WebSocket:</div>
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm">Esperando conexión...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="text-xs text-gray-300 mb-1 font-mono">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
