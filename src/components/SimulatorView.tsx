
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label, Line, Legend, BarChart, Cell } from 'recharts';
import { SimulationConfig, SimulatedTrade, SimulationMetrics, Candle, AssetState } from '../types';
import { MOCK_CANDLESTICK_DATA, MOCK_POSITIONS } from '../constants';
import Card from './ui/Card';

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const AVAILABLE_ASSETS = [...new Set(MOCK_POSITIONS.map(p => p.instrument))];
const ASSET_COLORS = ['#34c759', '#ff9500', '#007aff', '#ff3b30', '#5856d6', '#ff2d55', '#af52de'];

const INITIAL_CONFIG: SimulationConfig = {
    initialBalance: 10000,
    riskPerTrade: 2,
    maxPositions: 5,
    stopLoss: 2,
    takeProfit: 4,
    leverage: 1,
    initialAmount: 10000,
    simulationTime: 5, // in minutes
    assets: AVAILABLE_ASSETS.slice(0, 5),
    riskLevel: 'Balanced',
    riskTolerance: 50, // Default to balanced
    useAI: true,
};

const INITIAL_METRICS: SimulationMetrics = {
    initialBalance: INITIAL_CONFIG.initialAmount,
    currentBalance: INITIAL_CONFIG.initialAmount,
    totalProfit: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPL: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    profitFactor: 0,
};

// Custom Tooltip for the new Executed Operations chart
const CustomTradeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SimulatedTrade = payload[0].payload;
      const durationSeconds = data.exitTimestamp && data.timestamp
            ? (data.exitTimestamp - data.timestamp) / 1000
            : 0;
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.floor(durationSeconds % 60);
      const timeInOperation = `${minutes}m ${seconds}s`;

      return (
        <div className="bg-brand-navy p-3 rounded-lg border border-brand-gold/50 text-xs text-white shadow-xl w-48">
          <p className="font-bold text-brand-gold mb-1">Trade: {data.instrument}</p>
          <p><strong>Invested:</strong> ${data.investedAmount?.toFixed(2)}</p>
           <p><strong>Duration:</strong> {timeInOperation}</p>
          <p><strong>Confidence:</strong> {data.confidence?.toFixed(1)}%</p>
          <p><strong>Reason:</strong> {data.reason}</p>
          <p><strong>Exit Trigger:</strong> {data.exitTrigger || 'N/A'}</p>
          <p className={data.profit === undefined ? '' : data.profit >= 0 ? 'text-brand-green' : 'text-brand-red'}>
              <strong>Profit:</strong> ${data.profit?.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
};


const SimulatorView: React.FC = () => {
    const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
    const [metrics, setMetrics] = useState<SimulationMetrics>(INITIAL_METRICS);
    const [trades, setTrades] = useState<SimulatedTrade[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    
    const [assetStates, setAssetStates] = useState<AssetState[]>([]);
    const [confidenceHistory, setConfidenceHistory] = useState<any[]>([]);
    
    const [selectedTrade, setSelectedTrade] = useState<SimulatedTrade | null>(null);

    // Use refs to hold the latest state for use inside setInterval
    const tradesRef = useRef(trades);
    const metricsRef = useRef(metrics);
    const assetStatesRef = useRef(assetStates);
    const configRef = useRef(config);

    useEffect(() => { tradesRef.current = trades; }, [trades]);
    useEffect(() => { metricsRef.current = metrics; }, [metrics]);
    useEffect(() => { assetStatesRef.current = assetStates; }, [assetStates]);
    useEffect(() => { configRef.current = config; }, [config]);

    const initializeAssetStates = useCallback(() => {
        return AVAILABLE_ASSETS.map((instrument): AssetState => ({
            symbol: instrument,
            price: 100 + Math.random() * 50,
            change24h: (Math.random() - 0.5) * 10,
            volume: 1500 + (Math.random() * 1000),
            instrument,
            priceHistory: MOCK_CANDLESTICK_DATA.map(c => ({ ...c, time: new Date().toLocaleTimeString() })), // Start with fresh timestamps
            confidence: 50,
            rsi: 50,
            trend: 'SIDEWAYS',
            noise: Math.random(),
            momentum: 0,
            signalReliability: 60 + (Math.random() * 20),
        }));
    }, []);

    // Custom Tooltip for the new Confidence Tracker chart
    const CustomConfidenceTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const currentTrades = tradesRef.current; 

            return (
                <div className="bg-brand-navy p-3 rounded-lg border border-brand-gold/50 text-xs text-white shadow-xl min-w-[200px]">
                    <p className="font-bold text-gray-300 mb-2">Time: {label}</p>
                    <div className="space-y-1">
                    {payload.map((pld: any) => {
                        const assetName = pld.dataKey;
                        const confidence = pld.value;
                        
                        const hasOpenTrade = currentTrades.some(t => t.instrument === assetName && t.status === 'OPEN');
                        let status = 'Analyzed';
                        if (hasOpenTrade) {
                            status = 'Operated';
                        } else if (confidence < 40) { // Arbitrary low confidence threshold
                            status = 'Discarded';
                        }
                        
                        return (
                            <div key={assetName} className="flex justify-between items-center">
                                <span style={{ color: pld.color }}>■ {assetName}</span>
                                <span className="font-semibold ml-4">{confidence.toFixed(1)}%</span>
                                <span className={`ml-2 font-semibold ${hasOpenTrade ? 'text-blue-400' : 'text-gray-400'}`}>({status})</span>
                            </div>
                        );
                    })}
                    </div>
                </div>
            );
        }
        return null;
    };


    const runSimulationTick = useCallback(() => {
        // Use refs to get the latest state inside the interval
        const currentTrades = tradesRef.current;
        const currentMetrics = metricsRef.current;
        const currentAssetStates = assetStatesRef.current;
        const currentConfig = configRef.current;

        const newStates = currentAssetStates.map(asset => {
            const lastCandle = asset.priceHistory[asset.priceHistory.length - 1];
            const change = (Math.random() - 0.495) * (lastCandle.close * 0.005);
            const newClose = lastCandle.close + change;
            const newCandle: Candle = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                open: lastCandle.close,
                high: Math.max(lastCandle.close, newClose) + Math.random() * (lastCandle.close * 0.001),
                low: Math.min(lastCandle.close, newClose) - Math.random() * (lastCandle.close * 0.001),
                close: newClose,
            };
            const newPriceHistory = [...asset.priceHistory.slice(-99), newCandle];
    
            const gains = newPriceHistory.slice(-14).filter(p => p.close > p.open).length;
            const newRsi = (gains / 14) * 100;
            const trend: 'UP' | 'DOWN' | 'SIDEWAYS' = newClose > lastCandle.close ? 'UP' : newClose < lastCandle.close ? 'DOWN' : 'SIDEWAYS';
            
            let confidence = 50;
            if (newRsi < 30) confidence = 50 + (30 - newRsi) * 1.5;
            if (newRsi > 70) confidence = 50 + (newRsi - 70) * 1.5;
    
            return { ...asset, priceHistory: newPriceHistory, rsi: newRsi, trend, confidence: Math.min(99, confidence) };
        });
    
        setAssetStates(newStates);
    
        let openTrades = currentTrades.filter(t => t.status === 'OPEN');
        let closedTradesThisTick: SimulatedTrade[] = [];
    
        openTrades.forEach(trade => {
            const asset = newStates.find(a => a.instrument === trade.instrument);
            if (!asset) return;

            const currentPrice = asset.priceHistory[asset.priceHistory.length - 1].close;
            const investedAmount = trade.investedAmount || 0;
            const currentProfitRatio = (currentPrice / trade.entryPrice);

            // Stop-Loss Logic: Close if loss exceeds 5%
            const stopLossThreshold = 0.05;
            const isStopLoss = (trade.action === 'BUY' && currentProfitRatio < (1 - stopLossThreshold)) ||
                               (trade.action === 'SELL' && currentProfitRatio > (1 + stopLossThreshold));

            // Trend Reversal Logic
            const isReversal = (trade.action === 'BUY' && asset.rsi > 68) || (trade.action === 'SELL' && asset.rsi < 32);
            
            let exitTrigger: string | null = null;
            if (isStopLoss) {
                exitTrigger = 'Stop-Loss Triggered';
            } else if (isReversal) {
                exitTrigger = 'Trend Reversal';
            }

            if (exitTrigger) {
                const exitPrice = currentPrice;
                const returnedAmount = trade.action === 'BUY' ? (investedAmount * currentProfitRatio) : (investedAmount * (2 - currentProfitRatio));
                const profit = returnedAmount - investedAmount;
                closedTradesThisTick.push({ ...trade, status: 'CLOSED', exitPrice, profit, returnedAmount, exitTimestamp: Date.now(), exitStrategy: 'Algorithmic', exitTrigger });
            }
        });
    
        const sortedAssets = [...newStates].filter(a => currentConfig.assets.includes(a.instrument)).sort((a, b) => b.confidence - a.confidence);
        const committedCapital = currentTrades.filter(t => t.status === 'OPEN').reduce((sum, t) => sum + (t.investedAmount || 0), 0);
        let availableCapital = currentMetrics.currentBalance - committedCapital;

        const allocationPercentages = [0.70, 0.10, 0.10, 0.05, 0.05];
        
        let newTradesThisTick: SimulatedTrade[] = [];
        const confidenceThreshold = 85 - (currentConfig.riskTolerance * 0.35);

        sortedAssets.slice(0, 5).forEach((asset, index) => {
            const hasOpenTrade = currentTrades.some(t => t.instrument === asset.instrument && t.status === 'OPEN');
            if (!hasOpenTrade && asset.confidence > confidenceThreshold) {
                const potentialInvestment = currentMetrics.currentBalance * allocationPercentages[index];
                if (potentialInvestment <= availableCapital) {
                    const action = asset.rsi < 30 ? 'BUY' : 'SELL';
                    const reason = asset.rsi < 30 ? 'RSI Oversold' : 'RSI Overbought';
                    const newTrade: SimulatedTrade = {
                        id: `trade_${Date.now()}_${asset.instrument}`,
                        instrument: asset.instrument,
                        type: action,
                        size: potentialInvestment / asset.priceHistory[asset.priceHistory.length - 1].close,
                        action,
                        entryPrice: asset.priceHistory[asset.priceHistory.length - 1].close,
                        timestamp: Date.now(),
                        status: 'OPEN',
                        confidence: asset.confidence,
                        reason,
                        investedAmount: potentialInvestment,
                    };
                    newTradesThisTick.push(newTrade);
                    availableCapital -= potentialInvestment; // Reserve capital for this tick
                }
            }
        });
    
        const updatedTrades = currentTrades.map(t => closedTradesThisTick.find(ct => ct.id === t.id) || t).concat(newTradesThisTick);
        setTrades(updatedTrades);

        const totalProfitOfClosedTrades = updatedTrades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.profit || 0), 0);
        const newCurrentBalance = currentMetrics.initialBalance + totalProfitOfClosedTrades;

        const finalClosedTrades = updatedTrades.filter(t => t.status === 'CLOSED');
        const successfulTrades = finalClosedTrades.filter(t => (t.profit || 0) > 0).length;
        setMetrics({
            initialBalance: currentMetrics.initialBalance,
            currentBalance: newCurrentBalance,
            totalProfit: totalProfitOfClosedTrades,
            totalTrades: finalClosedTrades.length,
            winRate: finalClosedTrades.length > 0 ? (successfulTrades / finalClosedTrades.length) * 100 : 0,
        });
        
        // Populate confidence history for the new chart
        const newConfidenceHistoryPoint: {[key: string]: any} = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        currentConfig.assets.forEach(assetSymbol => {
            const assetState = newStates.find(s => s.instrument === assetSymbol);
            newConfidenceHistoryPoint[assetSymbol] = assetState ? assetState.confidence : 0;
        });
        
        setConfidenceHistory(prev => [...prev.slice(-99), newConfidenceHistoryPoint]);

    }, []);
    
    useEffect(() => {
        let simulationInterval: ReturnType<typeof setInterval>;
        if (isSimulating) {
            simulationInterval = setInterval(runSimulationTick, 2000); // Slower tick for stability
        }
        return () => clearInterval(simulationInterval);
    }, [isSimulating, runSimulationTick]);

    useEffect(() => {
        let countdownInterval: ReturnType<typeof setInterval>;
        if (isSimulating && remainingTime > 0) {
            countdownInterval = setInterval(() => setRemainingTime(t => t - 1), 1000);
        } else if (isSimulating && remainingTime <= 0) {
            handleStop(true); // Pass true to indicate it's a timed finish
        }
        return () => clearInterval(countdownInterval);
    }, [isSimulating, remainingTime]);

    const handleStart = () => {
        if (config.assets.length === 0) {
            alert("Please select at least one asset to simulate.");
            return;
        }
        const initialStates = initializeAssetStates();
        setAssetStates(initialStates);
        setRemainingTime(config.simulationTime * 60);
        const newMetrics = { ...INITIAL_METRICS, initialBalance: config.initialAmount, currentBalance: config.initialAmount };
        setMetrics(newMetrics);
        setTrades([]);
        setConfidenceHistory([]);
        setIsSimulating(true);
    };

    const handleStop = (isFinished = false) => {
        setIsSimulating(false);
        const finalAssetStates = assetStatesRef.current;
        const finalTrades = tradesRef.current;
        const closedTrades = finalTrades.map((trade): SimulatedTrade => {
            if (trade.status === 'OPEN') {
                const asset = finalAssetStates.find(a => a.instrument === trade.instrument);
                if (!asset) return trade;

                const exitPrice = asset.priceHistory[asset.priceHistory.length - 1].close;
                const priceChangeRatio = exitPrice / trade.entryPrice;
                const investedAmount = trade.investedAmount || 0;
                const returnedAmount = trade.action === 'BUY' ? (investedAmount * priceChangeRatio) : (investedAmount * (2 - priceChangeRatio));
                const profit = returnedAmount - investedAmount;

                return {
                    ...trade,
                    status: 'CLOSED',
                    exitPrice,
                    profit,
                    returnedAmount,
                    exitTimestamp: Date.now(),
                    exitStrategy: isFinished ? 'System' : 'Manual',
                    exitTrigger: isFinished ? 'Simulation Timeout' : 'Manual Stop'
                };
            }
            return trade;
        });
        setTrades(closedTrades);

        // Recalculate final metrics after closing all trades
        const totalProfitOfAllTrades = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
        const newCurrentBalance = metricsRef.current.initialBalance + totalProfitOfAllTrades;
        const successfulTrades = closedTrades.filter(t => (t.profit || 0) > 0).length;

        setMetrics({
            initialBalance: metricsRef.current.initialBalance,
            currentBalance: newCurrentBalance,
            totalProfit: totalProfitOfAllTrades,
            totalTrades: closedTrades.length,
            winRate: closedTrades.length > 0 ? (successfulTrades / closedTrades.length) * 100 : 0,
        });

        if (isFinished) {
            alert("Simulation finished!");
        }
    };
    
    const handleReset = () => {
        setIsSimulating(false);
        setConfig(INITIAL_CONFIG);
        setMetrics(INITIAL_METRICS);
        setTrades([]);
        setAssetStates([]);
        setConfidenceHistory([]);
        setRemainingTime(0);
        setSelectedTrade(null);
    };
    
    const handleExportCSV = () => {
        const closedTrades = tradesRef.current.filter(t => t.status === 'CLOSED');
        if (closedTrades.length === 0) {
            alert("No closed trades to export.");
            return;
        }
        const headers = "ID,Instrument,Action,Entry Price,Exit Price,Invested ($),Returned ($),Profit ($),Duration (s),Timestamp,Confidence (%),Reason,Exit Strategy,Exit Trigger";
        const rows = closedTrades
            .map(t => {
                const durationInSeconds = t.exitTimestamp && t.timestamp ? (t.exitTimestamp - t.timestamp) / 1000 : 0;
                return [
                    t.id, t.instrument, t.action,
                    t.entryPrice.toFixed(4),
                    t.exitPrice?.toFixed(4) || 'N/A',
                    t.investedAmount?.toFixed(4) || 'N/A',
                    t.returnedAmount?.toFixed(4) || 'N/A',
                    t.profit?.toFixed(4) || 'N/A',
                    durationInSeconds.toFixed(2),
                    new Date(t.timestamp).toISOString(),
                    t.confidence?.toFixed(1) || 'N/A',
                    `"${t.reason?.replace(/"/g, '""') || 'N/A'}"`,
                    `"${t.exitStrategy?.replace(/"/g, '""') || 'N/A'}"`,
                    `"${t.exitTrigger?.replace(/"/g, '""') || 'N/A'}"`
                ].join(',');
            }
        ).join('\n');

        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "quantum_trade_simulation_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    const renderTradeDetailModal = () => {
        if (!selectedTrade) return null;
        
        const durationSeconds = selectedTrade.exitTimestamp && selectedTrade.timestamp
            ? (selectedTrade.exitTimestamp - selectedTrade.timestamp) / 1000
            : 0;
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = Math.floor(durationSeconds % 60);
        const timeInOperation = `${minutes} min ${seconds} sec`;

        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTrade(null)}>
                <div className="bg-brand-navy p-6 rounded-xl border-2 border-brand-gold/50 shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-brand-gold">🧾 Trade Analysis: {selectedTrade.instrument}</h3>
                        <button onClick={() => setSelectedTrade(null)} className="p-1 rounded-full hover:bg-gray-700">
                            <XMarkIcon className="w-6 h-6 text-gray-400"/>
                        </button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex justify-between p-2 bg-gray-900/40 rounded-md"><span>Action</span> <span className={`font-bold ${selectedTrade.action === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>{selectedTrade.action}</span></div>
                        <div className="flex justify-between p-2 bg-gray-800/40 rounded-md"><span>Entry Reason</span> <span className="font-semibold">{selectedTrade.reason || '--'}</span></div>
                        <div className="flex justify-between p-2 bg-gray-900/40 rounded-md"><span>AI Confidence</span> <span className="font-semibold text-brand-gold">{selectedTrade.confidence?.toFixed(1)}%</span></div>
                        <div className="flex justify-between p-2 bg-gray-800/40 rounded-md"><span>Amount Invested</span> <span className="font-semibold">${selectedTrade.investedAmount?.toFixed(4)}</span></div>
                        <div className="flex justify-between p-2 bg-gray-900/40 rounded-md"><span>Time in Operation</span> <span className="font-semibold">{timeInOperation}</span></div>
                        <div className="flex justify-between p-2 bg-gray-800/40 rounded-md"><span>Exit Strategy</span> <span className="font-semibold">{selectedTrade.exitStrategy || 'N/A'}</span></div>
                        <div className="flex justify-between p-2 bg-gray-900/40 rounded-md"><span>Exit Trigger</span> <span className="font-semibold">{selectedTrade.exitTrigger || 'N/A'}</span></div>
                        <div className="flex justify-between p-2 bg-gray-800/40 rounded-md"><span>Profit/Loss</span> <span className={`font-bold ${selectedTrade.profit === undefined ? '' : selectedTrade.profit >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>${selectedTrade.profit?.toFixed(4) || 'N/A'}</span></div>
                        <div className="flex justify-between p-2 bg-gray-900/40 rounded-md"><span>Status</span> <span className="font-semibold">{selectedTrade.status}</span></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {renderTradeDetailModal()}
            {/* Config Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card className="bg-brand-navy border border-gray-700/50 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-brand-gold mb-4">Simulation Config</h3>
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Initial Amount ($)</label>
                            <input type="number" value={config.initialAmount} onChange={e => setConfig(p => ({...p, initialAmount: Number(e.target.value)}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold" disabled={isSimulating} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Simulation Time</label>
                            <select value={config.simulationTime} onChange={e => setConfig(p => ({...p, simulationTime: Number(e.target.value)}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold" disabled={isSimulating}>
                                <option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option>
                            </select>
                        </div>
                        <div title="Controls how aggressive the AI is. Cautious requires high confidence to trade, while Fearless acts on weaker signals.">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Risk Tolerance</label>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔒</span>
                                <input type="range" min="0" max="100" value={config.riskTolerance} onChange={e => setConfig(p => ({...p, riskTolerance: Number(e.target.value)}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-gold" disabled={isSimulating} />
                                <span className="text-xl">⚡</span>
                            </div>
                            <div className="text-center text-sm text-gray-400 mt-1">{
                                config.riskTolerance > 75 ? 'Fearless' : config.riskTolerance > 25 ? 'Balanced' : 'Cautious'
                            }</div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Assets</label>
                            <div className="max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-1">
                                {AVAILABLE_ASSETS.map(asset => (
                                    <label key={asset} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={config.assets.includes(asset)} onChange={() => setConfig(prev => ({...prev, assets: prev.assets.includes(asset) ? prev.assets.filter(a=>a!==asset) : [...prev.assets, asset]}))} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-brand-gold focus:ring-brand-gold" disabled={isSimulating}/>
                                        <span className="text-gray-300">{asset}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleStart} disabled={isSimulating} className="bg-brand-gold text-black font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Start</button>
                            <button onClick={() => handleStop(false)} disabled={!isSimulating} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed">Stop</button>
                        </div>
                        <button onClick={handleReset} disabled={isSimulating} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed">Reset</button>
                        <button onClick={() => handleStop(false)} disabled={!isSimulating} className="bg-brand-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Emergency Stop</button>
                        <button onClick={handleExportCSV} disabled={isSimulating || trades.length === 0} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Export Results</button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6">
                <Card className="bg-brand-navy border border-gray-700/50">
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div><h4 className="text-sm text-gray-400 uppercase">Timer</h4><p className="text-2xl font-bold text-brand-gold">{formatTime(remainingTime)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Current Balance</h4><p className="text-2xl font-bold text-white">${metrics.currentBalance.toFixed(4)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Total P/L</h4><p className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>${metrics.totalProfit.toFixed(4)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Trades</h4><p className="text-2xl font-bold text-white">{metrics.totalTrades}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Win Rate</h4><p className="text-2xl font-bold text-brand-gold">{metrics.winRate.toFixed(1)}%</p></div>
                    </div>
                </Card>
                <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="bg-brand-navy border border-gray-700/50 min-h-[250px] flex flex-col">
                         <h3 className="text-lg font-bold text-brand-gold mb-2">Confidence Tracker</h3>
                         <div className="flex-grow">
                             <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={confidenceHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                                    <XAxis dataKey="time" stroke="#9a9a9a" fontSize={12} interval="preserveStartEnd" />
                                    <YAxis stroke="#9a9a9a" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                                    <Tooltip content={<CustomConfidenceTooltip />} cursor={{fill: 'rgba(212, 175, 55, 0.1)'}}/>
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    {config.assets.slice(0, 5).map((asset, i) => (
                                        <Line key={asset} type="monotone" dataKey={asset} stroke={ASSET_COLORS[i % ASSET_COLORS.length]} dot={false} strokeWidth={2} name={asset}/>
                                    ))}
                                </ComposedChart>
                             </ResponsiveContainer>
                         </div>
                    </Card>
                    <Card className="bg-brand-navy border border-gray-700/50 min-h-[250px] flex flex-col">
                        <h3 className="text-lg font-bold text-brand-gold mb-2">Executed Operations Timeline</h3>
                        <div className="flex-grow">
                           <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trades.filter(t => t.status === 'CLOSED')} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                                    <XAxis dataKey="timestamp" stroke="#9a9a9a" fontSize={10} tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
                                    <YAxis stroke="#9a9a9a" fontSize={10} tickFormatter={(val) => `$${Number(val/1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTradeTooltip />} cursor={{fill: 'rgba(212, 175, 55, 0.1)'}}/>
                                    <Bar dataKey="investedAmount">
                                         {trades.filter(t => t.status === 'CLOSED').map((trade, index) => (
                                            <Cell key={`cell-${index}`} fill={(trade.profit || 0) >= 0 ? '#34c759' : '#ff3b30'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
                <Card className="bg-brand-navy border border-gray-700/50">
                     <h3 className="text-lg font-bold text-brand-gold mb-2">Executed Trades</h3>
                     <div className="overflow-y-auto max-h-48">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Status</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Asset</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Action</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Invested ($)</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Confidence</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase">Reason</th>
                                    <th className="py-2 px-1 font-semibold text-xs text-gray-400 uppercase text-right">Profit ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.sort((a,b) => b.timestamp - a.timestamp).map(trade => (
                                    <tr key={trade.id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/60 transition-colors duration-200 cursor-pointer" onClick={() => setSelectedTrade(trade)}>
                                        <td className="py-2 px-1 text-xs">
                                            <span className={`px-2 py-0.5 font-semibold rounded-full ${trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{trade.status}</span>
                                        </td>
                                        <td className="py-2 px-1 text-white text-xs">{trade.instrument}</td>
                                        <td className={`py-2 px-1 font-semibold text-xs ${trade.action === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>{trade.action}</td>
                                        <td className="py-2 px-1 text-gray-300 text-xs">{trade.investedAmount?.toFixed(4)}</td>
                                        <td className="py-2 px-1 text-gray-300 text-xs">{trade.confidence?.toFixed(1) || '--'}%</td>
                                        <td className="py-2 px-1 text-gray-300 text-xs">{trade.reason || '--'}</td>
                                        <td className={`py-2 px-1 font-semibold text-xs text-right ${trade.profit === undefined ? 'text-gray-400' : trade.profit >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                                            {trade.profit?.toFixed(4) || '...'}
                                        </td>
                                    </tr>
                                ))}
                                {trades.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-gray-500 py-4">No trades executed yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                </Card>
            </div>
        </div>
    );
};

export default SimulatorView;