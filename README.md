# Quantum Trade AI

Sistema de trading con IA Coach, feed en vivo y trading multi-modal (Paper/Testnet/Live).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   VITE_TRADING_MODE=paper
   VITE_DATA_MODE=live
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## API Testing

### Klines Endpoint Testing

Test the blindado klines API with fallbacks:

#### 1. Basic Test
```bash
curl "https://your-vercel-app.vercel.app/api/klines?symbol=BTCUSDT&interval=1m&limit=5"
```

**Expected Response:**
- Status: `200`
- Headers: `X-Vercel-Region: fra1`
- Headers: `X-Data-Host: https://data-api.binance.vision` (or fallback)
- Body: Array of 5 kline objects

#### 2. Fallback Test
To test fallback mechanism, temporarily modify `api/klines.ts`:

```typescript
// Change this line temporarily:
const PRIMARY_BASE = 'https://invalid-host.example.com';
```

Then test again:
```bash
curl "https://your-vercel-app.vercel.app/api/klines?symbol=BTCUSDT&interval=1m&limit=5"
```

**Expected Response:**
- Status: `200` (should still work via fallback)
- Headers: `X-Data-Host: https://testnet.binance.vision` (or other fallback)
- Body: Array of kline objects

#### 3. Region Verification
```bash
curl -I "https://your-vercel-app.vercel.app/api/klines?symbol=BTCUSDT&interval=1m&limit=1"
```

**Expected Headers:**
```
X-Vercel-Region: fra1
X-Data-Host: https://data-api.binance.vision
```

### Debug Endpoints

#### Region Info
```bash
curl "https://your-vercel-app.vercel.app/api/debug/where"
```

#### Feed Diagnostics
```bash
curl "https://your-vercel-app.vercel.app/api/debug/feed"
```

## Trading Modes

- **Demo Full**: Feed simulado + Paper trading (100% seguro)
- **Demo Híbrido**: Feed en vivo + Paper trading (datos reales, trading simulado)
- **Live Trading**: Feed en vivo + Órdenes reales (Preview=Testnet; Prod=Paper forzado)

## Architecture

- **Frontend**: Vite + React + TypeScript
- **Backend**: Vercel Serverless Functions
- **Trading**: Paper engine + Binance API integration
- **AI Coach**: RSI/EMA signals + performance metrics
- **Data**: Binance API with intelligent fallbacks
