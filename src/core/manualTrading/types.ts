export interface Tick {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  time: Date;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  fee: number;
  total: number;
}

export interface State {
  closes: number[];
  lastPrice: number;
  rsi: number | null;
  side: 'buy' | 'sell' | 'hold';
  trades: Trade[];
  pnl: number;
  isActive: boolean;
}

export interface SimulatorOptions {
  tickInterval?: number;
  initialPrice?: number;
  volatility?: number;
  trend?: 'up' | 'down' | 'sideways';
}

export interface Advice {
  message: string;
  countdown: number;
  side?: 'buy' | 'sell' | 'hold';
}

export interface TradeFeedback {
  timing: 'early' | 'perfect' | 'late';
  correctness: 'correct' | 'incorrect';
  message: string;
}
