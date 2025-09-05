import React from 'react';
import { TradingMode } from '../hooks/useTradingMode';

interface TradingModeSelectorProps {
  mode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const TradingModeSelector: React.FC<TradingModeSelectorProps> = ({
  mode,
  onModeChange,
  isConnected,
  isLoading,
  error
}) => {
  const modes = [
    { 
      value: 'paper' as TradingMode, 
      label: 'Paper Trading', 
      description: 'Simulación local',
      color: 'bg-blue-100 text-blue-800',
      icon: '📝'
    },
    { 
      value: 'testnet' as TradingMode, 
      label: 'Binance Testnet', 
      description: 'Red de pruebas',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '🧪'
    },
    { 
      value: 'live' as TradingMode, 
      label: 'Binance Live', 
      description: 'Dinero real',
      color: 'bg-red-100 text-red-800',
      icon: '⚠️'
    }
  ];

  return (
    <div className="panel side-card">
      <h2 className="text-xl font-semibold mb-4">Modo de Trading</h2>
      
      {/* Selector de modos */}
      <div className="space-y-2 mb-4">
        {modes.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => onModeChange(modeOption.value)}
            disabled={isLoading}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              mode === modeOption.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{modeOption.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{modeOption.label}</div>
                  <div className="text-sm text-gray-500">{modeOption.description}</div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${modeOption.color}`}>
                {mode === modeOption.value ? 'ACTIVO' : 'INACTIVO'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Estado de conexión */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600">Conectando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-500 text-sm">⚠️</span>
              <div className="text-sm text-red-700">
                <div className="font-medium">Error de conexión</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Información del modo actual */}
        {mode === 'paper' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="font-medium">Modo Paper Trading</div>
              <div className="text-xs mt-1">
                Todas las operaciones son simuladas y se guardan localmente.
              </div>
            </div>
          </div>
        )}

        {mode === 'testnet' && isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-700">
              <div className="font-medium">Binance Testnet</div>
              <div className="text-xs mt-1">
                Conectado a la red de pruebas de Binance. No se usa dinero real.
              </div>
            </div>
          </div>
        )}

        {mode === 'live' && isConnected && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">
              <div className="font-medium">⚠️ Binance Live</div>
              <div className="text-xs mt-1">
                <strong>ATENCIÓN:</strong> Se está usando dinero real. Todas las operaciones son reales.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
