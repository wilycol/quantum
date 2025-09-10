// src/app/qcore/page.tsx
// Main QuantumCore v2 page

import React, { useEffect } from 'react';
import Topbar from './components/Topbar';
import ConfigPanel from './components/ConfigPanel';
import ChartPanel from './components/ChartPanel';
import CoachPanel from './components/CoachPanel';
import LogsPanel from '../../components/LogsPanel';
import ExecutedTimeline from '../../components/ExecutedTimeline';
import ModeConfirmModal from './components/ModeConfirmModal';
import KillSwitchModal from './components/KillSwitchModal';
import WebSocketTest from '../../components/WebSocketTest';
import RiskManager from './components/RiskManager';
import PortfolioPanel from './components/PortfolioPanel';
import { wireWSBridge } from '../../lib/wsBridge';

export default function QuantumCorePage() {
  // Initialize WebSocket bridge once
  useEffect(() => {
    console.log('[QuantumCore] Initializing WebSocket bridge');
    wireWSBridge();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Topbar */}
      <Topbar />
      
      {/* Kill Switch Banner */}
      <KillSwitchModal />

      {/* WebSocket Test - Temporal - DISABLED */}
      {/* <WebSocketTest /> */}

      {/* Main Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 h-full">
          {/* Left Column - Config Panel + Risk Manager */}
          <div className="lg:col-span-1 space-y-6">
            <ConfigPanel />
            <RiskManager />
          </div>

          {/* Center Column - Chart Panel */}
          <div className="lg:col-span-3">
            <ChartPanel />
          </div>

          {/* Right Column - Portfolio, IA Coach, Logs, Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioPanel />
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
