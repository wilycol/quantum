// src/app/qcore/components/ModeConfirmModal.tsx
// Modal for confirming Shadow to Live mode transition

import React, { useState } from 'react';
import { 
  useBroker,
  useStrategy,
  useAssets,
  useRisk,
  useGrid,
  useBinary,
  useShowModeConfirmModal,
  useQcoreActions
} from '../hooks/useQcoreState';
import { validateModeTransition } from '../lib/validators';
import { formatPercentage, formatCurrency } from '../lib/formatters';

interface ModeConfirmModalProps {
  className?: string;
}

export default function ModeConfirmModal({ className = '' }: ModeConfirmModalProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const assets = useAssets();
  const risk = useRisk();
  const grid = useGrid();
  const binary = useBinary();
  const showModal = useShowModeConfirmModal();
  
  // Actions from store
  const { setMode, setShowModeConfirmModal } = useQcoreActions();

  // Local state
  const [confirmationText, setConfirmationText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validation
  const validation = validateModeTransition('shadow', 'live', broker, risk, assets);
  const isValid = validation.valid && confirmationText === 'LIVE';

  // Handle confirmation
  const handleConfirm = () => {
    if (isValid) {
      setMode('live');
      setShowModeConfirmModal(false);
      setConfirmationText('');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowModeConfirmModal(false);
    setConfirmationText('');
    setValidationErrors([]);
  };

  // Handle confirmation text change
  const handleConfirmationTextChange = (text: string) => {
    setConfirmationText(text);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Switch to Live Mode</h2>
        </div>

        {/* Warning */}
        <div className="bg-orange-900 border border-orange-700 rounded-lg p-3 mb-4">
          <div className="text-orange-400 text-sm">
            <strong>⚠️ WARNING:</strong> You are about to switch to LIVE trading mode. 
            This will execute real trades with real money. Make sure you understand the risks.
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Configuration:</h3>
          <div className="bg-gray-700 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Broker:</span>
              <span className="text-white">{broker.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Strategy:</span>
              <span className="text-white">{strategy.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Assets:</span>
              <span className="text-white">{assets.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Limit:</span>
              <span className="text-white">{formatPercentage(risk.maxOrderPct * 100)}</span>
            </div>
            {strategy === 'grid' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Grid Size:</span>
                  <span className="text-white">{grid.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Range:</span>
                  <span className="text-white">{formatCurrency(grid.lower)} - {formatCurrency(grid.upper)}</span>
                </div>
              </>
            )}
            {strategy === 'binary' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{formatCurrency(binary.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expiry:</span>
                  <span className="text-white">{binary.expiry}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direction:</span>
                  <span className="text-white">{binary.direction}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
            <div className="text-red-400 text-sm">
              <strong>Configuration Issues:</strong>
              <ul className="mt-1 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Confirmation Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type "LIVE" to confirm:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => handleConfirmationTextChange(e.target.value)}
            placeholder="Type LIVE here"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Checklist */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Pre-flight Checklist:</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-300">I understand the risks of live trading</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-300">My risk settings are appropriate</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-300">I have sufficient funds for trading</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-300">I am ready to monitor the system</span>
            </label>
          </div>
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
            disabled={!isValid}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Switch to Live
          </button>
        </div>
      </div>
    </div>
  );
}
