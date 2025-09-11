// api/events/poll.ts
// Endpoint de Polling HTTP para respaldo del WebSocket

import { VercelRequest, VercelResponse } from '@vercel/node';

// Simular almacenamiento de eventos (en producción sería Redis o DB)
let eventStore: any[] = [];
let lastTimestamp = Date.now();

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lastTimestamp: clientTimestamp } = req.body;

    // Generar eventos simulados (en producción vendrían del sistema real)
    const now = Date.now();
    const newEvents = [];

    // Simular eventos cada 10 segundos
    if (now - lastTimestamp > 10000) {
      newEvents.push({
        type: 'poll/heartbeat',
        timestamp: now,
        data: {
          status: 'active',
          message: 'Polling backup active'
        }
      });

      // Simular eventos de trading ocasionalmente
      if (Math.random() > 0.7) {
        newEvents.push({
          type: 'poll/trade_signal',
          timestamp: now,
          data: {
            symbol: 'BTCUSDT',
            action: 'buy',
            price: 45000 + Math.random() * 1000
          }
        });
      }

      lastTimestamp = now;
    }

    // Filtrar eventos nuevos basado en el timestamp del cliente
    const filteredEvents = newEvents.filter(event => 
      event.timestamp > (clientTimestamp || 0)
    );

    // Agregar a almacenamiento local
    eventStore.push(...filteredEvents);
    
    // Limpiar eventos antiguos (mantener solo últimos 100)
    if (eventStore.length > 100) {
      eventStore = eventStore.slice(-100);
    }

    res.status(200).json({
      success: true,
      messages: filteredEvents,
      lastTimestamp: now,
      totalEvents: eventStore.length
    });

  } catch (error) {
    console.error('[Poll] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
