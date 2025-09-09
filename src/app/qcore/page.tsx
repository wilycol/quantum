// src/app/qcore/page.tsx
// Main QuantumCore v2 page

import React, { useEffect } from 'react';
import Topbar from './components/Topbar';
import ConfigPanel from './components/ConfigPanel';
import ChartPanel from './components/ChartPanel';
import CoachPanel from './components/CoachPanel';
import LogsPanel from './components/LogsPanel';
import ExecutedTimeline from './components/ExecutedTimeline';
import ModeConfirmModal from './components/ModeConfirmModal';
import KillSwitchModal from './components/KillSwitchModal';
import { connectWS } from '../../../lib/wsClient';

export default function QuantumCorePage() {
  // WebSocket connection test
  useEffect(() => {
    const stop = connectWS('/api/ws');
    return () => stop && stop();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Topbar */}
      <Topbar />
      
      {/* Kill Switch Banner */}
      <KillSwitchModal />

      {/* Main Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left Column - Config Panel */}
          <div className="lg:col-span-1">
            <ConfigPanel />
          </div>

          {/* Center Column - Chart Panel */}
          <div className="lg:col-span-2">
            <ChartPanel />
          </div>

          {/* Right Column - IA Coach, Logs, Timeline */}
          <div className="lg:col-span-1 space-y-6">
            <CoachPanel />
            <LogsPanel />
            <ExecutedTimeline />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModeConfirmModal />
    </div>
  );
}
