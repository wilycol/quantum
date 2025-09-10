// src/app/qcore/page.tsx
// Main QuantumCore v2 page - New UX Layout

import React, { useEffect } from 'react';
import Topbar from './components/Topbar';
import ConfigPanel from './components/ConfigPanel';
import ChartPanel from './components/ChartPanel';
import RiskManager from './components/RiskManager';
import PortfolioPanel from './components/PortfolioPanel';
import ModeConfirmModal from './components/ModeConfirmModal';
import KillSwitchModal from './components/KillSwitchModal';
import { wireWSBridge } from '../../../lib/wsBridge';

// New UX Components
import ControlDock from '../../components/ControlDock';
import RightRail from '../../components/RightRail';
import EmergencyFab from '../../components/EmergencyFab';
import CollapsiblePanel from '../../components/ui/CollapsiblePanel';

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
      
      {/* New Control Dock */}
      <ControlDock />
      
      {/* Kill Switch Banner */}
      <KillSwitchModal />

      {/* Main Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 h-full">
          {/* Left Column - Collapsible Panels */}
          <div className="lg:col-span-1 space-y-4">
            <CollapsiblePanel id="sim-config" title="Simulation Config">
              <ConfigPanel />
            </CollapsiblePanel>
            
            <CollapsiblePanel id="risk-manager" title="Risk Manager">
              <RiskManager />
            </CollapsiblePanel>
          </div>

          {/* Center Column - Chart Panel */}
          <div className="lg:col-span-3">
            <ChartPanel />
          </div>

          {/* Right Column - Portfolio + Right Rail */}
          <div className="lg:col-span-2 space-y-4">
            <CollapsiblePanel id="portfolio" title="Portfolio" defaultCollapsed={false}>
              <PortfolioPanel />
            </CollapsiblePanel>
            
            <RightRail />
          </div>
        </div>
      </div>

      {/* Emergency FAB */}
      <EmergencyFab />

      {/* Modals */}
      <ModeConfirmModal />
    </div>
  );
}
