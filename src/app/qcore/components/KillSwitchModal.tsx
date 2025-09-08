// src/app/qcore/components/KillSwitchModal.tsx
// Kill switch modal for QuantumCore v2

import React, { useState } from 'react';
import { 
  useKillSwitchActive,
  useQcoreActions
} from '../hooks/useQcoreState';

interface KillSwitchModalProps {
  className?: string;
}

export default function KillSwitchModal({ className = '' }: KillSwitchModalProps) {
  // State from store
  const killSwitchActive = useKillSwitchActive();
  
  // Actions from store
  const { setKillSwitchActive } = useQcoreActions();

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Handle kill switch toggle
  const handleKillSwitchToggle = () => {
    if (killSwitchActive) {
      // Deactivating kill switch
      setKillSwitchActive(false);
    } else {
      // Activating kill switch - show confirmation
      setShowModal(true);
    }
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmationText === 'KILL') {
      setKillSwitchActive(true);
      setShowModal(false);
      setConfirmationText('');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowModal(false);
    setConfirmationText('');
  };

  // Handle reset
  const handleReset = () => {
    setKillSwitchActive(false);
    setShowModal(false);
    setConfirmationText('');
  };

  return (
    <>
      {/* Kill Switch Button */}
      <button
        onClick={handleKillSwitchToggle}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          killSwitchActive
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-600 text-white hover:bg-gray-500'
        }`}
      >
        {killSwitchActive ? 'Kill-Switch: ON' : 'Kill-Switch: OFF'}
      </button>

      {/* Kill Switch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Activate Kill Switch</h2>
            </div>

            {/* Warning */}
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
              <div className="text-red-400 text-sm">
                <strong>🚨 EMERGENCY STOP:</strong> This will immediately halt all trading operations, 
                close all open positions, and disable the system. Use only in emergency situations.
              </div>
            </div>

            {/* Effects */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">This will:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Immediately stop all trading operations</li>
                <li>• Close all open positions</li>
                <li>• Disconnect from all brokers</li>
                <li>• Disable the trading system</li>
                <li>• Require manual reset to resume</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type "KILL" to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type KILL here"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmationText !== 'KILL'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Activate Kill Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kill Switch Active Banner */}
      {killSwitchActive && (
        <div className="fixed top-0 left-0 right-0 bg-red-900 border-b border-red-700 p-3 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-400 font-semibold">
                KILL-SWITCH ACTIVE - All trading operations are disabled
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Reset System
            </button>
          </div>
        </div>
      )}
    </>
  );
}
