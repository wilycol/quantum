
import React, { useState, useCallback } from 'react';
import Card from './ui/Card';
import { fetchMarketInsights } from '../services/geminiService';
import { GroundingSource } from '../types';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
);


const MarketInsights: React.FC = () => {
    const [prompt, setPrompt] = useState<string>("What are the latest trends affecting the price of Gold?");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>("");
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [error, setError] = useState<string>("");

    const getInsights = useCallback(async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError("");
        setResult("");
        setSources([]);
        try {
            const response = await fetchMarketInsights(prompt);
            setResult(response.text);
            setSources(response.sources);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <Card className="bg-brand-navy border border-gray-700/50">
            <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 text-brand-gold mr-3" />
                <h3 className="text-xl font-bold text-brand-gold">AI Market Insights</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask about market news, trends, etc."
                    className="flex-grow bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    disabled={isLoading}
                />
                <button
                    onClick={getInsights}
                    disabled={isLoading || !prompt}
                    className="bg-brand-gold text-black font-bold px-5 py-2.5 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
                    ) : "Get Insights"}
                </button>
            </div>

            {error && <p className="mt-4 text-brand-red bg-red-500/10 p-3 rounded-lg">{error}</p>}
            
            {result && (
                 <div className="mt-4 space-y-4">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">{result}</div>
                    {sources.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-brand-gold/80 mb-2 flex items-center">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Sources
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                                {sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-gold/70 hover:text-brand-gold hover:underline text-sm transition-colors">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default MarketInsights;