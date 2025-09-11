// src/lib/websocketRedundancy.ts
// Sistema de Redundancia y Respaldo para WebSocket del Quantum CORE

import { useEventBus } from '../hooks/useEventBus';

export interface WebSocketConnection {
  id: string;
  url: string;
  ws: WebSocket | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  lastPing: number;
  latency: number;
  priority: number; // 1 = primario, 2 = secundario, 3 = terciario
  retryCount: number;
  maxRetries: number;
}

export interface RedundancyConfig {
  primaryUrl: string;
  secondaryUrls: string[];
  healthCheckInterval: number;
  failoverThreshold: number; // ms sin respuesta para activar failover
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
}

export class WebSocketRedundancyManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private activeConnection: WebSocketConnection | null = null;
  private config: RedundancyConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private eventBus: any;
  private isInitialized = false;

  constructor(config: RedundancyConfig) {
    this.config = config;
    this.eventBus = useEventBus.getState();
    this.initializeConnections();
  }

  private initializeConnections() {
    // Conexión primaria
    this.addConnection('primary', this.config.primaryUrl, 1);
    
    // Conexiones secundarias
    this.config.secondaryUrls.forEach((url, index) => {
      this.addConnection(`secondary_${index + 1}`, url, index + 2);
    });

    this.isInitialized = true;
    console.log('[WS Redundancy] Initialized with', this.connections.size, 'connections');
  }

  private addConnection(id: string, url: string, priority: number) {
    const connection: WebSocketConnection = {
      id,
      url,
      ws: null,
      status: 'disconnected',
      lastPing: 0,
      latency: 0,
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };
    
    this.connections.set(id, connection);
  }

  async connect(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RedundancyManager not initialized');
    }

    console.log('[WS Redundancy] Starting connection process...');
    
    // Intentar conectar en orden de prioridad
    const sortedConnections = Array.from(this.connections.values())
      .sort((a, b) => a.priority - b.priority);

    for (const connection of sortedConnections) {
      try {
        await this.connectToEndpoint(connection);
        if (connection.status === 'connected') {
          this.setActiveConnection(connection);
          this.startHealthCheck();
          console.log(`[WS Redundancy] Connected to ${connection.id} (${connection.url})`);
          return;
        }
      } catch (error) {
        console.warn(`[WS Redundancy] Failed to connect to ${connection.id}:`, error);
        connection.status = 'failed';
      }
    }

    throw new Error('All WebSocket connections failed');
  }

  private async connectToEndpoint(connection: WebSocketConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.status = 'connecting';
      
      try {
        connection.ws = new WebSocket(connection.url);
        
        const timeout = setTimeout(() => {
          if (connection.ws && connection.ws.readyState === WebSocket.CONNECTING) {
            connection.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 segundos timeout

        connection.ws.onopen = () => {
          clearTimeout(timeout);
          connection.status = 'connected';
          connection.retryCount = 0;
          connection.lastPing = Date.now();
          
          // Enviar ping inicial
          this.sendPing(connection);
          resolve();
        };

        connection.ws.onmessage = (event) => {
          this.handleMessage(connection, event);
        };

        connection.ws.onclose = (event) => {
          clearTimeout(timeout);
          connection.status = 'disconnected';
          console.log(`[WS Redundancy] Connection ${connection.id} closed:`, event.code, event.reason);
          
          // Intentar reconexión si no es el cierre intencional
          if (event.code !== 1000 && connection.retryCount < connection.maxRetries) {
            this.scheduleReconnect(connection);
          }
        };

        connection.ws.onerror = (error) => {
          clearTimeout(timeout);
          connection.status = 'failed';
          console.error(`[WS Redundancy] Connection ${connection.id} error:`, error);
          reject(error);
        };

      } catch (error) {
        connection.status = 'failed';
        reject(error);
      }
    });
  }

  private handleMessage(connection: WebSocketConnection, event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      
      // Calcular latencia si es un pong
      if (message.op === 'pong' && message.t) {
        connection.latency = Date.now() - message.t;
        connection.lastPing = Date.now();
      }

      // Reenviar mensaje al EventBus
      this.eventBus.emit(message);
      
    } catch (error) {
      console.error('[WS Redundancy] Error parsing message:', error);
    }
  }

  private sendPing(connection: WebSocketConnection) {
    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      const pingMessage = {
        op: 'ping',
        t: Date.now(),
        connectionId: connection.id
      };
      
      connection.ws.send(JSON.stringify(pingMessage));
    }
  }

  private scheduleReconnect(connection: WebSocketConnection) {
    if (connection.retryCount >= connection.maxRetries) {
      console.log(`[WS Redundancy] Max retries reached for ${connection.id}`);
      return;
    }

    connection.retryCount++;
    const delay = this.config.retryDelay * Math.pow(2, connection.retryCount - 1); // Backoff exponencial
    
    console.log(`[WS Redundancy] Scheduling reconnect for ${connection.id} in ${delay}ms (attempt ${connection.retryCount})`);
    
    setTimeout(() => {
      this.connectToEndpoint(connection).catch(error => {
        console.error(`[WS Redundancy] Reconnect failed for ${connection.id}:`, error);
      });
    }, delay);
  }

  private setActiveConnection(connection: WebSocketConnection) {
    // Cerrar conexión anterior si existe
    if (this.activeConnection && this.activeConnection.id !== connection.id) {
      this.closeConnection(this.activeConnection);
    }
    
    this.activeConnection = connection;
    
    // Emitir evento de cambio de conexión
    this.eventBus.emit({
      type: 'ws/connection_changed',
      connectionId: connection.id,
      url: connection.url,
      priority: connection.priority,
      t: Date.now()
    });
  }

  private startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck() {
    if (!this.activeConnection) {
      console.warn('[WS Redundancy] No active connection for health check');
      return;
    }

    const now = Date.now();
    const timeSinceLastPing = now - this.activeConnection.lastPing;
    
    // Si no hay respuesta en el threshold, activar failover
    if (timeSinceLastPing > this.config.failoverThreshold) {
      console.warn(`[WS Redundancy] Health check failed for ${this.activeConnection.id}, activating failover`);
      this.activateFailover();
    } else {
      // Enviar ping de salud
      this.sendPing(this.activeConnection);
    }
  }

  private async activateFailover() {
    console.log('[WS Redundancy] Activating failover...');
    
    // Marcar conexión actual como fallida
    if (this.activeConnection) {
      this.activeConnection.status = 'failed';
      this.closeConnection(this.activeConnection);
    }

    // Buscar siguiente conexión disponible
    const availableConnections = Array.from(this.connections.values())
      .filter(conn => conn.status !== 'failed' && conn.id !== this.activeConnection?.id)
      .sort((a, b) => a.priority - b.priority);

    for (const connection of availableConnections) {
      try {
        await this.connectToEndpoint(connection);
        if (connection.status === 'connected') {
          this.setActiveConnection(connection);
          console.log(`[WS Redundancy] Failover successful to ${connection.id}`);
          
          // Emitir evento de failover
          this.eventBus.emit({
            type: 'ws/failover_activated',
            fromConnection: this.activeConnection?.id,
            toConnection: connection.id,
            t: Date.now()
          });
          return;
        }
      } catch (error) {
        console.error(`[WS Redundancy] Failover to ${connection.id} failed:`, error);
      }
    }

    // Si todos fallan, intentar reconectar la primaria
    console.error('[WS Redundancy] All failover attempts failed, attempting primary reconnection');
    const primaryConnection = this.connections.get('primary');
    if (primaryConnection) {
      primaryConnection.retryCount = 0;
      this.scheduleReconnect(primaryConnection);
    }
  }

  private closeConnection(connection: WebSocketConnection) {
    if (connection.ws) {
      connection.ws.close(1000, 'Switching to backup connection');
      connection.ws = null;
    }
    connection.status = 'disconnected';
  }

  send(message: any): boolean {
    if (!this.activeConnection || this.activeConnection.status !== 'connected') {
      console.warn('[WS Redundancy] No active connection to send message');
      return false;
    }

    try {
      this.activeConnection.ws!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WS Redundancy] Error sending message:', error);
      return false;
    }
  }

  getStatus() {
    return {
      activeConnection: this.activeConnection ? {
        id: this.activeConnection.id,
        url: this.activeConnection.url,
        status: this.activeConnection.status,
        latency: this.activeConnection.latency,
        priority: this.activeConnection.priority
      } : null,
      allConnections: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        status: conn.status,
        latency: conn.latency,
        priority: conn.priority,
        retryCount: conn.retryCount
      }))
    };
  }

  disconnect() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.connections.forEach(connection => {
      this.closeConnection(connection);
    });

    this.activeConnection = null;
    console.log('[WS Redundancy] All connections closed');
  }
}

// Configuración por defecto para Quantum CORE
export const DEFAULT_REDUNDANCY_CONFIG: RedundancyConfig = {
  primaryUrl: 'wss://quantum-git-dev-willy-devs-projects.vercel.app/api/ws',
  secondaryUrls: [
    'wss://quantum-git-dev-willy-devs-projects.vercel.app/api/qcore',
    'ws://localhost:3001', // Para desarrollo local
    'ws://localhost:8080/ws' // Servidor local alternativo
  ],
  healthCheckInterval: 15000, // 15 segundos
  failoverThreshold: 30000, // 30 segundos sin respuesta
  maxRetries: 5,
  retryDelay: 2000, // 2 segundos base
  heartbeatInterval: 10000 // 10 segundos
};

// Instancia global del manager
let redundancyManager: WebSocketRedundancyManager | null = null;

export function getRedundancyManager(): WebSocketRedundancyManager {
  if (!redundancyManager) {
    redundancyManager = new WebSocketRedundancyManager(DEFAULT_REDUNDANCY_CONFIG);
  }
  return redundancyManager;
}

export function initializeWebSocketRedundancy(): Promise<void> {
  const manager = getRedundancyManager();
  return manager.connect();
}
