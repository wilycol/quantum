// src/app/qcore/lib/validators.ts
// Validation functions for QuantumCore v2

import { 
  RiskConfig, 
  GridConfig, 
  BinaryConfig, 
  ValidationResult,
  Broker,
  Mode,
  BinaryDirection
} from './types';

// Risk validation
export function validateRisk(risk: RiskConfig, mode: Mode): ValidationResult {
  const errors: string[] = [];
  
  if (risk.maxOrderPct <= 0) {
    errors.push('Max order percentage must be greater than 0');
  }
  
  if (mode === 'live' && risk.maxOrderPct > 0.05) {
    errors.push('Max order percentage cannot exceed 5% in live mode');
  }
  
  if (risk.dailyStopPct && risk.dailyStopPct <= 0) {
    errors.push('Daily stop percentage must be greater than 0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Grid validation
export function validateGrid(grid: GridConfig): ValidationResult {
  const errors: string[] = [];
  
  if (grid.size <= 0) {
    errors.push('Grid size must be greater than 0');
  }
  
  if (grid.upper <= grid.lower) {
    errors.push('Upper bound must be greater than lower bound');
  }
  
  if (grid.stepPct <= 0) {
    errors.push('Step percentage must be greater than 0');
  }
  
  if (grid.stepPct > 1) {
    errors.push('Step percentage cannot exceed 100%');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Binary validation
export function validateBinary(binary: BinaryConfig): ValidationResult {
  const errors: string[] = [];
  
  if (binary.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (binary.amount < 10) {
    errors.push('Minimum amount is $10');
  }
  
  if (binary.amount > 1000) {
    errors.push('Maximum amount is $1000');
  }
  
  const validExpiries = [30, 60, 120, 300, 600];
  if (!validExpiries.includes(binary.expiry)) {
    errors.push('Invalid expiry time');
  }
  
  if (!['CALL', 'PUT'].includes(binary.direction)) {
    errors.push('Direction must be CALL or PUT');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Asset validation
export function validateAssets(assets: string[], broker: Broker): ValidationResult {
  const errors: string[] = [];
  
  if (assets.length === 0) {
    errors.push('At least one asset must be selected');
  }
  
  if (assets.length > 5) {
    errors.push('Maximum 5 assets allowed');
  }
  
  // Validate asset symbols based on broker
  const validSymbols = broker === 'binance' 
    ? ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']
    : ['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD'];
  
  for (const asset of assets) {
    if (!validSymbols.includes(asset)) {
      errors.push(`Invalid asset symbol: ${asset}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Mode transition validation
export function validateModeTransition(
  fromMode: Mode, 
  toMode: Mode, 
  broker: Broker,
  risk: RiskConfig,
  assets: string[]
): ValidationResult {
  const errors: string[] = [];
  
  if (fromMode === 'shadow' && toMode === 'live') {
    // Validate risk settings for live mode
    const riskValidation = validateRisk(risk, 'live');
    if (!riskValidation.valid) {
      errors.push(...riskValidation.errors);
    }
    
    // Validate assets
    const assetValidation = validateAssets(assets, broker);
    if (!assetValidation.valid) {
      errors.push(...assetValidation.errors);
    }
    
    // Additional live mode requirements
    if (risk.maxOrderPct > 0.05) {
      errors.push('Risk limit must be ≤ 5% for live trading');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Broker configuration validation
export function validateBrokerConfig(
  broker: Broker,
  strategy: string,
  grid?: GridConfig,
  binary?: BinaryConfig
): ValidationResult {
  const errors: string[] = [];
  
  if (broker === 'binance' && strategy !== 'grid') {
    errors.push('Binance only supports grid strategy');
  }
  
  if (broker === 'zaffer' && strategy !== 'binary') {
    errors.push('Zaffer only supports binary strategy');
  }
  
  if (broker === 'binance' && grid) {
    const gridValidation = validateGrid(grid);
    if (!gridValidation.valid) {
      errors.push(...gridValidation.errors);
    }
  }
  
  if (broker === 'zaffer' && binary) {
    const binaryValidation = validateBinary(binary);
    if (!binaryValidation.valid) {
      errors.push(...binaryValidation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// WebSocket event validation
export function validateWsEvent(event: any): ValidationResult {
  const errors: string[] = [];
  
  if (!event.t) {
    errors.push('Event type is required');
  }
  
  if (!['preview', 'executed', 'binary_preview', 'binary_executed'].includes(event.t)) {
    errors.push('Invalid event type');
  }
  
  if (!event.ts || typeof event.ts !== 'number') {
    errors.push('Timestamp is required and must be a number');
  }
  
  if (event.broker && !['binance', 'zaffer'].includes(event.broker)) {
    errors.push('Invalid broker');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Price validation
export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];
  
  if (price <= 0) {
    errors.push('Price must be greater than 0');
  }
  
  if (!isFinite(price)) {
    errors.push('Price must be a valid number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Quantity validation
export function validateQuantity(qty: number, maxQty?: number): ValidationResult {
  const errors: string[] = [];
  
  if (qty <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!isFinite(qty)) {
    errors.push('Quantity must be a valid number');
  }
  
  if (maxQty && qty > maxQty) {
    errors.push(`Quantity cannot exceed ${maxQty}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to validate all configuration
export function validateQcoreConfig(state: any): ValidationResult {
  const errors: string[] = [];
  
  // Validate risk
  const riskValidation = validateRisk(state.risk, state.mode);
  if (!riskValidation.valid) {
    errors.push(...riskValidation.errors);
  }
  
  // Validate assets
  const assetValidation = validateAssets(state.assets, state.broker);
  if (!assetValidation.valid) {
    errors.push(...assetValidation.errors);
  }
  
  // Validate broker-specific config
  const brokerValidation = validateBrokerConfig(
    state.broker,
    state.strategy,
    state.grid,
    state.binary
  );
  if (!brokerValidation.valid) {
    errors.push(...brokerValidation.errors);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
