'use client';
import { useRisk } from '@/lib/riskStore';

export default function EmergencyFab() {
  const { killSwitch, toggleKillSwitch } = useRisk();
  
  return (
    <button
      onClick={toggleKillSwitch}
      title={killSwitch ? "Emergency Stop ON - Click to disable" : "Emergency Stop OFF - Click to activate"}
      className={`fixed right-6 bottom-6 w-14 h-14 rounded-full shadow-lg transition-all duration-200 z-50 ${
        killSwitch 
          ? 'bg-red-700 hover:bg-red-600 shadow-red-500/50' 
          : 'bg-red-600 hover:bg-red-500 shadow-red-400/50'
      }`}
    >
      <div className="flex items-center justify-center h-full">
        <span className="text-white text-xl font-bold">
          {killSwitch ? '⛔' : '⚠️'}
        </span>
      </div>
      
      {/* Pulse animation when active */}
      {killSwitch && (
        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
      )}
    </button>
  );
}
