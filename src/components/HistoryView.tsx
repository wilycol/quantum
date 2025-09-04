
import React, { useState, useMemo, useCallback } from 'react';
import Card from './ui/Card';
import { useSettings } from '../contexts/SettingsContext';
import { MOCK_MANUAL_TRADES, MOCK_AI_TRADES, MOCK_AI_INTERACTIONS } from '../constants';
import { ManualTradeHistory, AITradeHistory, AIInteractionLog } from '../../types';
import { getWeeklyAnalysis } from '../services/geminiService';

// --- ICONS ---
const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992v-4.992Z" /></svg>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);
const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>);

type ActiveTab = 'trades' | 'interactions' | 'analysis' | 'reporting';

const HistoryView: React.FC = () => {
    const { settings, t } = useSettings();
    const [activeTab, setActiveTab] = useState<ActiveTab>('trades');
    const [activeTradeTab, setActiveTradeTab] = useState<'manual' | 'ai'>('manual');
    
    // Filters
    const [assetFilter, setAssetFilter] = useState<string>('all');
    const [resultFilter, setResultFilter] = useState<'all' | 'profit' | 'loss'>('all');

    // Analysis State
    const [analysis, setAnalysis] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const handleGenerateAnalysis = useCallback(async () => {
        setIsAnalysisLoading(true);
        setAnalysis('');
        try {
            const result = await getWeeklyAnalysis(MOCK_AI_TRADES);
            setAnalysis(result);
        } catch (error) {
            setAnalysis('Error generating analysis. Please try again.');
        } finally {
            setIsAnalysisLoading(false);
        }
    }, []);
    
    const handleExport = (format: 'json' | 'csv' | 'yaml') => {
        // In a real app, this would generate and download a file.
        // Here, we just simulate the action.
        const data = {
            manualTrades: MOCK_MANUAL_TRADES,
            aiTrades: MOCK_AI_TRADES,
            aiInteractions: MOCK_AI_INTERACTIONS,
        };
        alert(`Exporting all data as ${format.toUpperCase()}...\n\n(This is a simulation. Data would be downloaded here.)\n${JSON.stringify(data, null, 2)}`);
    };

    const handleSyncGitHub = () => {
        const { token, repoUrl } = settings.githubConfig;
        if (!token || !repoUrl) {
            alert("GitHub configuration is incomplete. Please set your token and repository URL in the Settings.");
            return;
        }
        alert(`Simulating push of weekly reports to:\n${repoUrl}\n\nThis action would commit the report files to your repository for the AI to learn from.`);
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

    const renderTabs = () => (
        <div className="border-b border-gray-300 dark:border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-6">
                <button onClick={() => setActiveTab('trades')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'trades' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('tradeHistory')}</button>
                <button onClick={() => setActiveTab('interactions')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'interactions' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('aiInteractionLog')}</button>
                <button onClick={() => setActiveTab('analysis')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'analysis' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('weeklyAiAnalysis')}</button>
                <button onClick={() => setActiveTab('reporting')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'reporting' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('reportingAndSync')}</button>
            </nav>
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'trades': return <TradeHistoryTab />;
            case 'interactions': return <AIInteractionsTab />;
            case 'analysis': return <AIAnalysisTab />;
            case 'reporting': return <ReportingTab />;
            default: return null;
        }
    };

    const TradeHistoryTab = () => (
        <div>
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setActiveTradeTab('manual')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTradeTab === 'manual' ? 'bg-brand-gold text-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('manualTrades')}</button>
                    <button onClick={() => setActiveTradeTab('ai')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTradeTab === 'ai' ? 'bg-brand-gold text-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('aiTrades')}</button>
                </div>
                 {/* Filters would go here */}
            </div>
            {activeTradeTab === 'manual' ? <ManualTradesTable /> : <AITradesTable />}
        </div>
    );

    const ManualTradesTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700/50 bg-gray-800/50">
                    <tr>{['Date', 'Asset', 'Type', 'Size', 'Entry', 'Exit', 'P/L ($)'].map(h => <th key={h} className="py-2 px-3 font-semibold text-gray-400 uppercase text-xs">{h}</th>)}</tr>
                </thead>
                <tbody>
                    {MOCK_MANUAL_TRADES.map(trade => (
                        <tr key={trade.id} className="border-b border-gray-800 last:border-b-0">
                            <td className="py-3 px-3 text-gray-400">{new Date(trade.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-3 font-semibold text-white">{trade.asset}</td>
                            <td className={`py-3 px-3 font-semibold ${trade.type === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>{trade.type}</td>
                            <td className="py-3 px-3">{trade.size}</td>
                            <td className="py-3 px-3">{trade.entryPrice.toFixed(4)}</td>
                            <td className="py-3 px-3">{trade.exitPrice.toFixed(4)}</td>
                            <td className={`py-3 px-3 font-semibold ${trade.pl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>{trade.pl.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const AITradesTable = () => (
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700/50 bg-gray-800/50">
                    <tr>{['Date', 'Asset', 'Type', 'Size', 'Entry', 'Exit', 'P/L ($)', 'Confidence'].map(h => <th key={h} className="py-2 px-3 font-semibold text-gray-400 uppercase text-xs">{h}</th>)}</tr>
                </thead>
                <tbody>
                    {MOCK_AI_TRADES.map(trade => (
                        <tr key={trade.id} className="border-b border-gray-800 last:border-b-0">
                            <td className="py-3 px-3 text-gray-400">{new Date(trade.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-3 font-semibold text-white">{trade.asset}</td>
                            <td className={`py-3 px-3 font-semibold ${trade.type === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>{trade.type}</td>
                            <td className="py-3 px-3">{trade.size}</td>
                            <td className="py-3 px-3">{trade.entryPrice.toFixed(4)}</td>
                            <td className="py-3 px-3">{trade.exitPrice.toFixed(4)}</td>
                            <td className={`py-3 px-3 font-semibold ${trade.pl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>{trade.pl.toFixed(2)}</td>
                            <td className="py-3 px-3 text-brand-gold">{trade.confidence}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const AIInteractionsTab = () => (
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700/50 bg-gray-800/50">
                    <tr>{['Date', 'Type', 'Details', 'User Action', 'Response (s)'].map(h => <th key={h} className="py-2 px-3 font-semibold text-gray-400 uppercase text-xs">{h}</th>)}</tr>
                </thead>
                <tbody>
                    {MOCK_AI_INTERACTIONS.map(log => (
                        <tr key={log.id} className="border-b border-gray-800 last:border-b-0">
                            <td className="py-3 px-3 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-3 font-semibold text-white">{log.type}</td>
                            <td className="py-3 px-3">{log.details}</td>
                            <td className="py-3 px-3">{log.userAction}</td>
                            <td className="py-3 px-3">{log.responseTime || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const AIAnalysisTab = () => (
        <Card className="bg-brand-navy border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{t('weeklyAiAnalysis')}</h3>
                <SparklesIcon className="w-6 h-6 text-brand-gold"/>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                La IA analiza su propio rendimiento de la semana anterior para identificar patrones, aprender de los errores y mejorar sus estrategias futuras. Este es un componente clave de su ciclo de aprendizaje.
            </p>
            <button onClick={handleGenerateAnalysis} disabled={isAnalysisLoading} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50">
                {isAnalysisLoading ? <div className="w-5 h-5 mx-auto border-2 border-t-transparent border-black rounded-full animate-spin"></div> : t('generateAnalysis')}
            </button>
            {analysis && (
                <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm text-gray-300 prose prose-sm prose-invert max-w-none">
                    {renderAiAnalysis(analysis)}
                </div>
            )}
        </Card>
    );

    const ReportingTab = () => (
        <Card className="bg-brand-navy border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('exportData')}</h3>
                    <p className="text-sm text-gray-400 mb-4">Exporte todo el historial en varios formatos para su análisis personal o auditoría.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => handleExport('json')} className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600">Export JSON</button>
                        <button onClick={() => handleExport('csv')} className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600">Export CSV</button>
                        <button onClick={() => handleExport('yaml')} className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600">Export YAML</button>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('syncToGithub')}</h3>
                    <p className="text-sm text-gray-400 mb-4">Sincronice los reportes semanales con su repositorio de GitHub para alimentar el ciclo de aprendizaje de la IA.</p>
                    <button onClick={handleSyncGitHub} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                        <CloudArrowUpIcon className="w-5 h-5"/>
                        {t('syncToGithub')}
                    </button>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-brand-navy border border-gray-700/50">
                {renderTabs()}
                {renderContent()}
            </Card>
        </div>
    );
};

export default HistoryView;
