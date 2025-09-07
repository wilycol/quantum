import React from 'react';

export default function UIGuideView() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎨 UI & Functionality Guide</h1>
            <p className="text-gray-400 text-sm">Documentación de QuantumTrade AI</p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'support' } }))}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Volver al Soporte
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 text-gray-200">
        <div className="space-y-6">
          <iframe
            src="/docs/ui_guide.html"
            className="w-full h-screen border-0 rounded-lg"
            title="UI & Functionality Guide"
          />
        </div>
      </div>
    </div>
  );
}
