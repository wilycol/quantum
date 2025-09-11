// src/components/WebSocketStatusPanel.tsx
// Panel de Estado del Sistema de Redundancia WebSocket

import React, { useState, useEffect } from 'react';
import { getWebSocketManager } from '../lib/websocketManager';

interface WebSocketStatusPanelProps {
  className?: string;
  showDetails?: boolean;
}

export default function WebSocketStatusPanel({ 
  className = '', 
  showDetails = false 
}: WebSocketStatusPanelProps) {
  const [status, setStatus] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [backupStatus, setBackupStatus] = useState<any>(null);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const manager = getWebSocketManager();
        setStatus(manager.getStatus());
        setHealthMetrics(manager.getHealthMetrics());
        setAlerts(manager.getActiveAlerts());
        setBackupStatus(manager.getBackupStatus());
      } catch (error) {
        console.error('[WS Status] Error getting status:', error);
      }
    };

    // Actualizar estado inicial
    updateStatus();

    // Actualizar cada 5 segundos
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (!status) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 ${className}`}>
        <div className="text-gray-400 text-sm">Cargando estado del WebSocket...</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">WebSocket Status</h3>
        <div className={`w-2 h-2 rounded-full ${
          status.isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>

      {/* Estado Principal */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Conexión:</span>
          <span className={getStatusColor(status.isConnected ? 'connected' : 'disconnected')}>
            {status.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {status.activeConnection && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Conexión Activa:</span>
            <span className="text-white">{status.activeConnection}</span>
          </div>
        )}

        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Health Score:</span>
          <span className={getHealthScoreColor(status.healthScore)}>
            {status.healthScore}/100
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Respaldo:</span>
          <span className={status.backupActive ? 'text-green-400' : 'text-gray-400'}>
            {status.backupActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Mensajes:</span>
          <span className="text-white">{status.messageCount}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Failovers:</span>
          <span className="text-white">{status.failoverCount}</span>
        </div>
      </div>

      {/* Alertas Activas */}
      {alerts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-300 mb-2">Alertas Activas</h4>
          <div className="space-y-1">
            {alerts.slice(0, 3).map((alert, index) => (
              <div
                key={alert.id}
                className={`text-xs p-2 rounded ${getSeverityColor(alert.severity)}`}
              >
                <div className="font-medium">{alert.type.replace('_', ' ').toUpperCase()}</div>
                <div className="text-xs opacity-75">{alert.message}</div>
              </div>
            ))}
            {alerts.length > 3 && (
              <div className="text-xs text-gray-400 text-center">
                +{alerts.length - 3} alertas más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalles Adicionales */}
      {showDetails && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-300">Detalles Técnicos</h4>
          
          {healthMetrics && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Latencia:</span>
                <span className="text-white">{healthMetrics.latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime:</span>
                <span className="text-white">{healthMetrics.uptime.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Errores:</span>
                <span className="text-white">{healthMetrics.errorCount}</span>
              </div>
            </div>
          )}

          {backupStatus && backupStatus.activeService && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Servicio Respaldo:</span>
                <span className="text-white">{backupStatus.activeService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cola:</span>
                <span className="text-white">{backupStatus.activeService.queueSize}</span>
              </div>
            </div>
          )}

          {status.lastError && (
            <div className="text-xs">
              <div className="text-gray-400 mb-1">Último Error:</div>
              <div className="text-red-400 bg-red-900/20 p-2 rounded text-xs">
                {status.lastError}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón de Reconexión */}
      {!status.isConnected && (
        <div className="mt-3">
          <button
            onClick={async () => {
              try {
                const manager = getWebSocketManager();
                await manager.reconnect();
              } catch (error) {
                console.error('[WS Status] Reconnection failed:', error);
              }
            }}
            className="w-full px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Reconectar
          </button>
        </div>
      )}
    </div>
  );
}
