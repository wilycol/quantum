// src/lib/websocketManager.ts
// Manager Principal para WebSocket con Redundancia y Respaldo del Quantum CORE

import { WebSocketRedundancyManager, getRedundancyManager, initializeWebSocketRedundancy } from './websocketRedundancy';
import { WebSocketHealthMonitor, getHealthMonitor, initializeHealthMonitoring } from './websocketHealthMonitor';
import { WebSocketBackupServices, getBackupServices, initializeBackupServices } from './websocketBackupServices';
import { useEventBus } from '../hooks/useEventBus';

export interface WebSocketManagerConfig {
  enableRedundancy: boolean;
  enableHealthMonitoring: boolean;
  enableBackupServices: boolean;
  autoFailover: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface WebSocketManagerStatus {
  isConnected: boolean;
  activeConnection: string | null;
  healthScore: number;
  backupActive: boolean;
  lastError: string | null;
  uptime: number;
  messageCount: number;
  failoverCount: number;
}

export class WebSocketManager {
  private redundancyManager: WebSocketRedundancyManager | null = null;
  private healthMonitor: WebSocketHealthMonitor | null = null;
  private backupServices: WebSocketBackupServices | null = null;
  private eventBus: any;
  private config: WebSocketManagerConfig;
  private isInitialized = false;
  private startTime: number = 0;
  private messageCount = 0;
  private lastError: string | null = null;

  constructor(config: WebSocketManagerConfig) {
    this.config = config;
    this.eventBus = useEventBus.getState();
    this.startTime = Date.now();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[WS Manager] Already initialized');
      return;
    }

    console.log('[WS Manager] Initializing WebSocket Manager...');

    try {
      // Inicializar Health Monitoring
      if (this.config.enableHealthMonitoring) {
        this.healthMonitor = getHealthMonitor();
        initializeHealthMonitoring();
        console.log('[WS Manager] Health monitoring initialized');
      }

      // Inicializar Backup Services
      if (this.config.enableBackupServices) {
        this.backupServices = getBackupServices();
        const backupSuccess = await initializeBackupServices();
        if (backupSuccess) {
          console.log('[WS Manager] Backup services initialized');
        } else {
          console.warn('[WS Manager] Backup services failed to initialize');
        }
      }

      // Inicializar Redundancy Manager
      if (this.config.enableRedundancy) {
        this.redundancyManager = getRedundancyManager();
        await initializeWebSocketRedundancy();
        console.log('[WS Manager] Redundancy manager initialized');
      }

      // Configurar event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[WS Manager] WebSocket Manager initialized successfully');

      // Emitir evento de inicialización
      this.eventBus.emit({
        type: 'ws/manager_initialized',
        config: this.config,
        t: Date.now()
      });

    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WS Manager] Initialization failed:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    // Escuchar eventos de conexión
    this.eventBus.on('ws/connected', (data: any) => {
      this.onConnected(data);
    });

    this.eventBus.on('ws/disconnected', (data: any) => {
      this.onDisconnected(data);
    });

    this.eventBus.on('ws/connection_changed', (data: any) => {
      this.onConnectionChanged(data);
    });

    this.eventBus.on('ws/failover_activated', (data: any) => {
      this.onFailoverActivated(data);
    });

    this.eventBus.on('ws/backup_activated', (data: any) => {
      this.onBackupActivated(data);
    });

    this.eventBus.on('health/alert', (data: any) => {
      this.onHealthAlert(data);
    });

    this.eventBus.on('health/metrics', (data: any) => {
      this.onHealthMetrics(data);
    });
  }

  private onConnected(data: any) {
    console.log('[WS Manager] Connected to WebSocket');
    this.lastError = null;
    
    // Emitir evento de estado actualizado
    this.emitStatusUpdate();
  }

  private onDisconnected(data: any) {
    console.log('[WS Manager] Disconnected from WebSocket');
    this.lastError = data.reason || 'Connection lost';
    
    // Activar respaldo si está disponible
    if (this.config.enableBackupServices && this.backupServices) {
      console.log('[WS Manager] Activating backup services...');
      this.backupServices.activateBackup();
    }
    
    this.emitStatusUpdate();
  }

  private onConnectionChanged(data: any) {
    console.log(`[WS Manager] Connection changed to ${data.connectionId}`);
    this.emitStatusUpdate();
  }

  private onFailoverActivated(data: any) {
    console.log(`[WS Manager] Failover activated: ${data.fromConnection} → ${data.toConnection}`);
    this.emitStatusUpdate();
  }

  private onBackupActivated(data: any) {
    console.log(`[WS Manager] Backup service activated: ${data.serviceName}`);
    this.emitStatusUpdate();
  }

  private onHealthAlert(data: any) {
    const alert = data.alert;
    console.log(`[WS Manager] Health Alert [${alert.severity}]: ${alert.message}`);
    
    // Si es una alerta crítica, considerar activar respaldo
    if (alert.severity === 'critical' && this.config.enableBackupServices && this.backupServices) {
      console.log('[WS Manager] Critical alert received, ensuring backup is active');
      this.backupServices.activateBackup();
    }
  }

  private onHealthMetrics(data: any) {
    // Actualizar métricas internas
    this.emitStatusUpdate();
  }

  private emitStatusUpdate() {
    const status = this.getStatus();
    this.eventBus.emit({
      type: 'ws/status_update',
      status,
      t: Date.now()
    });
  }

  send(message: any): boolean {
    if (!this.isInitialized) {
      console.warn('[WS Manager] Not initialized');
      return false;
    }

    try {
      let success = false;

      // Intentar enviar a través del WebSocket principal
      if (this.redundancyManager) {
        success = this.redundancyManager.send(message);
      }

      // Si falla, intentar con el servicio de respaldo
      if (!success && this.backupServices) {
        success = this.backupServices.sendMessage(message);
      }

      if (success) {
        this.messageCount++;
      } else {
        this.lastError = 'Failed to send message through any channel';
        console.error('[WS Manager] Failed to send message');
      }

      return success;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WS Manager] Error sending message:', error);
      return false;
    }
  }

  getStatus(): WebSocketManagerStatus {
    const uptime = Date.now() - this.startTime;
    
    let isConnected = false;
    let activeConnection: string | null = null;
    let healthScore = 0;
    let backupActive = false;
    let failoverCount = 0;

    // Obtener estado del redundancy manager
    if (this.redundancyManager) {
      const redundancyStatus = this.redundancyManager.getStatus();
      isConnected = redundancyStatus.activeConnection?.status === 'connected';
      activeConnection = redundancyStatus.activeConnection?.id || null;
    }

    // Obtener métricas de salud
    if (this.healthMonitor) {
      const healthMetrics = this.healthMonitor.getHealthStatus();
      if (healthMetrics) {
        healthScore = this.healthMonitor.getHealthScore();
        failoverCount = healthMetrics.failoverCount;
      }
    }

    // Obtener estado de respaldo
    if (this.backupServices) {
      const backupStatus = this.backupServices.getStatus();
      backupActive = backupStatus.activeService?.status === 'active';
    }

    return {
      isConnected,
      activeConnection,
      healthScore,
      backupActive,
      lastError: this.lastError,
      uptime,
      messageCount: this.messageCount,
      failoverCount
    };
  }

  getHealthMetrics() {
    return this.healthMonitor?.getHealthStatus() || null;
  }

  getActiveAlerts() {
    return this.healthMonitor?.getActiveAlerts() || [];
  }

  getBackupStatus() {
    return this.backupServices?.getStatus() || null;
  }

  async reconnect(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('[WS Manager] Not initialized, cannot reconnect');
      return false;
    }

    console.log('[WS Manager] Attempting to reconnect...');

    try {
      if (this.redundancyManager) {
        await this.redundancyManager.connect();
        return true;
      }
      return false;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Reconnection failed';
      console.error('[WS Manager] Reconnection failed:', error);
      return false;
    }
  }

  destroy() {
    console.log('[WS Manager] Destroying WebSocket Manager...');

    if (this.redundancyManager) {
      this.redundancyManager.disconnect();
    }

    if (this.healthMonitor) {
      this.healthMonitor.destroy();
    }

    if (this.backupServices) {
      this.backupServices.deactivate();
    }

    this.isInitialized = false;
    console.log('[WS Manager] WebSocket Manager destroyed');
  }
}

// Configuración por defecto para Quantum CORE
export const DEFAULT_WS_MANAGER_CONFIG: WebSocketManagerConfig = {
  enableRedundancy: true,
  enableHealthMonitoring: true,
  enableBackupServices: true,
  autoFailover: true,
  maxRetries: 5,
  retryDelay: 2000
};

// Instancia global del manager
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(DEFAULT_WS_MANAGER_CONFIG);
  }
  return wsManager;
}

export async function initializeWebSocketManager(): Promise<void> {
  const manager = getWebSocketManager();
  await manager.initialize();
}

export function destroyWebSocketManager(): void {
  if (wsManager) {
    wsManager.destroy();
    wsManager = null;
  }
}
