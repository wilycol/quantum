import React, { useState, useMemo } from 'react';
import { useBinanceSymbols } from '../hooks/useBinanceSymbols';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SymbolSearchProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  maxSymbols?: number;
}

export default function SymbolSearch({ 
  selectedSymbols, 
  onSymbolsChange, 
  maxSymbols = 5 
}: SymbolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { symbols, loading } = useBinanceSymbols();

  const filteredSymbols = useMemo(() => {
    if (!searchTerm) return symbols.slice(0, 20); // Mostrar solo los primeros 20 si no hay búsqueda
    
    return symbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20); // Limitar a 20 resultados
  }, [symbols, searchTerm]);

  const handleSymbolToggle = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      // Remover símbolo
      onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
    } else if (selectedSymbols.length < maxSymbols) {
      // Agregar símbolo si no excede el límite
      onSymbolsChange([...selectedSymbols, symbol]);
    }
  };

  const removeSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
  };

  return (
    <div className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar símbolos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-800 text-gray-200 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 text-sm"
        />
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-400 text-sm">Cargando símbolos...</div>
          ) : filteredSymbols.length > 0 ? (
            filteredSymbols.map((symbol) => (
              <button
                key={symbol.symbol}
                type="button"
                onClick={() => handleSymbolToggle(symbol.symbol)}
                disabled={!selectedSymbols.includes(symbol.symbol) && selectedSymbols.length >= maxSymbols}
                className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                  selectedSymbols.includes(symbol.symbol)
                    ? 'bg-yellow-500/10 text-yellow-200'
                    : selectedSymbols.length >= maxSymbols
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-200 hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div className="font-medium">{symbol.symbol}</div>
                  <div className="text-xs text-gray-400">{symbol.baseAsset}</div>
                </div>
                {selectedSymbols.includes(symbol.symbol) && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No se encontraron símbolos</div>
          )}
        </div>
      )}

      {/* Símbolos seleccionados */}
      {selectedSymbols.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedSymbols.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-800 text-gray-200 rounded-md text-xs"
            >
              <span>{symbol}</span>
              <button
                type="button"
                onClick={() => removeSymbol(symbol)}
                className="hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
