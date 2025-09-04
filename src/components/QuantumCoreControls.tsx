import React from "react";

type Props = {
  status: 'idle' | 'running' | 'stopped' | 'emergency-stopped' | string;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onEmergencyStop: () => void;
  onExport: () => void;
};

export default function QuantumCoreControls({
  status, onStart, onStop, onReset, onEmergencyStop, onExport
}: Props) {
  const isRunning = status === 'running';

  return (
    <div className="qc-controls flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
          <button
            title="Start simulation"
            className="bg-brand-gold text-black font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            onClick={onStart}
            disabled={isRunning}
          >
            Start
          </button>
          <button
            title="Stop (pause safely)"
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
            onClick={onStop}
            disabled={!isRunning}
          >
            Stop
          </button>
      </div>
      <button
        title="Reset (clear current state)"
        className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
        onClick={onReset}
        disabled={isRunning}
      >
        Reset
      </button>
      <button
        title="Emergency Stop (immediate halt)"
        className="bg-brand-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onEmergencyStop}
        disabled={!isRunning}
      >
        Emergency Stop
      </button>
      <button
        title="Export results"
        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onExport}
        disabled={isRunning}
      >
        Export Results
      </button>
    </div>
  );
}