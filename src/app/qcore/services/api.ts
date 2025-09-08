// src/app/qcore/services/api.ts
// API services for QuantumCore v2

import { HealthResponse, ConnectResponse } from '../lib/types';

// Health check endpoints
export async function healthBinance(): Promise<HealthResponse> {
  try {
    const response = await fetch('/api/health/binance');
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function healthZaffer(): Promise<HealthResponse> {
  try {
    const response = await fetch('/api/health/zaffer');
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Broker connection
export async function connectBroker(
  broker: 'binance' | 'zaffer', 
  payload: any
): Promise<ConnectResponse> {
  try {
    const response = await fetch(`/api/connect/${broker}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

// Mode management
export async function setMode(mode: 'shadow' | 'live'): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode })
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Mode change failed'
    };
  }
}

// Kill switch
export async function activateKillSwitch(): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/kill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Kill switch failed'
    };
  }
}

// Export results
export async function exportResults(): Promise<Blob> {
  try {
    const response = await fetch('/api/export/results');
    return await response.blob();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Export failed');
  }
}

// Configuration management
export async function updateConfig(config: any): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Config update failed'
    };
  }
}

// Trading operations
export async function startTrading(): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/trading/start', {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Start trading failed'
    };
  }
}

export async function stopTrading(): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/trading/stop', {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Stop trading failed'
    };
  }
}

export async function resetTrading(): Promise<ConnectResponse> {
  try {
    const response = await fetch('/api/trading/reset', {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Reset trading failed'
    };
  }
}
