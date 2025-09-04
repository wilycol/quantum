
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from './ui/Card';
import { MOCK_PORTFOLIO_ASSETS, MOCK_REAL_PORTFOLIO_ASSETS, MOCK_PORTFOLIO_HISTORY, MOCK_PORTFOLIO_EVOLUTION, MOCK_PORTFOLIO_EVENTS } from '../constants';
import { PortfolioAsset } from '../types';
import { getPortfolioAnalysis, getComparisonAnalysis } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';


// Icons
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v6.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>);
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v1.666c0 .414-.162.79-.426 1.075a1.875 1.875 0 0 1-2.148 0c-.264-.285-.426-.66-.426-1.075v-1.666M4.75 8.25v1.666c0 .414.162.79.426 1.075a1.875 1.875 0 0 0 2.148 0c.264-.285.426-.66.426-1.075V8.25" /></svg>);


const PortfolioView: React.FC = () => {
    const { settings, t, dispatchNotification } = useSettings();
    const [mode, setMode] = useState<'Simulated' | 'Real'>('Simulated');
    const [isComparing, setIsComparing] = useState(false);

    const [simulatedAssets] = useState<PortfolioAsset[]>(MOCK_PORTFOLIO_ASSETS);
    const [realAssets] = useState<PortfolioAsset[]>(MOCK_REAL_PORTFOLIO_ASSETS);

    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

    const [comparisonAnalysis, setComparisonAnalysis] = useState<string>('');
    const [isComparisonLoading, setIsComparisonLoading] = useState<boolean>(false);

    const activeAssets = useMemo(() => mode === 'Simulated' ? simulatedAssets : realAssets, [mode, simulatedAssets, realAssets]);
    
    useEffect(() => {
        const checkPerformance = () => {
            if (settings.notificationConfig.triggers.significantMoves) {
                activeAssets.forEach(asset => {
                    if (asset.plPercent <= -10) {
                        dispatchNotification({
                            type: 'portfolio_warning',
                            title: 'Alerta de Portafolio',
                            message: `El activo ${asset.name} ha caído un ${asset.plPercent.toFixed(1)}%.`,
                            linkTo: 'portfolio'
                        });
                    }
                });
            }
        };
        // Check once on load/mode change, could be tied to a real-time data fetch in a real app
        checkPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAssets, settings.notificationConfig.triggers.significantMoves]);


    const CONVERSION_RATES = { USD: 1, EUR: 0.92, JPY: 157 };
    
    const formatCurrency = useCallback((value: number) => {
        const rate = CONVERSION_RATES[settings.baseCurrency] || 1;
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: settings.baseCurrency,
        }).format(value * rate);
    }, [settings.baseCurrency]);

    const formatTimestamp = useCallback((timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, { timeZone: settings.timezone });
    }, [settings.timezone]);

    const totalPortfolioValue = useMemo(() => activeAssets.reduce((sum, asset) => sum + asset.totalValue, 0), [activeAssets]);

    const distributionData = useMemo(() => {
        const categories = activeAssets.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + asset.totalValue;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [activeAssets]);

    const DISTRIBUTION_COLORS = {
        'Crypto': '#f7931a',
        'Stocks': '#007aff',
        'Forex': '#34c759',
        'Fiat': '#9a9a9a'
    };

    const handleFetchAnalysis = useCallback(async () => {
        setIsAiLoading(true);
        setAiAnalysis('');
        try {
            const analysis = await getPortfolioAnalysis(activeAssets);
            setAiAnalysis(analysis);
        } catch (error) {
            setAiAnalysis("Error: No se pudo obtener el análisis de la IA.");
        } finally {
            setIsAiLoading(false);
        }
    }, [activeAssets]);

    const handleFetchComparisonAnalysis = useCallback(async () => {
        setIsComparisonLoading(true);
        setComparisonAnalysis('');
        try {
            const analysis = await getComparisonAnalysis(simulatedAssets, realAssets);
            setComparisonAnalysis(analysis);
        } catch (error) {
            setComparisonAnalysis("Error: No se pudo obtener el análisis comparativo de la IA.");
        } finally {
            setIsComparisonLoading(false);
        }
    }, [simulatedAssets, realAssets]);

    const handleSimulateRebalance = () => {
        alert("Simulando rebalanceo... (funcionalidad en desarrollo). Esto aplicaría los cambios sugeridos a su portafolio simulado.");
    };

    const renderAiAnalysis = (adviceText: string) => {
        return adviceText.split('\n').map((line, i) => {
            if (line.startsWith('**')) {
                const parts = line.split('**');
                return <p key={i} className="my-1.5"><strong className="text-brand-gold/90">{parts[1]}</strong>{parts[2]}</p>;
            }
            if (line.match(/^\d+\./)) {
                return <p key={i} className="my-1 pl-2">{line}</p>
            }
            return <p key={i} className="my-1">{line}</p>;
        });
    };
    
    const connections = [
        { name: 'Binance', icon: 'https://cdn.worldvectorlogo.com/logos/binance.svg' },
        { name: 'Bybit', icon: 'https://cdn.worldvectorlogo.com/logos/bybit.svg' },
        { name: 'OKX', icon: 'https://cdn.worldvectorlogo.com/logos/okx.svg' },
        { name: 'Metamask', icon: 'https://cdn.worldvectorlogo.com/logos/metamask.svg' },
    ];
    
    const PositionsTable: React.FC<{ title: string; assets: PortfolioAsset[] }> = ({ title, assets }) => (
        <Card className="bg-brand-navy border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-700/50">
                        <tr>
                            {['Activo', 'Cantidad', 'Precio Entrada', 'Precio Actual', 'Valor Total', 'P/L (%)'].map(h =>
                                <th key={h} className="py-2 px-3 font-semibold text-gray-400 uppercase text-xs">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id} className="border-b border-gray-800 last:border-b-0">
                                <td className="py-3 px-3 flex items-center gap-3 font-semibold text-white"><span className="text-xl">{asset.icon}</span>{asset.name}</td>
                                <td className="py-3 px-3 text-gray-300">{asset.amount} <span className="text-gray-500">{asset.symbol}</span></td>
                                <td className="py-3 px-3 text-gray-300 font-mono">{formatCurrency(asset.entryPrice)}</td>
                                <td className="py-3 px-3 text-gray-300 font-mono">{formatCurrency(asset.currentPrice)}</td>
                                <td className="py-3 px-3 text-white font-semibold font-mono">{formatCurrency(asset.totalValue)}</td>
                                <td className={`py-3 px-3 font-semibold font-mono ${asset.pl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                                    <div className="flex items-center gap-2 justify-end">
                                        {asset.plPercent <= -10 && <span title={settings.tooltips ? `Pérdida significativa: ${asset.plPercent.toFixed(1)}%` : undefined}><ExclamationTriangleIcon className="w-4 h-4 text-red-500" /></span>}
                                        <span>{formatCurrency(asset.pl)} <span className="text-xs">({asset.plPercent.toFixed(2)}%)</span></span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('intelligentPortfolio')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('portfolioManagement')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setMode('Simulated')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'Simulated' ? 'bg-brand-gold text-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('simulated')}</button>
                        <button onClick={() => setMode('Real')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'Real' ? 'bg-brand-gold text-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('real')}</button>
                    </div>
                     <button onClick={() => setIsComparing(!isComparing)} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${isComparing ? 'bg-brand-gold text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                        <ScaleIcon className="w-5 h-5"/>
                        {t('compare')}
                    </button>
                </div>
            </div>

            {isComparing ? (
                 <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <PositionsTable title="Portafolio Simulado" assets={simulatedAssets} />
                        <PositionsTable title="Portafolio Real" assets={realAssets} />
                    </div>
                     <Card className="bg-brand-navy border border-gray-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Análisis Comparativo IA</h3>
                            <SparklesIcon className="w-6 h-6 text-brand-gold"/>
                        </div>
                        <button onClick={handleFetchComparisonAnalysis} disabled={isComparisonLoading} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50">
                            {isComparisonLoading ? <div className="w-5 h-5 mx-auto border-2 border-t-transparent border-black rounded-full animate-spin"></div> : 'Generar Análisis Comparativo'}
                        </button>
                        {comparisonAnalysis && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm text-gray-300 prose prose-sm prose-invert max-w-none">
                                {renderAiAnalysis(comparisonAnalysis)}
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-brand-navy border border-gray-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-gray-400 uppercase text-sm font-medium">{t('totalPortfolioValue')} ({t(mode.toLowerCase() as any)})</h3>
                                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalPortfolioValue)}</p>
                                </div>
                                <WalletIcon className="w-8 h-8 text-brand-gold" />
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_PORTFOLIO_EVOLUTION} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
                                        <XAxis dataKey="time" stroke="#9a9a9a" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9a9a9a" fontSize={12} tickFormatter={(val) => `$${Number(val / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a2a45', border: '1px solid #D4AF37', borderRadius: '0.5rem' }} formatter={(value: number) => formatCurrency(value)} />
                                        <Area type="monotone" dataKey="value" stroke="#D4AF37" fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <PositionsTable title="Posiciones Actuales" assets={activeAssets} />
                    </div>
                    {/* Right Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-brand-navy border border-gray-700/50">
                            <h3 className="text-lg font-bold text-white mb-2">Distribución de Activos</h3>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={DISTRIBUTION_COLORS[entry.name as keyof typeof DISTRIBUTION_COLORS] || '#8884d8'} stroke="#1a2a45" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1a2a45', border: '1px solid #D4AF37', borderRadius: '0.5rem' }} formatter={(value: number) => formatCurrency(value)} />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card className="bg-brand-navy border border-gray-700/50">
                            <h3 className="text-lg font-bold text-white mb-4">Conectar Cuentas</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {connections.map(c => (
                                    <button key={c.name} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
                                        <img src={c.icon} alt={c.name} className="w-6 h-6" />
                                        <span className="text-sm font-semibold">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                        <Card className="bg-brand-navy border border-gray-700/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">IA Advisor</h3>
                                <SparklesIcon className="w-6 h-6 text-brand-gold" />
                            </div>
                            <button onClick={handleFetchAnalysis} disabled={isAiLoading} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50">
                                {isAiLoading ? <div className="w-5 h-5 mx-auto border-2 border-t-transparent border-black rounded-full animate-spin"></div> : 'Analizar mi Portafolio'}
                            </button>
                            {aiAnalysis && (
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="text-sm text-gray-300 prose prose-sm prose-invert max-w-none">
                                        {renderAiAnalysis(aiAnalysis)}
                                    </div>
                                    <button onClick={handleSimulateRebalance} className="mt-4 w-full bg-brand-gold/20 text-brand-gold font-bold py-2 rounded-lg hover:bg-brand-gold/30 transition-colors">
                                        Simular Rebalanceo Sugerido
                                    </button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}


            <Card className="bg-brand-navy border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4">Historial de Movimientos</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-700/50">
                            <tr>
                                {['Fecha', 'Tipo', 'Activo', 'Cantidad', 'Valor ($)', 'Estado'].map(h =>
                                    <th key={h} className="py-2 px-3 font-semibold text-gray-400 uppercase text-xs">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_PORTFOLIO_EVENTS.map(item => (
                                <tr key={item.id} className="border-b border-gray-800 last:border-b-0">
                                    <td className="py-3 px-3 text-gray-400">{formatTimestamp(item.timestamp)}</td>
                                    <td className="py-3 px-3"><span className={`font-semibold ${item.type === 'BUY' ? 'text-brand-green' : item.type === 'SELL' ? 'text-brand-red' : 'text-white'}`}>{item.type}</span></td>
                                    <td className="py-3 px-3 text-white">{item.asset}</td>
                                    <td className="py-3 px-3 text-gray-300">{item.amount.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-gray-300 font-mono">{formatCurrency(item.value)}</td>
                                    <td className="py-3 px-3"><span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">{item.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default PortfolioView;