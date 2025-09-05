// Tipos para Binance API
export interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceAccount {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
  permissions: string[];
}

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}

// Configuración
const API_BASE = '/api';

// Función para hacer requests a nuestro endpoint
async function binanceRequest<T>(action: string, params: any = {}): Promise<BinanceResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Binance service error:', error);
    throw error;
  }
}

// Servicios específicos
export async function placeOrder(params: {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  type?: 'MARKET' | 'LIMIT';
}): Promise<BinanceOrder> {
  const response = await binanceRequest<BinanceOrder>('place_order', params);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to place order');
  }
  
  return response.data;
}

export async function getAccount(): Promise<BinanceAccount> {
  const response = await binanceRequest<BinanceAccount>('get_account');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to get account info');
  }
  
  return response.data;
}

export async function getPositions(): Promise<Array<{ asset: string; free: string; locked: string }>> {
  const response = await binanceRequest<{ positions: Array<{ asset: string; free: string; locked: string }> }>('get_positions');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to get positions');
  }
  
  return response.data.positions;
}

export async function getTrades(symbol: string): Promise<BinanceTrade[]> {
  const response = await binanceRequest<BinanceTrade[]>('get_trades', { symbol });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to get trades');
  }
  
  return response.data;
}

// Función para verificar si Binance está disponible
export async function checkBinanceConnection(): Promise<boolean> {
  try {
    await getAccount();
    return true;
  } catch (error) {
    console.warn('Binance connection failed:', error);
    return false;
  }
}
