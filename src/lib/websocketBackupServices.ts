// src/lib/websocketBackupServices.ts
// Servicios de Respaldo Paralelos para WebSocket del Quantum CORE

import { useEventBus } from './eventBus';

export interface BackupService {
  id: string;
  name: string;
  type: 'server_sent_events' | 'polling' | 'local_storage' | 'indexed_db';
  status: 'active' | 'standby' | 'failed';
  priority: number;
  config: any;
  lastSync: number;
  messageQueue: any[];
}

export interface BackupServiceConfig {
  sseEndpoint: string;
  pollingInterval: number;
  maxQueueSize: number;
  syncInterval: number;
}

export class WebSocketBackupServices {
  private services: Map<string, BackupService> = new Map();
  private eventBus: any;
  private activeService: BackupService | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private config: BackupServiceConfig;

  constructor(config: BackupServiceConfig) {
    this.config = config;
    this.eventBus = useEventBus.getState();
    this.initializeServices();
  }

  private initializeServices() {
    // Servicio 1: Server-Sent Events (SSE)
    this.addService('sse', {
      id: 'sse',
      name: 'Server-Sent Events',
      type: 'server_sent_events',
      status: 'standby',
      priority: 1,
      config: {
        endpoint: this.config.sseEndpoint,
        eventSource: null
      },
      lastSync: 0,
      messageQueue: []
    });

    // Servicio 2: Polling HTTP
    this.addService('polling', {
      id: 'polling',
      name: 'HTTP Polling',
      type: 'polling',
      status: 'standby',
      priority: 2,
      config: {
        interval: this.config.pollingInterval,
        endpoint: '/api/events/poll',
        lastTimestamp: 0
      },
      lastSync: 0,
      messageQueue: []
    });

    // Servicio 3: Local Storage
    this.addService('local_storage', {
      id: 'local_storage',
      name: 'Local Storage',
      type: 'local_storage',
      status: 'standby',
      priority: 3,
      config: {
        key: 'quantum_ws_backup',
        maxSize: 1000
      },
      lastSync: 0,
      messageQueue: []
    });

    // Servicio 4: IndexedDB
    this.addService('indexed_db', {
      id: 'indexed_db',
      name: 'IndexedDB',
      type: 'indexed_db',
      status: 'standby',
      priority: 4,
      config: {
        dbName: 'QuantumWSBackup',
        storeName: 'messages',
        version: 1
      },
      lastSync: 0,
      messageQueue: []
    });

    console.log('[WS Backup] Initialized', this.services.size, 'backup services');
  }

  private addService(id: string, service: BackupService) {
    this.services.set(id, service);
  }

  async activateBackup(): Promise<boolean> {
    console.log('[WS Backup] Activating backup services...');
    
    // Intentar activar servicios en orden de prioridad
    const sortedServices = Array.from(this.services.values())
      .sort((a, b) => a.priority - b.priority);

    for (const service of sortedServices) {
      try {
        const success = await this.activateService(service);
        if (success) {
          this.activeService = service;
          this.startSync();
          console.log(`[WS Backup] Activated ${service.name} as backup`);
          
          this.eventBus.emit({
            type: 'ws/backup_activated',
            serviceId: service.id,
            serviceName: service.name,
            t: Date.now()
          });
          
          return true;
        }
      } catch (error) {
        console.error(`[WS Backup] Failed to activate ${service.name}:`, error);
        service.status = 'failed';
      }
    }

    console.error('[WS Backup] All backup services failed to activate');
    return false;
  }

  private async activateService(service: BackupService): Promise<boolean> {
    switch (service.type) {
      case 'server_sent_events':
        return this.activateSSE(service);
      case 'polling':
        return this.activatePolling(service);
      case 'local_storage':
        return this.activateLocalStorage(service);
      case 'indexed_db':
        return this.activateIndexedDB(service);
      default:
        return false;
    }
  }

  private async activateSSE(service: BackupService): Promise<boolean> {
    try {
      const eventSource = new EventSource(service.config.endpoint);
      
      eventSource.onopen = () => {
        service.status = 'active';
        console.log('[WS Backup] SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleBackupMessage(service, message);
        } catch (error) {
          console.error('[WS Backup] Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[WS Backup] SSE error:', error);
        service.status = 'failed';
        eventSource.close();
      };

      service.config.eventSource = eventSource;
      return true;
    } catch (error) {
      console.error('[WS Backup] SSE activation failed:', error);
      return false;
    }
  }

  private async activatePolling(service: BackupService): Promise<boolean> {
    try {
      const poll = async () => {
        try {
          const response = await fetch(service.config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lastTimestamp: service.config.lastTimestamp
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              data.messages.forEach((message: any) => {
                this.handleBackupMessage(service, message);
              });
              service.config.lastTimestamp = data.lastTimestamp;
            }
            service.status = 'active';
          }
        } catch (error) {
          console.error('[WS Backup] Polling error:', error);
          service.status = 'failed';
        }
      };

      // Polling inicial
      await poll();
      
      // Configurar polling periódico
      setInterval(poll, service.config.interval);
      
      return service.status === 'active';
    } catch (error) {
      console.error('[WS Backup] Polling activation failed:', error);
      return false;
    }
  }

  private async activateLocalStorage(service: BackupService): Promise<boolean> {
    try {
      // Verificar si localStorage está disponible
      if (typeof Storage === 'undefined') {
        throw new Error('LocalStorage not available');
      }

      // Cargar mensajes existentes
      const stored = localStorage.getItem(service.config.key);
      if (stored) {
        const messages = JSON.parse(stored);
        service.messageQueue = messages.slice(-service.config.maxSize);
      }

      service.status = 'active';
      return true;
    } catch (error) {
      console.error('[WS Backup] LocalStorage activation failed:', error);
      return false;
    }
  }

  private async activateIndexedDB(service: BackupService): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(service.config.dbName, service.config.version);
        
        request.onerror = () => {
          console.error('[WS Backup] IndexedDB error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const db = request.result;
          service.config.db = db;
          service.status = 'active';
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(service.config.storeName)) {
            const store = db.createObjectStore(service.config.storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } catch (error) {
      console.error('[WS Backup] IndexedDB activation failed:', error);
      return false;
    }
  }

  private handleBackupMessage(service: BackupService, message: any) {
    // Agregar a la cola del servicio
    service.messageQueue.push({
      ...message,
      receivedAt: Date.now(),
      serviceId: service.id
    });

    // Limitar tamaño de la cola
    if (service.messageQueue.length > this.config.maxQueueSize) {
      service.messageQueue.shift();
    }

    // Reenviar al EventBus
    this.eventBus.emit(message);

    // Actualizar timestamp de sincronización
    service.lastSync = Date.now();
  }

  private startSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncMessages();
    }, this.config.syncInterval);
  }

  private async syncMessages() {
    if (!this.activeService) return;

    try {
      switch (this.activeService.type) {
        case 'local_storage':
          await this.syncLocalStorage(this.activeService);
          break;
        case 'indexed_db':
          await this.syncIndexedDB(this.activeService);
          break;
      }
    } catch (error) {
      console.error('[WS Backup] Sync error:', error);
    }
  }

  private async syncLocalStorage(service: BackupService) {
    try {
      const data = JSON.stringify(service.messageQueue);
      localStorage.setItem(service.config.key, data);
    } catch (error) {
      console.error('[WS Backup] LocalStorage sync error:', error);
    }
  }

  private async syncIndexedDB(service: BackupService) {
    try {
      const db = service.config.db;
      const transaction = db.transaction([service.config.storeName], 'readwrite');
      const store = transaction.objectStore(service.config.storeName);

      // Agregar mensajes nuevos
      for (const message of service.messageQueue) {
        await new Promise((resolve, reject) => {
          const request = store.put({
            id: `${message.t}_${service.id}`,
            ...message
          });
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('[WS Backup] IndexedDB sync error:', error);
    }
  }

  sendMessage(message: any): boolean {
    if (!this.activeService) {
      console.warn('[WS Backup] No active backup service to send message');
      return false;
    }

    try {
      // Agregar mensaje a la cola del servicio activo
      this.handleBackupMessage(this.activeService, message);
      return true;
    } catch (error) {
      console.error('[WS Backup] Error sending message:', error);
      return false;
    }
  }

  getStatus() {
    return {
      activeService: this.activeService ? {
        id: this.activeService.id,
        name: this.activeService.name,
        type: this.activeService.type,
        status: this.activeService.status,
        lastSync: this.activeService.lastSync,
        queueSize: this.activeService.messageQueue.length
      } : null,
      allServices: Array.from(this.services.values()).map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status,
        priority: service.priority,
        lastSync: service.lastSync,
        queueSize: service.messageQueue.length
      }))
    };
  }

  deactivate() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Cerrar conexiones activas
    this.services.forEach(service => {
      if (service.type === 'server_sent_events' && service.config.eventSource) {
        service.config.eventSource.close();
      }
      service.status = 'standby';
    });

    this.activeService = null;
    console.log('[WS Backup] All backup services deactivated');
  }
}

// Configuración por defecto
export const DEFAULT_BACKUP_CONFIG: BackupServiceConfig = {
  sseEndpoint: '/api/events/sse',
  pollingInterval: 5000, // 5 segundos
  maxQueueSize: 1000,
  syncInterval: 10000 // 10 segundos
};

// Instancia global
let backupServices: WebSocketBackupServices | null = null;

export function getBackupServices(): WebSocketBackupServices {
  if (!backupServices) {
    backupServices = new WebSocketBackupServices(DEFAULT_BACKUP_CONFIG);
  }
  return backupServices;
}

export function initializeBackupServices(): Promise<boolean> {
  const services = getBackupServices();
  return services.activateBackup();
}
