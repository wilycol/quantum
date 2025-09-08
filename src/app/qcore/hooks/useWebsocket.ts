// src/app/qcore/hooks/useWebsocket.ts
// WebSocket hook for QuantumCore v2

import { useEffect, useRef, useCallback } from 'react';
import { 
  WsEvent, 
  WSMessage, 
  WS_CONFIG, 
  DEFAULT_WS_URL,
  isValidEvent,
  isPreviewEvent,
  isExecutedEvent,
  isBinaryEvent,
  isSpotEvent
} from '../lib/wsConstants';
import { useQcoreState, useQcoreActions } from './useQcoreState';
import { LogEntry } from '../lib/types';

// WebSocket hook options
interface UseWebsocketOptions {
  url?: string;
  autoConnect?: boolean;
  debug?: boolean;
  onEvent?: (event: WsEvent) => void;
  onLog?: (log: LogEntry) => void;
}

// WebSocket hook return type
interface UseWebsocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  lastEvent: WsEvent | null;
  eventCount: number;
}

export function useWebsocket(options: UseWebsocketOptions = {}): UseWebsocketReturn {
  const {
    url = DEFAULT_WS_URL,
    autoConnect = true,
    debug = false,
    onEvent,
    onLog
  } = options;

  // State from store
  const wsStatus = useQcoreState(state => state.wsStatus);
  const broker = useQcoreState(state => state.broker);
  const mode = useQcoreState(state => state.mode);
  const assets = useQcoreState(state => state.assets);
  const risk = useQcoreState(state => state.risk);
  const grid = useQcoreState(state => state.grid);
  const binary = useQcoreState(state => state.binary);
  const volumeOn = useQcoreState(state => state.volumeOn);
  
  // Actions from store
  const { 
    setWsStatus, 
    setConnected, 
    updateKPIs,
    setKillSwitchActive 
  } = useQcoreActions();

  // Local state
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<WsEvent | null>(null);
  const eventCountRef = useRef(0);
  const errorRef = useRef<string | null>(null);

  // Logging helper
  const log = useCallback((message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', data?: any) => {
    if (debug) {
      console.log(`[WebSocket] ${message}`, data);
    }
    
    if (onLog) {
      onLog({
        id: `ws_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        level,
        message,
        data
      });
    }
  }, [debug, onLog]);

  // Send message helper
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const wsMessage: WSMessage = {
        type: 'event',
        data: message,
        timestamp: Date.now(),
        id: `msg_${Date.now()}`
      };
      
      wsRef.current.send(JSON.stringify(wsMessage));
      log('Message sent', 'INFO', wsMessage);
    } else {
      log('Cannot send message - WebSocket not connected', 'WARN');
    }
  }, [log]);

  // Send state to backend
  const sendState = useCallback(() => {
    const state = {
      broker,
      mode,
      assets,
      volumeOn,
      risk,
      grid,
      binary
    };
    
    sendMessage(state);
  }, [broker, mode, assets, volumeOn, risk, grid, binary, sendMessage]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'pong') {
        log('Received pong', 'INFO');
        return;
      }
      
      if (message.type === 'error') {
        errorRef.current = message.data?.message || 'Unknown error';
        log('Received error', 'ERROR', message.data);
        return;
      }
      
      if (message.type === 'event' && message.data && isValidEvent(message.data)) {
        const wsEvent = message.data as WsEvent;
        lastEventRef.current = wsEvent;
        eventCountRef.current++;
        
        log('Received event', 'INFO', wsEvent);
        
        // Handle different event types
        if (isPreviewEvent(wsEvent)) {
          log('Preview event received', 'INFO', wsEvent);
        }
        
        if (isExecutedEvent(wsEvent)) {
          log('Executed event received', 'INFO', wsEvent);
          
          // Update KPIs based on executed event
          if (wsEvent.pnl !== undefined) {
            updateKPIs({
              pnl: wsEvent.pnl,
              trades: 1 // Increment trades count
            });
          }
        }
        
        // Call custom event handler
        if (onEvent) {
          onEvent(wsEvent);
        }
      }
    } catch (error) {
      log('Error parsing message', 'ERROR', error);
    }
  }, [log, onEvent, updateKPIs]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const pingMessage: WSMessage = {
          type: 'ping',
          timestamp: Date.now()
        };
        
        wsRef.current.send(JSON.stringify(pingMessage));
        log('Sent ping', 'INFO');
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }, [log]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      log('Max reconnection attempts reached', 'ERROR');
      return;
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    reconnectAttemptsRef.current++;
    const delay = WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current - 1);
    
    log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`, 'INFO');
    
    reconnectTimerRef.current = setTimeout(() => {
      log(`Reconnect attempt ${reconnectAttemptsRef.current}`, 'INFO');
      connect();
    }, delay);
  }, []);

  // Clear reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      log('Already connected', 'INFO');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      log('Connection in progress', 'INFO');
      return;
    }
    
    log(`Connecting to ${url}`, 'INFO');
    setWsStatus('connecting');
    errorRef.current = null;
    
    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        log('Connected to WebSocket', 'INFO');
        setWsStatus('connected');
        setConnected(broker, true);
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        startHeartbeat();
        
        // Send initial state
        sendState();
      };
      
      wsRef.current.onmessage = handleMessage;
      
      wsRef.current.onclose = (event) => {
        log(`WebSocket closed: ${event.code} ${event.reason}`, 'WARN');
        setWsStatus('disconnected');
        setConnected(broker, false);
        stopHeartbeat();
        
        if (event.code !== 1000) { // Not a normal closure
          scheduleReconnect();
        }
      };
      
      wsRef.current.onerror = (error) => {
        log('WebSocket error', 'ERROR', error);
        errorRef.current = 'Connection error';
        setWsStatus('disconnected');
        setConnected(broker, false);
      };
      
    } catch (error) {
      log('Failed to create WebSocket', 'ERROR', error);
      errorRef.current = 'Failed to create connection';
      setWsStatus('disconnected');
    }
  }, [url, broker, log, setWsStatus, setConnected, startHeartbeat, stopHeartbeat, scheduleReconnect, clearReconnectTimer, sendState, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    log('Disconnecting from WebSocket', 'INFO');
    
    stopHeartbeat();
    clearReconnectTimer();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setWsStatus('disconnected');
    setConnected(broker, false);
    reconnectAttemptsRef.current = 0;
  }, [broker, log, setWsStatus, setConnected, stopHeartbeat, clearReconnectTimer]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Send state when configuration changes
  useEffect(() => {
    if (wsStatus === 'connected') {
      sendState();
    }
  }, [broker, mode, assets, risk, grid, binary, volumeOn, wsStatus, sendState]);

  // Kill switch effect
  useEffect(() => {
    if (wsStatus === 'connected') {
      const killSwitchMessage = {
        type: 'kill_switch',
        active: false, // This would come from state
        timestamp: Date.now()
      };
      
      sendMessage(killSwitchMessage);
    }
  }, [wsStatus, sendMessage]);

  return {
    connected: wsStatus === 'connected',
    connecting: wsStatus === 'connecting',
    error: errorRef.current,
    connect,
    disconnect,
    sendMessage,
    lastEvent: lastEventRef.current,
    eventCount: eventCountRef.current
  };
}

// Specialized hooks for specific event types
export function usePreviewEvents(callback: (event: WsEvent) => void) {
  const { onEvent } = useWebsocket({
    onEvent: (event) => {
      if (event.t === 'preview' || event.t === 'binary_preview') {
        callback(event);
      }
    }
  });
}

export function useExecutedEvents(callback: (event: WsEvent) => void) {
  const { onEvent } = useWebsocket({
    onEvent: (event) => {
      if (event.t === 'executed' || event.t === 'binary_executed') {
        callback(event);
      }
    }
  });
}

export function useBinaryEvents(callback: (event: WsEvent) => void) {
  const { onEvent } = useWebsocket({
    onEvent: (event) => {
      if (isBinaryEvent(event)) {
        callback(event);
      }
    }
  });
}

export function useSpotEvents(callback: (event: WsEvent) => void) {
  const { onEvent } = useWebsocket({
    onEvent: (event) => {
      if (isSpotEvent(event)) {
        callback(event);
      }
    }
  });
}
