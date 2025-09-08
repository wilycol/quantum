// src/hooks/useEventBus.ts
// React hook for Event Bus WebSocket communication

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  EventBus, 
  getEventBus, 
  createPreviewEvent,
  createBinaryPreviewEvent,
  createExecutedEvent,
  createBinaryExecutedEvent,
  createStateEvent
} from '../services/eventBus';
import { 
  IncomingEvent, 
  OutgoingEvent, 
  StateEvent,
  PreviewEvent,
  BinaryPreviewEvent,
  ExecutedEvent,
  BinaryExecutedEvent
} from '../types/eventBus';

interface UseEventBusReturn {
  // Connection state
  connected: boolean;
  connecting: boolean;
  error: string | null;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Event sending methods
  sendPreview: (event: PreviewEvent | BinaryPreviewEvent) => void;
  sendExecuted: (event: ExecutedEvent | BinaryExecutedEvent) => void;
  sendState: (state: StateEvent) => void;
  
  // Event listening methods
  onPreview: (callback: (event: PreviewEvent | BinaryPreviewEvent) => void) => () => void;
  onExecuted: (callback: (event: ExecutedEvent | BinaryExecutedEvent) => void) => () => void;
  onState: (callback: (state: StateEvent) => void) => () => void;
  onConnected: (callback: () => void) => () => void;
  onDisconnected: (callback: (data: any) => void) => () => void;
  onError: (callback: (error: any) => void) => () => void;
  
  // Helper methods for creating events
  createPreview: typeof createPreviewEvent;
  createBinaryPreview: typeof createBinaryPreviewEvent;
  createExecuted: typeof createExecutedEvent;
  createBinaryExecuted: typeof createBinaryExecutedEvent;
  createState: typeof createStateEvent;
}

export function useEventBus(config?: {
  url?: string;
  autoConnect?: boolean;
  debug?: boolean;
}): UseEventBusReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventBusRef = useRef<EventBus | null>(null);
  const configRef = useRef(config);

  // Initialize Event Bus
  useEffect(() => {
    const eventBus = getEventBus({
      url: config?.url || (() => {
        // Check for Next.js compatible environment variable
        if (process.env.NEXT_PUBLIC_WS_URL) {
          return process.env.NEXT_PUBLIC_WS_URL;
        }
        
        // Check for Vite environment variable
        if (import.meta.env.VITE_WS_URL) {
          return import.meta.env.VITE_WS_URL;
        }
        
        // Default to localhost for development
        return 'ws://localhost:8080/ws';
      })(),
      debug: config?.debug || false,
    });
    
    eventBusRef.current = eventBus;
    
    // Set up connection event listeners
    const unsubscribeConnected = eventBus.on('connected', () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    });
    
    const unsubscribeDisconnected = eventBus.on('disconnected', () => {
      setConnected(false);
      setConnecting(false);
    });
    
    const unsubscribeError = eventBus.on('error', (err) => {
      setError(err?.message || 'Unknown error');
      setConnecting(false);
    });
    
    // Auto-connect if enabled
    if (config?.autoConnect !== false) {
      connect();
    }
    
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      eventBus.disconnect();
    };
  }, [config?.url, config?.debug]);

  // Connect method
  const connect = useCallback(async () => {
    if (!eventBusRef.current || connecting || connected) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      await eventBusRef.current.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnecting(false);
    }
  }, [connecting, connected]);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (eventBusRef.current) {
      eventBusRef.current.disconnect();
    }
  }, []);

  // Send preview event
  const sendPreview = useCallback((event: PreviewEvent | BinaryPreviewEvent) => {
    if (eventBusRef.current) {
      eventBusRef.current.sendPreview(event);
    }
  }, []);

  // Send executed event
  const sendExecuted = useCallback((event: ExecutedEvent | BinaryExecutedEvent) => {
    if (eventBusRef.current) {
      eventBusRef.current.sendExecuted(event);
    }
  }, []);

  // Send state
  const sendState = useCallback((state: StateEvent) => {
    if (eventBusRef.current) {
      eventBusRef.current.sendState(state);
    }
  }, []);

  // Event listeners
  const onPreview = useCallback((callback: (event: PreviewEvent | BinaryPreviewEvent) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('event:preview', callback);
  }, []);

  const onBinaryPreview = useCallback((callback: (event: BinaryPreviewEvent) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('event:binary_preview', callback);
  }, []);

  const onExecuted = useCallback((callback: (event: ExecutedEvent | BinaryExecutedEvent) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('event:executed', callback);
  }, []);

  const onBinaryExecuted = useCallback((callback: (event: BinaryExecutedEvent) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('event:binary_executed', callback);
  }, []);

  const onState = useCallback((callback: (state: StateEvent) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('state', callback);
  }, []);

  const onConnected = useCallback((callback: () => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('connected', callback);
  }, []);

  const onDisconnected = useCallback((callback: (data: any) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('disconnected', callback);
  }, []);

  const onError = useCallback((callback: (error: any) => void) => {
    if (!eventBusRef.current) return () => {};
    return eventBusRef.current.on('error', callback);
  }, []);

  return {
    // Connection state
    connected,
    connecting,
    error,
    
    // Connection methods
    connect,
    disconnect,
    
    // Event sending methods
    sendPreview,
    sendExecuted,
    sendState,
    
    // Event listening methods
    onPreview,
    onExecuted,
    onState,
    onConnected,
    onDisconnected,
    onError,
    
    // Helper methods
    createPreview: createPreviewEvent,
    createBinaryPreview: createBinaryPreviewEvent,
    createExecuted: createExecutedEvent,
    createBinaryExecuted: createBinaryExecutedEvent,
    createState: createStateEvent,
  };
}

// Specialized hooks for specific event types
export function usePreviewEvents(callback: (event: PreviewEvent | BinaryPreviewEvent) => void) {
  const { onPreview } = useEventBus();
  
  useEffect(() => {
    const unsubscribe = onPreview(callback);
    return unsubscribe;
  }, [onPreview, callback]);
}

export function useExecutedEvents(callback: (event: ExecutedEvent | BinaryExecutedEvent) => void) {
  const { onExecuted } = useEventBus();
  
  useEffect(() => {
    const unsubscribe = onExecuted(callback);
    return unsubscribe;
  }, [onExecuted, callback]);
}

export function useStateEvents(callback: (state: StateEvent) => void) {
  const { onState } = useEventBus();
  
  useEffect(() => {
    const unsubscribe = onState(callback);
    return unsubscribe;
  }, [onState, callback]);
}
