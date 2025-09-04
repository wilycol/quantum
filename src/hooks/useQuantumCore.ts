import { useState, useEffect, useRef, useCallback } from 'react';
import { rsi, getSignal } from "../core/manualTrading/strategy";

interface Trade {
  id: string;
  time: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  fee: number;
  pnl?: number;
}

interface QuantumCoreState {
  running: boolean;
  price: number;
  closes: number[];
  rsi: number | null;
  side: 'buy' | 'sell' | 'hold';
  trades: Trade[];
  progress: {
    snapshot?: {
      trades: any[];
      metrics: any;
      confidenceHistory: any[];
    };
    elapsedMs?: number;
    steps?: number;
  } | number;
  status: 'idle' | 'running' | 'stopped';
  start: (params?: any) => void;
  stop: () => void;
  reset: () => void;
  emergencyStop: () => void;
  placeTrade: (params: { side: 'BUY' | 'SELL'; qty: number; price?: number; symbol?: string }) => void;
}

function useQuantumCore(params?: { symbol?: string }): QuantumCoreState {
  const [running, setRunning] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(100);
  const [closes, setCloses] = useState<number[]>([100]);
  const [rsi, setRsi] = useState<number | null>(null);
  const [side, setSide] = useState<'buy' | 'sell' | 'hold'>('hold');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'stopped'>('idle');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradeIdCounter = useRef<number>(0);

  // Generar un nuevo tick de precio
  const tick = useCallback(() => {
    setCloses(prevCloses => {
      const lastPrice = prevCloses[prevCloses.length - 1];
      // Generar variación aleatoria entre -30 y +30
      const variation = (Math.random() - 0.5) * 60;
      const newPrice = Math.max(1, lastPrice + variation);
      
      // Mantener máximo 500 elementos
      const newCloses = [...prevCloses, newPrice];
      if (newCloses.length > 500) {
        newCloses.shift();
      }
      
      return newCloses;
    });
  }, []);

  // Calcular RSI y señal cuando cambian los closes
  useEffect(() => {
    if (closes.length >= 14) {
      const rsiVal = rsi(closes, 14);
      const signal = getSignal(closes);
      
      setRsi(rsiVal);
      setSide(signal);
    }
  }, [closes]);

  // Actualizar precio actual cuando cambian los closes
  useEffect(() => {
    if (closes.length > 0) {
      setPrice(closes[closes.length - 1]);
    }
  }, [closes]);

  // Iniciar simulación
  const start = useCallback((params?: any) => {
    if (!running) {
      setRunning(true);
      setStatus('running');
      setProgress({
        snapshot: {
          trades: [],
          metrics: {},
          confidenceHistory: []
        },
        elapsedMs: 0,
        steps: 0
      });
      intervalRef.current = setInterval(tick, 1000);
    }
  }, [running, tick]);

  // Detener simulación
  const stop = useCallback(() => {
    if (running) {
      setRunning(false);
      setStatus('stopped');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [running]);

  // Resetear estado
  const reset = useCallback(() => {
    stop();
    setPrice(100);
    setCloses([100]);
    setRsi(null);
    setSide('hold');
    setTrades([]);
    setProgress(0);
    setStatus('idle');
    tradeIdCounter.current = 0;
  }, [stop]);

  // Parada de emergencia
  const emergencyStop = useCallback(() => {
    stop();
    reset();
  }, [stop, reset]);

  // Colocar trade
  const placeTrade = useCallback((params: { 
    side: 'BUY' | 'SELL'; 
    qty: number; 
    price?: number; 
    symbol?: string 
  }) => {
    const tradePrice = params.price || price;
    const fee = tradePrice * params.qty * 0.001; // 0.1% fee
    
    const newTrade: Trade = {
      id: `trade_${++tradeIdCounter.current}`,
      time: Date.now(),
      symbol: params.symbol || 'BTC/USDT',
      side: params.side,
      qty: params.qty,
      price: tradePrice,
      fee: fee,
      pnl: 0 // Se calcularía basado en posición anterior
    };

    setTrades(prevTrades => [...prevTrades, newTrade]);
  }, [price]);

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    running,
    price,
    closes,
    rsi,
    side,
    trades,
    progress,
    status,
    start,
    stop,
    reset,
    emergencyStop,
    placeTrade
  };
}

export default useQuantumCore;
export { useQuantumCore };
