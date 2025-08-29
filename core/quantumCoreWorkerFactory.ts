// Creates the Worker from a Blob to avoid bundler configuration.
export function createQuantumCoreWorker() {
  const workerCode = `
    let running = false;
    let last = 0;
    let acc = 0;
    const STEP_MS = 1000;
    let timeoutId = null;

    const MOCK_CANDLESTICK_DATA = [
        { time: '12:00', open: 1.0825, high: 1.0835, low: 1.0820, close: 1.0831, volume: 1200 },
        { time: '13:00', open: 1.0831, high: 1.0840, low: 1.0818, close: 1.0819, volume: 1500 },
        { time: '14:00', open: 1.0819, high: 1.0842, low: 1.0815, close: 1.0840, volume: 1800 },
        { time: '15:00', open: 1.0840, high: 1.0855, low: 1.0838, close: 1.0852, volume: 2500 },
        { time: '16:00', open: 1.0852, high: 1.0853, low: 1.0845, close: 1.0848, volume: 2000 },
        { time: '17:00', open: 1.0848, high: 1.0862, low: 1.0847, close: 1.0860, volume: 3000, aiSignal: 'BULLISH_CANDLE' },
        { time: '18:00', open: 1.0860, high: 1.0865, low: 1.0850, close: 1.0855, volume: 2200 },
        { time: '19:00', open: 1.0855, high: 1.0858, low: 1.0845, close: 1.0847, volume: 1900 },
    ];
    
    let state = null;

    function initializeState(params) {
      const initialMetrics = {
          initialBalance: params.initialAmount,
          currentBalance: params.initialAmount,
          totalProfit: 0,
          totalTrades: 0,
          winRate: 0,
      };
      const assetStates = (params.assets || []).map(instrument => ({
            instrument,
            priceHistory: MOCK_CANDLESTICK_DATA.map(c => ({ ...c, time: new Date().toLocaleTimeString() })),
            confidence: 50,
            rsi: 50,
            trend: 'SIDEWAYS',
        }));

      state = {
        steps: 0,
        elapsedMs: 0,
        status: "idle",
        params: params,
        snapshot: {
          metrics: initialMetrics,
          trades: [],
          assetStates: assetStates,
          confidenceHistory: [],
        }
      };
    }

    function doSimStep() {
        if (!state) return;
        state.steps += 1;
        const { snapshot, params } = state;
        const { trades, metrics, assetStates, confidenceHistory } = snapshot;

        const newStates = assetStates.map(asset => {
            const lastCandle = asset.priceHistory[asset.priceHistory.length - 1];
            const change = (Math.random() - 0.495) * (lastCandle.close * 0.005);
            const newClose = lastCandle.close + change;
            const newCandle = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                open: lastCandle.close,
                high: Math.max(lastCandle.close, newClose) + Math.random() * (lastCandle.close * 0.001),
                low: Math.min(lastCandle.close, newClose) - Math.random() * (lastCandle.close * 0.001),
                close: newClose,
            };
            const newPriceHistory = [...asset.priceHistory.slice(-99), newCandle];
    
            const gains = newPriceHistory.slice(-14).filter(p => p.close > p.open).length;
            const newRsi = (gains / 14) * 100;
            const trend = newClose > lastCandle.close ? 'UP' : newClose < lastCandle.close ? 'DOWN' : 'SIDEWAYS';
            
            let confidence = 50;
            if (newRsi < 30) confidence = 50 + (30 - newRsi) * 1.5;
            if (newRsi > 70) confidence = 50 + (newRsi - 70) * 1.5;
    
            return { ...asset, priceHistory: newPriceHistory, rsi: newRsi, trend, confidence: Math.min(99, confidence) };
        });
        snapshot.assetStates = newStates;
    
        let openTrades = trades.filter(t => t.status === 'OPEN');
        let closedTradesThisTick = [];
    
        openTrades.forEach(trade => {
            const asset = newStates.find(a => a.instrument === trade.instrument);
            if (!asset) return;

            const currentPrice = asset.priceHistory[asset.priceHistory.length - 1].close;
            const investedAmount = trade.investedAmount || 0;
            const currentProfitRatio = (currentPrice / trade.entryPrice);
            const stopLossThreshold = 0.05;
            const isStopLoss = (trade.action === 'BUY' && currentProfitRatio < (1 - stopLossThreshold)) ||
                               (trade.action === 'SELL' && currentProfitRatio > (1 + stopLossThreshold));
            const isReversal = (trade.action === 'BUY' && asset.rsi > 68) || (trade.action === 'SELL' && asset.rsi < 32);
            
            if (isStopLoss || isReversal) {
                const exitPrice = currentPrice;
                const returnedAmount = trade.action === 'BUY' ? (investedAmount * currentProfitRatio) : (investedAmount * (2 - currentProfitRatio));
                const profit = returnedAmount - investedAmount;
                closedTradesThisTick.push({ ...trade, status: 'CLOSED', exitPrice, profit, returnedAmount, exitTimestamp: Date.now() });
            }
        });
    
        const sortedAssets = [...newStates].filter(a => params.assets.includes(a.instrument)).sort((a, b) => b.confidence - a.confidence);
        const committedCapital = trades.filter(t => t.status === 'OPEN').reduce((sum, t) => sum + (t.investedAmount || 0), 0);
        let availableCapital = metrics.currentBalance - committedCapital;
        const allocationPercentages = [0.70, 0.10, 0.10, 0.05, 0.05];
        let newTradesThisTick = [];
        const confidenceThreshold = 85 - (params.riskTolerance * 0.35);

        sortedAssets.slice(0, 5).forEach((asset, index) => {
            const hasOpenTrade = trades.some(t => t.instrument === asset.instrument && t.status === 'OPEN');
            if (!hasOpenTrade && asset.confidence > confidenceThreshold) {
                const potentialInvestment = metrics.currentBalance * allocationPercentages[index];
                if (potentialInvestment <= availableCapital) {
                    const action = asset.rsi < 30 ? 'BUY' : 'SELL';
                    const newTrade = {
                        id: 'trade_'+ Date.now() + '_' + asset.instrument,
                        instrument: asset.instrument, action,
                        entryPrice: asset.priceHistory[asset.priceHistory.length - 1].close,
                        timestamp: Date.now(), status: 'OPEN',
                        confidence: asset.confidence,
                        reason: asset.rsi < 30 ? 'RSI Oversold' : 'RSI Overbought',
                        investedAmount: potentialInvestment,
                    };
                    newTradesThisTick.push(newTrade);
                    availableCapital -= potentialInvestment;
                }
            }
        });
    
        snapshot.trades = trades.map(t => closedTradesThisTick.find(ct => ct.id === t.id) || t).concat(newTradesThisTick);
        const totalProfitOfClosedTrades = snapshot.trades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.profit || 0), 0);
        const newCurrentBalance = metrics.initialBalance + totalProfitOfClosedTrades;
        const finalClosedTrades = snapshot.trades.filter(t => t.status === 'CLOSED');
        const successfulTrades = finalClosedTrades.filter(t => (t.profit || 0) > 0).length;
        
        snapshot.metrics = {
            initialBalance: metrics.initialBalance,
            currentBalance: newCurrentBalance,
            totalProfit: totalProfitOfClosedTrades,
            totalTrades: finalClosedTrades.length,
            winRate: finalClosedTrades.length > 0 ? (successfulTrades / finalClosedTrades.length) * 100 : 0,
        };

        const newConfidenceHistoryPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        params.assets.forEach(assetSymbol => {
            const assetState = newStates.find(s => s.instrument === assetSymbol);
            newConfidenceHistoryPoint[assetSymbol] = assetState ? assetState.confidence : 0;
        });
        snapshot.confidenceHistory = [...snapshot.confidenceHistory.slice(-99), newConfidenceHistoryPoint];
    }

    function tick(now) {
      if (!running) return;
      if (last === 0) last = now;
      const delta = now - last;
      last = now;
      acc += delta;
      state.elapsedMs += delta;

      while (acc >= STEP_MS) {
        doSimStep();
        acc -= STEP_MS;
      }

      postMessage({ type: "progress", payload: { ...state } });

      timeoutId = setTimeout(() => tick(performance.now()), 250);
    }

    onmessage = (e) => {
      const { type, payload } = e.data || {};
      switch(type) {
        case "SET_PARAMS":
          initializeState(payload);
          break;
        case "START":
          if (!state) initializeState(payload);
          running = true;
          last = 0;
          state.status = "running";
          tick(performance.now());
          break;
        case "STOP":
          running = false;
          if (timeoutId) clearTimeout(timeoutId);
          state.status = "stopped";
          postMessage({ type: "stopped", payload: { ...state } });
          break;
        case "RESET":
          running = false;
          if (timeoutId) clearTimeout(timeoutId);
          last = 0;
          acc = 0;
          initializeState(state.params);
          state.status = "idle";
          postMessage({ type: "reset", payload: { ...state } });
          break;
        case "EMERGENCY_STOP":
          running = false;
          if (timeoutId) clearTimeout(timeoutId);
          state.status = "emergency-stopped";
          postMessage({ type: "emergency_stopped", payload: { ...state } });
          break;
      }
    };
  `;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url, { name: "QuantumCoreWorker" });
}