import { useState, useEffect, useCallback } from 'react';
import { usePaper } from './usePaper';
import { placeOrder, getAccount, getPositions, getTrades, checkBinanceConnection, BinanceOrder } from '../services/binanceService';

export type TradingMode = 'paper' | 'testnet' | 'live';

export interface TradingState {
  mode: TradingMode;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  account: any | null;
  positions: any[] | null;
  trades: any[] | null;
}

export interface TradingActions {
  setMode: (mode: TradingMode) => void;
  submitOrder: (side: 'BUY' | 'SELL', qty: number, price?: number) => Promise<void>;
  refreshAccount: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshTrades: (symbol: string) => Promise<void>;
  reset: () => void;
}

export function useTradingMode(lastPrice: number): TradingState & TradingActions {
  const [mode, setMode] = useState<TradingMode>('paper');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [positions, setPositions] = useState<any[] | null>(null);
  const [trades, setTrades] = useState<any[] | null>(null);

  // Hook de paper trading como fallback
  const paperTrading = usePaper(lastPrice);

  // Verificar conexión cuando cambia el modo
  useEffect(() => {
    if (mode === 'paper') {
      setIsConnected(true);
      setError(null);
      return;
    }

    const checkConnection = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const connected = await checkBinanceConnection();
        setIsConnected(connected);
        
        if (connected) {
          await refreshAccount();
        } else {
          setError('No se pudo conectar a Binance. Usando modo paper como fallback.');
        }
      } catch (err) {
        setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [mode]);

  // Refrescar información de la cuenta
  const refreshAccount = useCallback(async () => {
    if (mode === 'paper') return;
    
    try {
      const accountData = await getAccount();
      setAccount(accountData);
    } catch (err) {
      console.error('Error refreshing account:', err);
      setError(`Error al obtener cuenta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }, [mode]);

  // Refrescar posiciones
  const refreshPositions = useCallback(async () => {
    if (mode === 'paper') return;
    
    try {
      const positionsData = await getPositions();
      setPositions(positionsData);
    } catch (err) {
      console.error('Error refreshing positions:', err);
      setError(`Error al obtener posiciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }, [mode]);

  // Refrescar trades
  const refreshTrades = useCallback(async (symbol: string) => {
    if (mode === 'paper') return;
    
    try {
      const tradesData = await getTrades(symbol);
      setTrades(tradesData);
    } catch (err) {
      console.error('Error refreshing trades:', err);
      setError(`Error al obtener trades: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }, [mode]);

  // Enviar orden
  const submitOrder = useCallback(async (side: 'BUY' | 'SELL', qty: number, price?: number) => {
    if (mode === 'paper') {
      // Usar paper trading
      paperTrading.submit(side, qty);
      return;
    }

    if (!isConnected) {
      setError('No conectado a Binance. Usando modo paper como fallback.');
      paperTrading.submit(side, qty);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const order = await placeOrder({
        symbol: 'BTCUSDT', // TODO: hacer configurable
        side,
        quantity: qty,
        price,
        type: price ? 'LIMIT' : 'MARKET'
      });

      console.log('Order placed successfully:', order);
      
      // Refrescar datos después de la orden
      await Promise.all([
        refreshAccount(),
        refreshPositions(),
        refreshTrades('BTCUSDT')
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al ejecutar orden: ${errorMessage}`);
      
      // Fallback a paper trading
      console.warn('Falling back to paper trading due to error:', errorMessage);
      paperTrading.submit(side, qty);
    } finally {
      setIsLoading(false);
    }
  }, [mode, isConnected, paperTrading, refreshAccount, refreshPositions, refreshTrades]);

  // Reset
  const reset = useCallback(() => {
    if (mode === 'paper') {
      paperTrading.reset();
    } else {
      setAccount(null);
      setPositions(null);
      setTrades(null);
      setError(null);
    }
  }, [mode, paperTrading]);

  // Cambiar modo
  const handleSetMode = useCallback((newMode: TradingMode) => {
    setMode(newMode);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    // Estado
    mode,
    isConnected,
    isLoading,
    error,
    account,
    positions,
    trades,
    
    // Acciones
    setMode: handleSetMode,
    submitOrder,
    refreshAccount,
    refreshPositions,
    refreshTrades,
    reset
  };
}
