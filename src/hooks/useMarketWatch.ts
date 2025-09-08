import { useState, useEffect } from 'react';
import { usePriceFeed } from './usePriceFeed';

export interface MarketWatchItem {
  symbol: string;
  price: number;
  change: string;
  changeColor: string;
  changePercent: number;
}

export function useMarketWatch() {
  const [marketData, setMarketData] = useState<MarketWatchItem[]>([]);

  useEffect(() => {
    // Simular datos del Market Watch con precios y cambios
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"];
    
    const generateMarketData = (): MarketWatchItem[] => {
      return symbols.map(symbol => {
        // Precios base realistas
        const basePrices: { [key: string]: number } = {
          'BTCUSDT': 111243.33,
          'ETHUSDT': 3450.25,
          'BNBUSDT': 320.45,
          'ADAUSDT': 0.485,
          'SOLUSDT': 98.75
        };
        
        const basePrice = basePrices[symbol] || 100;
        
        // Generar cambio aleatorio entre -5% y +5%
        const changePercent = (Math.random() - 0.5) * 10;
        const newPrice = basePrice * (1 + changePercent / 100);
        
        const change = changePercent >= 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`;
        const changeColor = changePercent >= 0 ? 'text-green-500' : 'text-red-500';
        
        return {
          symbol,
          price: newPrice,
          change,
          changeColor,
          changePercent
        };
      });
    };

    // Generar datos iniciales
    setMarketData(generateMarketData());

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      setMarketData(generateMarketData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return marketData;
}
