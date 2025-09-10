'use client';
import React, { useState, useMemo } from 'react';
import { useBinanceSymbols } from '../hooks/useBinanceSymbols';

interface AssetSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  className?: string;
}

export default function AssetSelector({ 
  selectedSymbol, 
  onSymbolChange, 
  className = '' 
}: AssetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { symbols, loading } = useBinanceSymbols();

  const filteredSymbols = useMemo(() => {
    if (!searchTerm) return symbols.slice(0, 15); // Mostrar solo los primeros 15 si no hay búsqueda
    
    return symbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15); // Limitar a 15 resultados
  }, [symbols, searchTerm]);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        Asset Selection
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <span className="block truncate">
            {selectedSymbol || 'Select an asset...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="p-2 border-b border-gray-600">
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-3 text-center text-gray-400 text-sm">
                Loading assets...
              </div>
            )}

            {/* Symbol list */}
            {!loading && (
              <div className="py-1">
                {filteredSymbols.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    No assets found
                  </div>
                ) : (
                  filteredSymbols.map((symbol) => (
                    <button
                      key={symbol.symbol}
                      onClick={() => handleSymbolSelect(symbol.symbol)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${
                        selectedSymbol === symbol.symbol 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{symbol.symbol}</span>
                        <span className="text-xs text-gray-400">
                          {symbol.baseAsset}/{symbol.quoteAsset}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
