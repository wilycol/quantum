// src/lib/websocketHealthMonitor.ts
// Sistema de Monitoreo de Salud para WebSocket del Quantum CORE

import { useEventBus } from './eventBus';

export interface HealthMetrics {
  connectionId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'failed';
  latency: number;
  lastPing: number;
  uptime: number;
  messageCount: number;
  errorCount: number;
  failoverCount: number;
  timestamp: number;
}

export interface HealthAlert {
  id: string;
  type: 'latency_high' | 'connection_lost' | 'failover_activated' | 'error_rate_high';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export class WebSocketHealthMonitor {
  private metrics: HealthMetrics | null = null;
  private alerts: Map<string, HealthAlert> = new Map();
  private eventBus: any;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  // Thresholds para alertas
  private readonly THRESHOLDS = {
    LATENCY_WARNING: 1000, // 1 segundo
    LATENCY_CRITICAL: 5000, // 5 segundos
    ERROR_RATE_WARNING: 0.05, // 5%
    ERROR_RATE_CRITICAL: 0.15, // 15%
    UPTIME_WARNING: 0.95, // 95%
    UPTIME_CRITICAL: 0.90 // 90%
  };

  constructor() {
    this.eventBus = useEventBus.getState();
    this.startTime = Date.now();
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Escuchar eventos del WebSocket
    this.eventBus.on('ws/connected', (data: any) => {
      this.onConnectionEstablished(data);
    });

    this.eventBus.on('ws/disconnected', (data: any) => {
      this.onConnectionLost(data);
    });

    this.eventBus.on('ws/connection_changed', (data: any) => {
      this.onConnectionChanged(data);
    });

    this.eventBus.on('ws/failover_activated', (data: any) => {
      this.onFailoverActivated(data);
    });

    this.eventBus.on('ws/pong', (data: any) => {
      this.onPongReceived(data);
    });

    this.eventBus.on('ws/error', (data: any) => {
      this.onError(data);
    });
  }

  private onConnectionEstablished(data: any) {
    this.metrics = {
      connectionId: data.connectionId || 'unknown',
      status: 'healthy',
      latency: 0,
      lastPing: Date.now(),
      uptime: 100,
      messageCount: 0,
      errorCount: 0,
      failoverCount: 0,
      timestamp: Date.now()
    };

    this.startMonitoring();
    console.log('[WS Health] Connection established, monitoring started');
  }

  private onConnectionLost(data: any) {
    if (this.metrics) {
      this.metrics.status = 'failed';
      this.metrics.timestamp = Date.now();
    }

    this.createAlert('connection_lost', 'critical', 
      `WebSocket connection lost: ${data.reason || 'Unknown reason'}`);
    
    this.stopMonitoring();
  }

  private onConnectionChanged(data: any) {
    if (this.metrics) {
      this.metrics.connectionId = data.connectionId;
      this.metrics.timestamp = Date.now();
    }

    console.log(`[WS Health] Connection changed to ${data.connectionId}`);
  }

  private onFailoverActivated(data: any) {
    if (this.metrics) {
      this.metrics.failoverCount++;
      this.metrics.status = 'degraded';
      this.metrics.timestamp = Date.now();
    }

    this.createAlert('failover_activated', 'warning',
      `Failover activated: ${data.fromConnection} → ${data.toConnection}`);
  }

  private onPongReceived(data: any) {
    if (this.metrics && data.latency) {
      this.metrics.latency = data.latency;
      this.metrics.lastPing = Date.now();
      this.metrics.messageCount++;
      
      // Verificar latencia
      if (data.latency > this.THRESHOLDS.LATENCY_CRITICAL) {
        this.metrics.status = 'critical';
        this.createAlert('latency_high', 'critical',
          `High latency detected: ${data.latency}ms`);
      } else if (data.latency > this.THRESHOLDS.LATENCY_WARNING) {
        this.metrics.status = 'degraded';
        this.createAlert('latency_high', 'warning',
          `Elevated latency: ${data.latency}ms`);
      } else {
        this.metrics.status = 'healthy';
      }
    }
  }

  private onError(data: any) {
    if (this.metrics) {
      this.metrics.errorCount++;
      this.metrics.timestamp = Date.now();
      
      // Calcular tasa de error
      const errorRate = this.metrics.errorCount / Math.max(this.metrics.messageCount, 1);
      
      if (errorRate > this.THRESHOLDS.ERROR_RATE_CRITICAL) {
        this.metrics.status = 'critical';
        this.createAlert('error_rate_high', 'critical',
          `High error rate: ${(errorRate * 100).toFixed(1)}%`);
      } else if (errorRate > this.THRESHOLDS.ERROR_RATE_WARNING) {
        this.metrics.status = 'degraded';
        this.createAlert('error_rate_high', 'warning',
          `Elevated error rate: ${(errorRate * 100).toFixed(1)}%`);
      }
    }
  }

  private createAlert(type: string, severity: 'warning' | 'critical', message: string) {
    const alertId = `${type}_${Date.now()}`;
    const alert: HealthAlert = {
      id: alertId,
      type: type as any,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    
    // Emitir alerta al EventBus
    this.eventBus.emit({
      type: 'health/alert',
      alert,
      t: Date.now()
    });

    console.log(`[WS Health] ${severity.toUpperCase()} Alert: ${message}`);
  }

  private startMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      this.performHealthCheck();
    }, 5000); // Verificar cada 5 segundos
  }

  private stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  private performHealthCheck() {
    if (!this.metrics) return;

    const now = Date.now();
    const timeSinceLastPing = now - this.metrics.lastPing;
    
    // Verificar si la conexión está respondiendo
    if (timeSinceLastPing > 30000) { // 30 segundos sin ping
      this.metrics.status = 'critical';
      this.createAlert('connection_lost', 'critical',
        'No ping response for 30+ seconds');
    }

    // Calcular uptime
    const totalTime = now - this.startTime;
    const uptime = Math.max(0, 100 - (this.metrics.errorCount / (totalTime / 1000)) * 100);
    this.metrics.uptime = Math.min(100, uptime);

    // Actualizar timestamp
    this.metrics.timestamp = now;

    // Emitir métricas de salud
    this.eventBus.emit({
      type: 'health/metrics',
      metrics: { ...this.metrics },
      t: now
    });
  }

  getHealthStatus(): HealthMetrics | null {
    return this.metrics ? { ...this.metrics } : null;
  }

  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAllAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.alerts.set(alertId, alert);
      
      this.eventBus.emit({
        type: 'health/alert_resolved',
        alertId,
        t: Date.now()
      });
      
      return true;
    }
    return false;
  }

  getHealthScore(): number {
    if (!this.metrics) return 0;

    let score = 100;
    
    // Penalizar por latencia alta
    if (this.metrics.latency > this.THRESHOLDS.LATENCY_CRITICAL) {
      score -= 30;
    } else if (this.metrics.latency > this.THRESHOLDS.LATENCY_WARNING) {
      score -= 15;
    }

    // Penalizar por errores
    const errorRate = this.metrics.errorCount / Math.max(this.metrics.messageCount, 1);
    if (errorRate > this.THRESHOLDS.ERROR_RATE_CRITICAL) {
      score -= 25;
    } else if (errorRate > this.THRESHOLDS.ERROR_RATE_WARNING) {
      score -= 10;
    }

    // Penalizar por failovers
    score -= this.metrics.failoverCount * 5;

    // Penalizar por uptime bajo
    if (this.metrics.uptime < this.THRESHOLDS.UPTIME_CRITICAL * 100) {
      score -= 20;
    } else if (this.metrics.uptime < this.THRESHOLDS.UPTIME_WARNING * 100) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  destroy() {
    this.stopMonitoring();
    this.alerts.clear();
    this.metrics = null;
  }
}

// Instancia global del monitor
let healthMonitor: WebSocketHealthMonitor | null = null;

export function getHealthMonitor(): WebSocketHealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new WebSocketHealthMonitor();
  }
  return healthMonitor;
}

export function initializeHealthMonitoring(): void {
  getHealthMonitor();
  console.log('[WS Health] Health monitoring initialized');
}
