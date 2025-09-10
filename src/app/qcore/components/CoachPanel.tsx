// src/app/qcore/components/CoachPanel.tsx
// IA Coach panel for QuantumCore v2

import React from 'react';
import IACoach from './IACoach';

interface CoachPanelProps {
  className?: string;
}

export default function CoachPanel({ className = '' }: CoachPanelProps) {
  return (
    <div className={className}>
      <IACoach />
    </div>
  );
}