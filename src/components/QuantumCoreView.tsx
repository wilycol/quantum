import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Cell } from 'recharts';
import { SimulationConfig, SimulatedTrade } from '../types';
import { MOCK_POSITIONS } from '../constants';
import Card from './ui/Card';
import { useQuantumCore } from '../hooks/useQuantumCore';
import QuantumCoreControls from './QuantumCoreControls';

const AVAILABLE_ASSETS = [...new Set(MOCK_POSITIONS.map(p => p.instrument))];
const ASSET_COLORS = ['#34c759', '#ff9500', '#007aff', '#ff3b30', '#5856d6', '#ff2d55', '#af52de'];

const INITIAL_PARAMS: Omit<SimulationConfig, 'riskLevel' | 'useAI'> = {
    initialBalance: 10000,
    riskPerTrade: 2,
    maxPositions: 5,
    stopLoss: 2,
    takeProfit: 4,
    leverage: 1,
    initialAmount: 10000,
    simulationTime: 5, // in minutes
    assets: AVAILABLE_ASSETS.slice(0, 5),
    riskTolerance: 50, // Default to balanced
};

const CustomTradeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SimulatedTrade = payload[0].payload;
      return (
        <div className="bg-brand-navy p-3 rounded-lg border border-brand-gold/50 text-xs text-white shadow-xl w-48">
          <p className="font-bold text-brand-gold mb-1">Trade: {data.instrument}</p>
          <p><strong>Invested:</strong> ${data.investedAmount?.toFixed(2)}</p>
          <p><strong>Confidence:</strong> {data.confidence?.toFixed(1)}%</p>
          <p><strong>Reason:</strong> {data.reason}</p>
          <p className={data.profit === undefined ? '' : data.profit >= 0 ? 'text-brand-green' : 'text-brand-red'}>
              <strong>Profit:</strong> ${data.profit?.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
};

const CustomConfidenceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-brand-navy p-3 rounded-lg border border-brand-gold/50 text-xs text-white shadow-xl min-w-[200px]">
                <p className="font-bold text-gray-300 mb-2">Time: {label}</p>
                <div className="space-y-1">
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} className="flex justify-between items-center">
                        <span style={{ color: pld.color }}>■ {pld.dataKey}</span>
                        <span className="font-semibold ml-4">{pld.value.toFixed(1)}%</span>
                    </div>
                ))}
                </div>
            </div>
        );
    }
    return null;
};

const QuantumCoreView: React.FC = () => {
    const [params, setParams] = useState(INITIAL_PARAMS);
    const { progress, status, start, stop, reset, emergencyStop } = useQuantumCore(params);

    const isRunning = status === 'running';

    const handleExport = () => {
        if (typeof progress === 'number' || !progress?.snapshot?.trades || progress.snapshot.trades.length === 0) {
            alert("No trades to export.");
            return;
        }
        // Simplified export for demonstration
        const data = JSON.stringify(progress.snapshot.trades, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quantumcore_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const metrics = (typeof progress === 'object' && progress?.snapshot?.metrics) || {
        currentBalance: params.initialAmount,
        totalProfit: 0,
        totalTrades: 0,
        winRate: 0,
    };

    const trades = (typeof progress === 'object' && progress?.snapshot?.trades) || [];
    const confidenceHistory = (typeof progress === 'object' && progress?.snapshot?.confidenceHistory) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Config Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card className="bg-brand-navy border border-gray-700/50 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-brand-gold mb-4">Simulation Config</h3>
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Initial Amount ($)</label>
                            <input type="number" value={params.initialAmount} onChange={e => setParams(p => ({...p, initialAmount: Number(e.target.value)}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold" disabled={isRunning} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Simulation Time</label>
                            <select value={params.simulationTime} onChange={e => setParams(p => ({...p, simulationTime: Number(e.target.value)}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold" disabled={isRunning}>
                                <option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option>
                            </select>
                        </div>
                        <div title="Controls how aggressive the AI is.">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Risk Tolerance</label>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔒</span>
                                <input type="range" min="0" max="100" value={params.riskTolerance} onChange={e => setParams(p => ({...p, riskTolerance: Number(e.target.value)}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-gold" disabled={isRunning} />
                                <span className="text-xl">⚡</span>
                            </div>
                            <div className="text-center text-sm text-gray-400 mt-1">{
                                params.riskTolerance > 75 ? 'Fearless' : params.riskTolerance > 25 ? 'Balanced' : 'Cautious'
                            }</div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Assets</label>
                            <div className="max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-1">
                                {AVAILABLE_ASSETS.map(asset => (
                                    <label key={asset} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={params.assets.includes(asset)} onChange={() => setParams(prev => ({...prev, assets: prev.assets.includes(asset) ? prev.assets.filter(a=>a!==asset) : [...prev.assets, asset]}))} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-brand-gold focus:ring-brand-gold" disabled={isRunning}/>
                                        <span className="text-gray-300">{asset}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <QuantumCoreControls 
                            status={status}
                            onStart={() => start(params)} 
                            onStop={stop} 
                            onReset={reset} 
                            onEmergencyStop={emergencyStop} 
                            onExport={handleExport}
                        />
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6">
                <Card className="bg-brand-navy border border-gray-700/50">
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div><h4 className="text-sm text-gray-400 uppercase">Elapsed</h4><p className="text-2xl font-bold text-brand-gold">{formatTime((typeof progress === 'object' && progress?.elapsedMs) ?? 0)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Balance</h4><p className="text-2xl font-bold text-white">${metrics.currentBalance.toFixed(2)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">P/L</h4><p className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>${metrics.totalProfit.toFixed(2)}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Trades</h4><p className="text-2xl font-bold text-white">{metrics.totalTrades}</p></div>
                        <div><h4 className="text-sm text-gray-400 uppercase">Win Rate</h4><p className="text-2xl font-bold text-brand-gold">{metrics.winRate.toFixed(1)}%</p></div>
                    </div>
                </Card>
                 <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="bg-brand-navy border border-gray-700/50 min-h-[250px] flex flex-col">
                         <h3 className="text-lg font-bold text-brand-gold mb-2">Confidence Tracker (Steps: {(typeof progress === 'object' && progress?.steps) ?? 0})</h3>
                         <div className="flex-grow">
                             <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={confidenceHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                                    <XAxis dataKey="time" stroke="#9a9a9a" fontSize={12} interval="preserveStartEnd" />
                                    <YAxis stroke="#9a9a9a" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                                    <Tooltip content={<CustomConfidenceTooltip />} cursor={{fill: 'rgba(212, 175, 55, 0.1)'}}/>
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    {(params.assets || []).slice(0, 5).map((asset: string, i: number) => (
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
                                <BarChart data={trades.filter((t: SimulatedTrade) => t.status === 'CLOSED')} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                                    <XAxis dataKey="timestamp" stroke="#9a9a9a" fontSize={10} tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
                                    <YAxis stroke="#9a9a9a" fontSize={10} tickFormatter={(val) => `$${Number(val/1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTradeTooltip />} cursor={{fill: 'rgba(212, 175, 55, 0.1)'}}/>
                                    <Bar dataKey="investedAmount">
                                         {trades.filter((t: SimulatedTrade) => t.status === 'CLOSED').map((trade: SimulatedTrade, index: number) => (
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
                      <div className="table-scroll">
                        <table className="qtable">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Asset</th>
                                    <th>Action</th>
                                    <th>Invested ($)</th>
                                    <th>Confidence</th>
                                    <th>Reason</th>
                                    <th className="text-right">Profit ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.sort((a: SimulatedTrade, b: SimulatedTrade) => b.timestamp - a.timestamp).map((trade: SimulatedTrade) => (
                                    <tr key={trade.id} className="hover:bg-gray-800/60 transition-colors duration-200 cursor-pointer text-xs">
                                        <td><span className={`px-2 py-0.5 font-semibold rounded-full ${trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{trade.status}</span></td>
                                        <td className="text-white">{trade.instrument}</td>
                                        <td className={`font-semibold ${trade.action === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>{trade.action}</td>
                                        <td>{trade.investedAmount?.toFixed(2)}</td>
                                        <td>{trade.confidence?.toFixed(1) || '--'}%</td>
                                        <td>{trade.reason || '--'}</td>
                                        <td className={`font-semibold text-right ${trade.profit === undefined ? 'text-gray-400' : trade.profit >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                                            {trade.profit?.toFixed(2) || '...'}
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

export default QuantumCoreView;