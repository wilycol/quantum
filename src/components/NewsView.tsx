
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Card from './ui/Card';
import MarketInsights from './MarketInsights';
import { MOCK_MARKET_PRICES, MOCK_NEWS_ARTICLES } from '../constants';
import { NewsArticle } from '../types';
import { getNewsAnalysis } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

// Icons
const ArrowTrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28L21 2.25M12 18.75h-.008v.008H12v-.008Z" /></svg>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);

type NewsCategory = 'All' | 'Crypto' | 'Stocks' | 'Forex' | 'Commodities' | 'Global';

const NewsView: React.FC = () => {
    const { dispatchNotification } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<NewsCategory>('All');
    const [analyzingArticle, setAnalyzingArticle] = useState<NewsArticle | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    
    useEffect(() => {
        const highImpactNews = MOCK_NEWS_ARTICLES.find(article => article.impact === 'High');
        if (highImpactNews) {
            dispatchNotification({
                type: 'news_high_impact',
                title: 'Noticia de Alto Impacto',
                message: highImpactNews.title,
                linkTo: 'news'
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const filteredArticles = useMemo(() => {
        return MOCK_NEWS_ARTICLES
            .filter(article => activeCategory === 'All' || article.category === activeCategory)
            .filter(article => article.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategory, searchTerm]);

    const handleAnalyze = useCallback(async (article: NewsArticle) => {
        setAnalyzingArticle(article);
        setIsAnalysisLoading(true);
        setAnalysisResult('');
        try {
            const result = await getNewsAnalysis(article.title, article.summary);
            setAnalysisResult(result);
        } catch (error) {
            setAnalysisResult("Error al obtener el análisis de la IA.");
        } finally {
            setIsAnalysisLoading(false);
        }
    }, []);

    const ImpactBadge: React.FC<{ impact: NewsArticle['impact'] }> = ({ impact }) => {
        const styles = {
            High: 'bg-red-500/20 text-red-400',
            Medium: 'bg-yellow-500/20 text-yellow-400',
            Low: 'bg-green-500/20 text-green-400',
        };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[impact]}`}>{impact}</span>;
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
            <MarketInsights />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="bg-brand-navy border border-gray-700/50">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                            <h3 className="text-xl font-bold text-white">Noticias de Mercado</h3>
                             <div className="relative flex-grow max-w-xs">
                                <input type="text" placeholder="Buscar noticias..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-800 border border-gray-700 w-full rounded-md pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                            </div>
                        </div>
                         <div className="flex items-center gap-2 mb-4 border-b border-gray-700/50 pb-4 flex-wrap">
                            {(['All', 'Global', 'Crypto', 'Stocks', 'Forex', 'Commodities'] as NewsCategory[]).map(cat => (
                               <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeCategory === cat ? 'bg-brand-gold text-black' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                                   {cat}
                               </button>
                            ))}
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                             {filteredArticles.map(article => (
                                <div key={article.id} className="bg-gray-800/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{article.title}</h4>
                                            <p className="text-sm text-gray-400">{article.summary}</p>
                                        </div>
                                        <ImpactBadge impact={article.impact}/>
                                    </div>
                                    <div className="flex justify-between items-end mt-3">
                                        <div className="text-xs text-gray-500">
                                            <span>{article.source}</span> &bull; <span>{new Date(article.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <button onClick={() => handleAnalyze(article)} className="flex items-center gap-2 text-sm text-brand-gold font-semibold hover:text-amber-400 transition-colors">
                                            <SparklesIcon className="w-4 h-4" />
                                            Analizar con IA
                                        </button>
                                    </div>
                                    {analyzingArticle?.id === article.id && (
                                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                                            {isAnalysisLoading ? (
                                                <div className="flex justify-center items-center h-16"><div className="w-6 h-6 border-2 border-t-transparent border-brand-gold rounded-full animate-spin"></div></div>
                                            ) : (
                                                <p className="text-sm text-brand-gold/80 italic">{analysisResult}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                     <Card className="bg-brand-navy border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4">Precios de Mercado</h3>
                        <div className="space-y-2">
                            {MOCK_MARKET_PRICES.map(asset => (
                                <div key={asset.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{asset.icon}</span>
                                        <div>
                                            <p className="font-semibold text-white">{asset.name}</p>
                                            <p className="text-xs text-gray-500">{asset.source}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold font-mono text-white">${asset.price.toLocaleString()}</p>
                                        <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${asset.change24h >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                                            {asset.change24h >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3"/> : <ArrowTrendingUpIcon className="w-3 h-3 transform -scale-y-100"/>}
                                            {asset.change24h.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default NewsView;