
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle, Area, Legend, Line, ReferenceLine, ReferenceArea } from 'recharts';
import { MOCK_WALLET_DATA, MOCK_CANDLESTICK_DATA, MOCK_AI_DECISIONS } from '../constants';
import { WalletData, Candle, AIDecision, DemoTrade } from '../types';
import { getTradeAdvice } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';


// --- SVG ICONS ---
const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const StarIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={props.filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>);
const ArrowsPointingOutIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m4.5 4.5h-4.5m4.5 0v4.5m0-4.5L15 15" /></svg>);
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v6.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>);
const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6V5.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.75m0 0h1.5m-1.5 0v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25m0 0h1.5m-1.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.75m0 0h1.5m-1.5 0v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25m9 3.75h1.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 .75-.75Zm-3.75 0h1.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 .75-.75Zm-3.75 0h1.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 .75-.75Z" /></svg>);
const ArrowTrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28L21 2.25M12 18.75h-.008v.008H12v-.008Z" /></svg>);
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>);
const BeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.5 1.5l-2.5 3.5a2.25 2.25 0 0 0-.5 1.5v3.136a2.25 2.25 0 0 0 2.25 2.25h5.5a2.25 2.25 0 0 0 2.25-2.25v-3.136a2.25 2.25 0 0 0-.5-1.5l-2.5-3.5a2.25 2.25 0 0 1-.5-1.5V3.104m-4.5 0a2.25 2.25 0 1 0 4.5 0h-4.5Z" /></svg>);
const SignalIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M12 15h.008v.008H12V15Z" /></svg>);
const CurrencyDollarIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.825-1.106-2.156 0-2.981.554-.413 1.282-.657 2.003-.657s1.45.22 2.003.657c1.106.825 1.106 2.156 0 2.981l-.879.659m-5.179 4.318-1.581.444A18.75 18.75 0 0 1 2.25 12c0-4.042 1.635-7.688 4.318-10.444l1.581.444m11.362 10 1.581-.444A18.75 18.75 0 0 0 21.75 12c0-4.042-1.635-7.688-4.318-10.444l-1.581.444" /></svg>);
const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>);
const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25-2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>);
const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-1.125 6.01 6.01 0 0 0-1.5-1.125m0 0S9.75 9.75 9 10.5m3-2.25S14.25 9.75 15 10.5M9 18a9 9 0 1 1 18 0a9 9 0 0 1-18 0Zm0-3.75a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" /></svg>);
const RobotIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655a2.25 2.25 0 0 1-2.824 0M4.5 19.5a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25M5.25 10.5c0-1.518 1.232-2.75 2.75-2.75s2.75 1.232 2.75 2.75S9.518 13.25 8 13.25s-2.75-1.232-2.75-2.75Zm10.5 0c0-1.518 1.232-2.75 2.75-2.75s2.75 1.232 2.75 2.75-1.232 2.75-2.75 2.75-2.75-1.232-2.75-2.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5v.75A2.25 2.25 0 0 0 6.75 7.5h10.5a2.25 2.25 0 0 0 2.25-2.25V4.5m-13.5 0a2.25 2.25 0 0 1 2.25-2.25h8.25a2.25 2.25 0 0 1 2.25 2.25" /></svg>);
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);


// --- MOCK DATA & TYPES ---
type AssetCategory = 'All' | 'Forex' | 'Stocks' | 'Crypto';
interface Asset {
  name: string;
  flag: string;
  category: AssetCategory;
  sell: number;
  buy: number;
}
type OperatingMode = 'demo_sim_total' | 'demo_real_signals' | 'modo_real';
type AIIntensity = 'Apagada' | 'Mínima' | 'Media' | 'Alta';
type TrainingDifficulty = 'Básico' | 'Intermedio' | 'Avanzado';

interface DemoResults {
    totalPL: number;
    trades: number;
    winRate: number;
    avgReactionTime: number;
}
interface AiSuggestion {
    message: string;
    action?: 'BUY' | 'SELL';
    expiresIn?: number;
}

const initialMockAssets: Asset[] = [
  { name: 'EUR/USD', flag: '🇪🇺/🇺🇸', category: 'Forex', sell: 1.0854, buy: 1.0855 },
  { name: 'USD/JPY', flag: '🇺🇸/🇯🇵', category: 'Forex', sell: 157.10, buy: 157.12 },
  { name: 'TSLA', flag: '🇺🇸', category: 'Stocks', sell: 180.50, buy: 180.60 },
  { name: 'ACCIONA', flag: '🇪🇸', category: 'Stocks', sell: 164.76, buy: 165.74 },
  { name: 'ACS', flag: '🇪🇸', category: 'Stocks', sell: 59.11, buy: 59.54 },
  { name: 'BTC/USD', flag: '₿', category: 'Crypto', sell: 67500, buy: 67525 },
  { name: 'ETH/USD', flag: 'Ξ', category: 'Crypto', sell: 3500, buy: 3501.5 },
  { name: 'ADA/USD', flag: '₳', category: 'Crypto', sell: 0.73312, buy: 0.73912 },
];

const CandlestickShape = (props: any) => {
    // The payload contains the original data object for the bar
    const { x, y, width, height, payload } = props;
    const { open, close, low, high, aiSignal } = payload;
    
    const isRising = close >= open;
    let color = isRising ? '#34c759' : '#ff3b30';
    if(aiSignal === 'BULLISH_CANDLE') color = '#facc15';

    const ratio = height > 0 && high - low !== 0 ? height / (high - low) : 0;
    const bodyHeight = Math.max(1, Math.abs(open - close) * ratio);
    const bodyY = isRising ? y + (high - close) * ratio : y + (high - open) * ratio;

    return (
        <g>
            <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1.5} />
            <rect x={x} y={bodyY} width={width} height={bodyHeight} fill={color} />
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as Candle;
      return (
        <div className="bg-[#0D1117] p-2 rounded-md border border-gray-700 text-xs text-gray-300 shadow-lg">
            <p className="font-bold text-gray-400 mb-1">{label || data.time}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <span className="text-gray-500">O:</span> <span className="text-right">{(data.open || 0).toFixed(4)}</span>
                <span className="text-gray-500">H:</span> <span className="text-right">{(data.high || 0).toFixed(4)}</span>
                <span className="text-gray-500">L:</span> <span className="text-right">{(data.low || 0).toFixed(4)}</span>
                <span className="text-gray-500">C:</span> <span className="text-right">{(data.close || 0).toFixed(4)}</span>
            </div>
        </div>
      );
    }
    return null;
};

const QuantumDeskView: React.FC = () => {
    // --- CONTEXT ---
    const { settings, t, dispatchNotification } = useSettings();

    // --- STATE MANAGEMENT ---
    const [operatingMode, setOperatingMode] = useState<OperatingMode>('demo_sim_total');
    const [showModeSelector, setShowModeSelector] = useState(false);
    const modeSelectorRef = useRef<HTMLDivElement>(null);
    
    // Data State
    const [assets, setAssets] = useState<Asset[]>(initialMockAssets);
    const [walletData, setWalletData] = useState<WalletData>(MOCK_WALLET_DATA);
    
    const [activeAsset, setActiveAsset] = useState<Asset>(assets[0]);
    const [activeCategory, setActiveCategory] = useState<AssetCategory>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState<string[]>(['EUR/USD', 'BTC/USD']);
    
    // Trade Execution State
    const [isOneClick, setIsOneClick] = useState(false);
    const [tradeSize, setTradeSize] = useState(1.0);
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    
    // IA Coach State
    const [isAssistantPanelOpen, setIsAssistantPanelOpen] = useState(false);
    const [isAssistantClosing, setIsAssistantClosing] = useState(false);
    const [assistantTab, setAssistantTab] = useState<'advice' | 'config' | 'log'>('advice');
    const [aiIntensity, setAiIntensity] = useState<AIIntensity>('Media');
    const [aiAdvice, setAiAdvice] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [tradeTypeForAdvice, setTradeTypeForAdvice] = useState<'BUY' | 'SELL' | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
    const [adviceCountdown, setAdviceCountdown] = useState(0);

    // Chart State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [crosshairData, setCrosshairData] = useState<{time: string, price: number} | null>(null);
    const [isTradeFromChartArmed, setIsTradeFromChartArmed] = useState(false);
    const [proactiveAiAlertArea, setProactiveAiAlertArea] = useState<{ y1: any, y2: any } | null>(null);

    // --- DEMO SESSION STATE ---
    const [isDemoSessionActive, setIsDemoSessionActive] = useState(false);
    const [trainingDifficulty, setTrainingDifficulty] = useState<TrainingDifficulty>('Intermedio');
    const [demoChartData, setDemoChartData] = useState<Candle[]>(MOCK_CANDLESTICK_DATA);
    const [demoTrades, setDemoTrades] = useState<DemoTrade[]>([]);
    const [practiceTrades, setPracticeTrades] = useState<any[]>([]);
    const [demoResults, setDemoResults] = useState<DemoResults | null>(null);
    const [aiTrainingMarker, setAiTrainingMarker] = useState<{ time: string } | null>(null);
    const simulationIntervalRef = useRef<number | null>(null);
    const proactiveAiIntervalRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const aiSuggestionRef = useRef<AiSuggestion | null>(null);
    
    useEffect(() => {
        aiSuggestionRef.current = aiSuggestion;
    }, [aiSuggestion]);

    // --- MODE CONFIGURATION ---
    const modeConfig = {
        demo_sim_total: { 
            bannerText: 'MODO SIMULACIÓN TOTAL: Operando con datos y balance simulados.', 
            bannerClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
            icon: BeakerIcon,
            tooltip: 'Entrenamiento inicial sin riesgo. Todos los datos son generados artificialmente.'
        },
        demo_real_signals: { 
            bannerText: 'MODO ENTRENAMIENTO: Operando con señales reales y balance simulado.', 
            bannerClass: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
            icon: SignalIcon,
            tooltip: 'Práctica con precios de mercado en tiempo real, pero sin arriesgar fondos.'
        },
        modo_real: { 
            bannerText: '¡MODO REAL! Operando con fondos y datos en vivo!', 
            bannerClass: 'bg-green-500/20 text-green-300 border-green-400/30',
            icon: CurrencyDollarIcon,
            tooltip: 'Operaciones reales con su capital. ¡Proceda con precaución!'
        },
    };
    
    const calculateSpread = (asset: Asset) => {
        const spread = asset.buy - asset.sell;
        const multiplier = asset.name.includes('JPY') ? 100 : 10000;
        return (spread * multiplier).toFixed(1);
    };
    
    const handleCloseCoachPanel = useCallback(() => {
        setIsAssistantClosing(true);
        setTimeout(() => {
            setIsAssistantPanelOpen(false);
            setIsAssistantClosing(false);
        }, 300); // Match animation duration
    }, []);


    // --- EFFECTS ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) setShowModeSelector(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
                setIsFullScreen(false);
                setDemoResults(null);
                if (isAssistantPanelOpen) handleCloseCoachPanel();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener('keydown', handleEsc);
            if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            if(proactiveAiIntervalRef.current) clearInterval(proactiveAiIntervalRef.current);
            if(countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
        }
    }, [isAssistantPanelOpen, handleCloseCoachPanel]);

    const handleEndDemoSession = useCallback(() => {
        setIsDemoSessionActive(false);
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setAiSuggestion(null);
        setAiTrainingMarker(null);
        
        if (demoTrades.length > 0) {
            const totalPL = demoTrades.reduce((acc, trade) => acc + (trade.pl || 0), 0);
            const successfulTrades = demoTrades.filter(t => t.wasCorrectAction).length;
            const reactionTrades = demoTrades.filter(t => t.reactionTime);
            const avgReactionTime = reactionTrades.length > 0 ? reactionTrades.reduce((acc, t) => acc + t.reactionTime!, 0) / reactionTrades.length : 0;
            setDemoResults({
                totalPL,
                trades: demoTrades.length,
                winRate: (successfulTrades / demoTrades.length) * 100,
                avgReactionTime,
            });
        }
    }, [demoTrades]);
    
    useEffect(() => {
        if (isDemoSessionActive) handleEndDemoSession();

        if (operatingMode === 'demo_sim_total') {
            setAssets(initialMockAssets);
            setWalletData(MOCK_WALLET_DATA);
        } else if (operatingMode === 'demo_real_signals') {
            const liveMockAssets = initialMockAssets.map(a => ({...a, sell: a.sell * 1.001, buy: a.buy * 1.001}));
            setAssets(liveMockAssets);
            setWalletData(MOCK_WALLET_DATA);
            setActiveAsset(liveMockAssets[0]);
        } else if (operatingMode === 'modo_real') {
            const liveMockAssets = initialMockAssets.map(a => ({...a, sell: a.sell * 1.002, buy: a.buy * 1.002}));
            const liveWalletData = {...MOCK_WALLET_DATA, balance: 50000, equity: 51234, credit: 0};
            setAssets(liveMockAssets);
            setWalletData(liveWalletData);
            setActiveAsset(liveMockAssets[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [operatingMode]);


    const toggleFavorite = (assetName: string) => {
        setFavorites(prev => prev.includes(assetName) ? prev.filter(name => name !== assetName) : [...prev, assetName]);
    };
    
    const filteredAssets = useMemo(() => {
        return assets
            .filter(asset => activeCategory === 'All' || asset.category === activeCategory)
            .filter(asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategory, searchTerm, assets]);

    const chartData = useMemo(() => {
        let sourceData: Candle[];

        if (operatingMode === 'demo_sim_total' && isDemoSessionActive) {
            sourceData = demoChartData;
        } else {
            const basePrice = activeAsset.buy;
            const volatility = activeAsset.category === 'Crypto' ? 0.05 : (activeAsset.category === 'Stocks' ? 0.02 : 0.005);

            sourceData = MOCK_CANDLESTICK_DATA.map((d, i) => {
                const seed = (activeAsset.name.charCodeAt(0) + i) / 100;
                const multiplier = 1 + Math.sin(seed) * volatility;
                const open = basePrice * (multiplier + (Math.random() - 0.5) * volatility * 0.1);
                const close = open + (Math.random() - 0.5) * basePrice * volatility * 0.2;
                const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.05);
                const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.05);
                
                return { ...d, open, high, low, close };
            });
        }
        
        return sourceData.map(d => ({ ...d, wick: [d.low, d.high] }));

    }, [activeAsset, operatingMode, isDemoSessionActive, demoChartData]);

    const yDomain = chartData.length > 0 ? [Math.min(...chartData.map(d => d.low)), Math.max(...chartData.map(d => d.high))] : [0, 1];
    const yBuffer = (yDomain[1] - yDomain[0]) * 0.1;
    
    const handleDemoTrade = (action: 'BUY' | 'SELL', price?: number) => {
        if (!isDemoSessionActive) return;
        const entryPrice = price || demoChartData[demoChartData.length - 1].close;
        const newTrade: DemoTrade = { 
            id: Date.now().toString(), 
            timestamp: Date.now(),
            instrument: activeAsset.symbol,
            type: action,
            size: tradeSize,
            price: entryPrice, 
            time: Date.now(), 
            action,
            pl: 0,
            reasoning: 'Manual trade'
        };
        let feedback = 'Operación manual registrada.';

        if (aiSuggestionRef.current && aiSuggestionRef.current.action) {
            const expectedAction = aiSuggestionRef.current.action;
            const remainingTime = adviceCountdown;
            
            newTrade.reactionTime = (aiSuggestionRef.current.expiresIn || 0) - remainingTime;
            newTrade.wasCorrectAction = action === expectedAction;
            
            if(newTrade.wasCorrectAction) {
                if (remainingTime <= 1) {
                    feedback = `¡Excelente! Ejecución perfecta.`;
                    newTrade.pl = 100 * Math.random();
                } else if (remainingTime < 4) {
                    feedback = `¡Buen trabajo! Un poco rápido, pero en el momento correcto.`;
                    newTrade.pl = 70 * Math.random();
                } else {
                    feedback = `Te adelantaste. Intenta esperar la señal completa.`;
                    newTrade.pl = 20 * Math.random();
                }
            } else {
                feedback = `Acción incorrecta. La IA sugirió ${expectedAction}.`;
                newTrade.pl = -50 * Math.random();
            }

            setAiSuggestion(null);
            setAiTrainingMarker(null);
            if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
            setAdviceCountdown(0);
        } else {
            newTrade.pl = (Math.random() - 0.5) * 40;
            newTrade.wasCorrectAction = false;
        }
        
        newTrade.feedback = feedback;
        dispatchNotification({type: 'info', title: 'Entrenamiento', message: feedback, linkTo: 'desk'});
        setDemoTrades(prev => [...prev, newTrade]);
    };

    const handleRequestAdvice = async (tradeType?: 'BUY' | 'SELL') => {
        setIsAssistantPanelOpen(true);
        setAssistantTab('advice');
        setTradeTypeForAdvice(tradeType || null);
        setIsAiLoading(true);
        setAiAdvice('');
        try {
            const advice = await getTradeAdvice(activeAsset.name, tradeType);
            setAiAdvice(advice);
        } catch (error) {
            setAiAdvice("No se pudo obtener el consejo de la IA.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleTradeAction = async (tradeType: 'BUY' | 'SELL') => {
        if (operatingMode === 'demo_sim_total') {
            if (!isDemoSessionActive) dispatchNotification({type: 'info', title: 'Info', message: "Inicia una sesión de entrenamiento para operar."});
            else handleDemoTrade(tradeType);
            return;
        }

        const tradeTypeText = tradeType === 'BUY' ? 'compra' : 'venta';
        if (operatingMode === 'demo_real_signals') {
             setPracticeTrades(prev => [...prev, { id: Date.now(), asset: activeAsset.name, type: tradeType, price: tradeType === 'BUY' ? activeAsset.buy : activeAsset.sell }]);
             dispatchNotification({type: 'info', title: 'Práctica', message: `Operación de práctica (${tradeTypeText}) para ${activeAsset.name} registrada.`});
             return;
        }
        
        if (isOneClick || aiIntensity === 'Apagada') {
            if (operatingMode === 'modo_real') {
                if (!confirm(`ADVERTENCIA: Está a punto de ejecutar una operación REAL de ${tradeTypeText} para ${tradeSize} lotes de ${activeAsset.name}.\n\n¿Desea proceder?`)) return;
            }
            dispatchNotification({type: 'trade_executed', title: 'Orden Ejecutada', message: `Orden de ${tradeTypeText} para ${tradeSize} lotes de ${activeAsset.name} ejecutada con éxito.`});
        } else {
            handleRequestAdvice(tradeType);
        }
    };
    
    const proceedWithTradeFromPanel = () => {
        const tradeTypeText = tradeTypeForAdvice === 'BUY' ? 'compra' : 'venta';
        if (operatingMode === 'modo_real') {
            if (!confirm(`CONFIRMACIÓN FINAL: Ejecutar operación REAL de ${tradeTypeText} para ${tradeSize} lotes de ${activeAsset.name}.`)) return;
        }
        dispatchNotification({type: 'trade_executed', title: 'Orden Ejecutada', message: `Orden de ${tradeTypeText} para ${tradeSize} lotes de ${activeAsset.name} ejecutada con éxito.`});
        handleCloseCoachPanel();
        setAiAdvice('');
        setTradeTypeForAdvice(null);
    };

    const DecisionStatusIcon = ({ decision }: { decision: AIDecision['decision'] }) => {
        switch (decision) {
            case 'EXECUTE_BUY': return <ArrowTrendingUpIcon className="w-5 h-5 text-brand-green" />;
            case 'EXECUTE_SELL': return <ArrowTrendingUpIcon className="w-5 h-5 text-brand-red transform -scale-y-100" />;
            case 'HOLD': return <ClockIcon className="w-5 h-5 text-yellow-400" />;
            default: return null;
        }
    };

    const handleChartMouseMove = (e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0) {
            const payload = e.activePayload[0].payload;
            if (payload && payload.time && payload.close) setCrosshairData({ time: payload.time, price: payload.close });
        }
    };

    const handleChartMouseLeave = () => setCrosshairData(null);
    
    const handleChartClick = (e: any) => {
        if (!e || !e.activePayload || e.activePayload.length === 0) return;
        const price = e.activePayload[0].payload.close;
        const tradeType = price > activeAsset.buy ? 'BUY' : 'SELL';

        if (operatingMode === 'demo_sim_total') {
            if (isDemoSessionActive) handleDemoTrade(tradeType, price);
            else dispatchNotification({type: 'info', title: 'Info', message: 'Inicia una sesión de entrenamiento para operar desde el gráfico.'});
            return;
        }
        if (!isTradeFromChartArmed) return;

        if (operatingMode === 'demo_real_signals') {
            setPracticeTrades(prev => [...prev, { id: Date.now(), asset: activeAsset.name, type: tradeType, price }]);
            dispatchNotification({type: 'info', title: 'Práctica', message: `Operación de práctica (${tradeType}) ejecutada para ${activeAsset.name}.`});
        } else if (operatingMode === 'modo_real') {
            if (confirm(`ADVERTENCIA: Orden Rápida desde Gráfico\n\n¿Ejecutar ${tradeType} de ${tradeSize} lotes para ${activeAsset.name} a ~${price.toFixed(4)}?`)) {
                dispatchNotification({type: 'trade_executed', title: 'Orden Rápida', message: `Orden rápida (${tradeType}) ejecutada para ${activeAsset.name}.`});
            }
        }
        setIsTradeFromChartArmed(false);
    };

    const runDemoTick = useCallback(() => {
        setDemoChartData(prevData => {
            const lastCandle = prevData[prevData.length - 1];
            const change = (Math.random() - 0.495) * (lastCandle.close * 0.005);
            const newClose = lastCandle.close + change;
            const newCandle: Candle = {
                time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                open: lastCandle.close,
                high: Math.max(lastCandle.close, newClose) + Math.random() * (lastCandle.close * 0.001),
                low: Math.min(lastCandle.close, newClose) - Math.random() * (lastCandle.close * 0.001),
                close: newClose,
            };
            return [...prevData.slice(1), newCandle];
        });
    
        const difficultySettings = {
            'Básico': { chance: 0.1, expiresIn: 15 },
            'Intermedio': { chance: 0.15, expiresIn: 10 },
            'Avanzado': { chance: 0.2, expiresIn: 5 },
        };

        const settingsForDifficulty = difficultySettings[trainingDifficulty];
        
        setAiSuggestion(currentSuggestion => {
            if (currentSuggestion) return currentSuggestion;
            
            if (Math.random() < settingsForDifficulty.chance) {
                const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
                const message = t(action === 'BUY' ? 'prepareToBuy' : 'prepareToSell');
                const markerTime = new Date(Date.now() + (settingsForDifficulty.expiresIn - 2) * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
                
                setAdviceCountdown(settingsForDifficulty.expiresIn);
                
                if (settings.notificationConfig.triggers.highConfidenceAI) {
                     dispatchNotification({
                        type: 'ai_alert',
                        title: `Alerta de Entrenamiento (${trainingDifficulty})`,
                        message: `¡Señal de ${action} para ${activeAsset.name} en ${settingsForDifficulty.expiresIn}s!`,
                        linkTo: 'desk'
                    });
                }

                setIsAssistantPanelOpen(true);
                setAssistantTab('advice');
                setAiTrainingMarker({ time: markerTime });

                return { message, action, expiresIn: settingsForDifficulty.expiresIn };
            }
            return null;
        });
    }, [trainingDifficulty, t, settings.notificationConfig.triggers.highConfidenceAI, dispatchNotification, activeAsset.name]);
    
    useEffect(() => {
        if(adviceCountdown > 0) {
            countdownIntervalRef.current = window.setTimeout(() => setAdviceCountdown(c => c - 1), 1000);
        } else if(aiSuggestion && aiSuggestion.expiresIn) {
             setAiSuggestion(s => s ? {...s, message: "¡Tiempo Expirado!"} : null);
             if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
        }
        return () => { if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current); }
    }, [adviceCountdown, aiSuggestion]);


    useEffect(() => {
        if (proactiveAiIntervalRef.current) clearInterval(proactiveAiIntervalRef.current);
    
        if (aiIntensity !== 'Apagada' && operatingMode !== 'demo_sim_total') {
            const intensityMap = { 'Mínima': 30000, 'Media': 15000, 'Alta': 8000 };
            const intervalTime = intensityMap[aiIntensity];
    
            proactiveAiIntervalRef.current = window.setInterval(() => {
                if (Math.random() < 0.35) { // Chance to fire
                    const suggestionType = Math.random() > 0.5 ? 'COMPRA' : 'VENTA';
                    const message = `Sugerencia IA: Posible oportunidad de ${suggestionType} para ${activeAsset.name} detectada.`;
                    
                    setAiSuggestion({ message });
                    setIsAssistantPanelOpen(true);
                    setAssistantTab('advice');
                    
                    const lastPrice = chartData[chartData.length - 1].close;
                    const areaCenter = lastPrice * (suggestionType === 'COMPRA' ? 0.998 : 1.002);
                    const areaSize = lastPrice * 0.003;
                    setProactiveAiAlertArea({ y1: areaCenter - areaSize, y2: areaCenter + areaSize });
                    
                    setTimeout(() => {
                        setProactiveAiAlertArea(null);
                        setAiSuggestion(null);
                    }, 8000);
                }
            }, intervalTime);
        }
    
        return () => { if (proactiveAiIntervalRef.current) clearInterval(proactiveAiIntervalRef.current); };
    }, [aiIntensity, operatingMode, activeAsset, chartData]);

    const handleStartDemoSession = () => {
        setIsDemoSessionActive(true);
        setDemoTrades([]);
        setDemoResults(null);
        setDemoChartData(MOCK_CANDLESTICK_DATA);
        simulationIntervalRef.current = window.setInterval(runDemoTick, 2000);
    };

    const ModeIcon = modeConfig[operatingMode].icon;
    const isTradingDisabled = operatingMode === 'demo_sim_total' && !isDemoSessionActive;
    
    const renderAiAdvice = (adviceText: string) => {
        return adviceText.split('\n').map((line, i) => {
            if (line.startsWith('**')) {
                const parts = line.split('**');
                return <p key={i} className="my-1"><strong className="text-brand-gold/90">{parts[1]}</strong>{parts[2]}</p>;
            }
            return <p key={i} className="my-1">{line}</p>;
        });
    };
    
    const renderIaCoachPanel = () => {
        if (!isAssistantPanelOpen) return null;
    
        return (
            <div className="fixed inset-0 bg-black/60 z-50" onClick={handleCloseCoachPanel}>
                <div
                    className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#161B22] border-l-2 border-brand-gold/30 shadow-2xl flex flex-col
                        ${isAssistantClosing ? 'animate-fade-out-right' : 'animate-fade-in-right'}`}
                    onClick={e => e.stopPropagation()}
                >
                     <div className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <RobotIcon className="w-8 h-8 text-brand-gold"/>
                            <h3 className="text-xl font-bold text-white">IA Coach</h3>
                        </div>
                        <button onClick={handleCloseCoachPanel} className="p-1 rounded-full hover:bg-gray-700"><XMarkIcon className="w-6 h-6 text-gray-400"/></button>
                    </div>
                    
                    <div className="flex border-b border-gray-700/50 flex-shrink-0">
                         {([['advice', 'Consejo'], ['config', 'Configuración'], ['log', 'Bitácora']] as const).map(([tabId, tabName]) => (
                            <button key={tabId} onClick={() => setAssistantTab(tabId)} className={`flex-1 py-2 text-sm font-semibold transition-colors ${assistantTab === tabId ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                                {tabName}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        {assistantTab === 'advice' && (
                            <div className="space-y-4">
                                {isAiLoading && <div className="flex justify-center items-center h-24"><div className="w-8 h-8 border-4 border-t-transparent border-brand-gold rounded-full animate-spin"></div></div>}
                                
                                {aiSuggestion && (
                                    <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-lg text-center">
                                        <p className="font-bold text-lg text-brand-gold">{aiSuggestion.message}</p>
                                        {aiSuggestion.expiresIn && <p className="text-4xl font-mono mt-2">{adviceCountdown}</p>}
                                    </div>
                                )}
                                
                                {!isAiLoading && aiAdvice && (
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-gray-900/50 p-4 rounded-md whitespace-pre-wrap">{renderAiAdvice(aiAdvice)}</div>
                                )}

                                {!isAiLoading && !aiSuggestion && !aiAdvice && <p className="text-center text-gray-500 py-8">Solicite un consejo o espere una alerta proactiva de la IA.</p>}
                                
                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={handleCloseCoachPanel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cerrar</button>
                                    {tradeTypeForAdvice && <button onClick={proceedWithTradeFromPanel} disabled={isAiLoading} className="px-4 py-2 rounded-md bg-brand-gold hover:bg-amber-400 text-black font-bold transition-colors disabled:opacity-50">Proceder con Operación</button>}
                                </div>
                            </div>
                        )}

                        {assistantTab === 'config' && (
                            <div className="space-y-4">
                                <h4 className="font-bold text-white">Intensidad de Asistencia</h4>
                                <p className="text-xs text-gray-400">Determina con qué frecuencia la IA proporcionará alertas y sugerencias proactivas.</p>
                                <div className="flex flex-col gap-2">
                                    {(['Alta', 'Media', 'Mínima', 'Apagada'] as AIIntensity[]).map(level => (
                                        <button key={level} onClick={() => setAiIntensity(level)} className={`w-full text-left p-3 rounded-md border-2 transition-all ${level === aiIntensity ? 'bg-brand-gold/20 border-brand-gold' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                                             <span className={`${level === aiIntensity ? 'text-white font-bold' : 'text-gray-300'}`}>{level}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {assistantTab === 'log' && (
                            <div className="space-y-2 pr-2">
                                {MOCK_AI_DECISIONS.map(decision => (
                                    <div key={decision.id} className="flex items-center gap-3 p-1.5 bg-gray-900/30 rounded-md text-xs">
                                        <DecisionStatusIcon decision={decision.decision} />
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-white">{decision.asset} - <span className={`font-semibold ${decision.decision === 'EXECUTE_BUY' ? 'text-brand-green' : decision.decision === 'EXECUTE_SELL' ? 'text-brand-red' : 'text-yellow-400'}`}>{decision.decision.replace('EXECUTE_', '')}</span></span>
                                                <span className="text-gray-500">{new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-gray-400 truncate">{decision.reason}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-brand-gold">{decision.confidence}%</div>
                                            <div className="text-gray-500 text-[10px]">Conf.</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="flex flex-col h-full bg-[#0D1117] text-gray-300 font-sans">
            {demoResults && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setDemoResults(null)}>
                    <div className="bg-brand-navy p-6 rounded-xl border-2 border-brand-gold/50 shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-brand-gold text-center mb-4">Resultados de la Sesión de Entrenamiento</h3>
                        <div className="space-y-3 text-lg">
                            <div className="flex justify-between p-3 bg-gray-900/50 rounded-md"><span>P/L Simulado:</span> <span className={`font-bold ${demoResults.totalPL >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>${demoResults.totalPL.toFixed(2)}</span></div>
                            <div className="flex justify-between p-3 bg-gray-800/50 rounded-md"><span>Operaciones Totales:</span> <span className="font-bold text-white">{demoResults.trades}</span></div>
                            <div className="flex justify-between p-3 bg-gray-900/50 rounded-md"><span>Tasa de Acierto (vs IA):</span> <span className="font-bold text-brand-gold">{demoResults.winRate.toFixed(1)}%</span></div>
                            <div className="flex justify-between p-3 bg-gray-800/50 rounded-md"><span>Reacción Promedio (a IA):</span> <span className="font-bold text-white">{demoResults.avgReactionTime.toFixed(2)}s</span></div>
                        </div>
                        <div className="mt-4 border-t border-gray-700/50 pt-4 max-h-48 overflow-y-auto">
                            <h4 className="text-lg font-bold text-white mb-2">Resumen de Operaciones</h4>
                            <div className="space-y-2 text-xs">
                                {demoTrades.map(trade => (
                                    <div key={trade.id} className="bg-gray-800 p-2 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <p className={`font-semibold ${trade.wasCorrectAction ? 'text-brand-green' : 'text-brand-red'}`}>
                                            {trade.action} @ {trade.price.toFixed(4)}
                                        </p>
                                        <span className={`font-bold ${trade.pl && trade.pl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>P/L: ${trade.pl?.toFixed(2)}</span>
                                     </div>
                                    <p className="text-gray-400 italic">"{trade.feedback}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setDemoResults(null)} className="mt-6 w-full px-4 py-2 rounded-md bg-brand-gold hover:bg-amber-400 text-black font-bold transition-colors">Cerrar</button>
                    </div>
                </div>
            )}
            
            {renderIaCoachPanel()}
            
            <button
                onClick={() => setIsAssistantPanelOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 animate-pulse-gold"
                title={settings.tooltips ? "Asistencia IA" : undefined}
            >
                <RobotIcon className="w-9 h-9 text-black" />
            </button>
            
            <div className={`p-2 text-center text-sm font-semibold border-b ${modeConfig[operatingMode].bannerClass}`}>
                <ModeIcon className="w-5 h-5 inline-block mr-2" />
                {modeConfig[operatingMode].bannerText}
            </div>

            <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                {/* Left Panel: Market Watch */}
                <div className="w-full lg:w-[350px] bg-[#161B22] flex flex-col border-r-0 lg:border-r border-b lg:border-b-0 border-gray-700/50">
                    <div className="p-2 border-b border-gray-700/50 flex flex-col gap-2">
                        <div className="relative flex-grow">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                            <input type="text" placeholder={t('searchAssets')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#0D1117] border border-gray-600 w-full rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>
                        <div className="flex items-center gap-1">
                            {(['All', 'Forex', 'Stocks', 'Crypto'] as AssetCategory[]).map(cat => (
                               <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-xs font-semibold rounded-md flex-1 transition-colors ${activeCategory === cat ? 'bg-brand-gold text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                   {cat}
                               </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                           <thead className="sticky top-0 bg-[#161B22]">
                                <tr>
                                    <th className="p-2 text-left font-semibold text-gray-500 uppercase">Market</th>
                                    <th className="p-1 text-center font-semibold text-gray-500 uppercase">Sell</th>
                                    <th className="p-2 text-center font-semibold text-gray-500 uppercase">Spread</th>
                                    <th className="p-1 text-center font-semibold text-gray-500 uppercase">Buy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map(asset => (
                                    <tr key={asset.name} onClick={() => setActiveAsset(asset)} className={`cursor-pointer hover:bg-gray-700/50 ${activeAsset.name === asset.name ? 'bg-brand-navy' : ''}`}>
                                        <td className="p-2 flex items-center gap-2 font-semibold">
                                            <StarIcon onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.name); }} className={`w-4 h-4 cursor-pointer flex-shrink-0 ${favorites.includes(asset.name) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} filled={favorites.includes(asset.name)} />
                                            <span className="text-base flex-shrink-0">{asset.flag}</span>
                                            <span className="truncate">{asset.name}</span>
                                        </td>
                                        <td className="p-1">
                                            <button disabled={isTradingDisabled} onClick={(e) => { e.stopPropagation(); handleTradeAction('SELL')}} className="w-full bg-brand-red/20 hover:bg-brand-red/40 text-white font-mono p-1 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{asset.sell.toFixed(asset.category === 'Forex' ? 4 : 2)}</button>
                                        </td>
                                        <td className="p-2 text-center text-gray-500 font-mono">{calculateSpread(asset)}</td>
                                        <td className="p-1">
                                             <button disabled={isTradingDisabled} onClick={(e) => { e.stopPropagation(); handleTradeAction('BUY')}} className="w-full bg-brand-green/20 hover:bg-brand-green/40 text-white font-mono p-1 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{asset.buy.toFixed(asset.category === 'Forex' ? 4 : 2)}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Center Panel: Chart & Log */}
                <div className="flex-1 flex flex-col bg-[#0D1117] overflow-y-auto">
                    <div className={`transition-all duration-300 relative ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0D1117] p-4 flex flex-col' : 'flex flex-col'}`}>
                        <div className="p-2 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
                             <div className="flex items-center gap-2">
                                 <h3 className="text-lg font-bold">{activeAsset.name}</h3>
                                 <p className="text-sm text-gray-400">{activeAsset.category}</p>
                             </div>
                             {operatingMode === 'demo_sim_total' && (
                                <div className="flex items-center gap-2">
                                     <select value={trainingDifficulty} onChange={(e) => setTrainingDifficulty(e.target.value as TrainingDifficulty)} className="bg-[#161B22] border border-gray-700/80 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" disabled={isDemoSessionActive}>
                                        <option>Básico</option>
                                        <option>Intermedio</option>
                                        <option>Avanzado</option>
                                    </select>
                                    {!isDemoSessionActive ? (
                                        <button onClick={() => handleStartDemoSession()} className="flex items-center gap-2 px-3 py-1.5 bg-brand-gold text-black font-bold rounded-md hover:bg-amber-400 transition-colors">
                                            <PlayIcon className="w-5 h-5" /> {t('startTraining')}
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEndDemoSession()} className="flex items-center gap-2 px-3 py-1.5 bg-brand-red text-white font-bold rounded-md hover:bg-red-500 transition-colors">
                                            <StopIcon className="w-5 h-5" /> {t('endSession')}
                                        </button>
                                    )}
                                </div>
                             )}
                            <div className="flex items-center gap-1 bg-[#161B22] p-1 rounded-md border border-gray-700/80">
                                <div className="relative" ref={modeSelectorRef}>
                                    <button onClick={() => setShowModeSelector(s => !s)} className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-brand-gold bg-brand-gold/10 rounded-sm hover:bg-brand-gold/20">
                                        {ModeIcon && <ModeIcon className="w-4 h-4"/>}
                                        <span>{operatingMode.split('_')[0].toUpperCase()}</span>
                                        <ChevronDownIcon className="w-4 h-4"/>
                                    </button>
                                    {showModeSelector && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-[#161B22] border border-gray-600 rounded-md shadow-lg z-20">
                                            {(['demo_sim_total', 'demo_real_signals', 'modo_real'] as OperatingMode[]).map(mode => {
                                                const Cfg = modeConfig[mode];
                                                return (
                                                    <button key={mode} onClick={() => { setOperatingMode(mode); setShowModeSelector(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-700" title={settings.tooltips ? Cfg.tooltip : undefined}>
                                                        {Cfg.icon && <Cfg.icon className={`w-5 h-5 flex-shrink-0 ${mode === operatingMode ? 'text-brand-gold' : 'text-gray-400'}`}/>}
                                                        <span className={`${mode === operatingMode ? 'text-white font-bold' : 'text-gray-300'}`}>{mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                                {['1m', '5m', '15m', '1H', '1D'].map(tf => <button key={tf} className="px-2 py-1 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-sm transition-colors">{tf}</button>)}
                                <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-sm transition-colors" title={settings.tooltips ? "Pantalla Completa" : undefined}><ArrowsPointingOutIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 min-h-[250px] md:min-h-[300px] relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
                                    onClick={handleChartClick}
                                    onMouseMove={handleChartMouseMove}
                                    onMouseLeave={handleChartMouseLeave}
                                    style={{ cursor: isTradeFromChartArmed ? 'crosshair' : 'default' }}
                                    barCategoryGap="70%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                                    <XAxis dataKey="time" stroke="#9a9a9a" fontSize={12} />
                                    <YAxis stroke="#9a9a9a" fontSize={12} domain={[yDomain[0] - yBuffer, yDomain[1] + yBuffer]} tickFormatter={(value) => `${Number(value).toFixed(4)}`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#facc15', strokeDasharray: '3 3' }}/>
                                    <Bar dataKey="wick" shape={<CandlestickShape />} />
                                    {crosshairData && (
                                        <>
                                            <ReferenceLine y={crosshairData.price} stroke="#facc15" strokeDasharray="2 2" />
                                            <ReferenceLine x={crosshairData.time} stroke="#facc15" strokeDasharray="2 2" />
                                        </>
                                    )}
                                    {isDemoSessionActive && aiTrainingMarker && (
                                        <ReferenceLine x={aiTrainingMarker.time} stroke="#0ea5e9" strokeWidth={2} label={{ value: 'AI Signal', fill: '#0ea5e9', position: 'top' }} />
                                    )}
                                    {proactiveAiAlertArea && <ReferenceArea y1={proactiveAiAlertArea.y1} y2={proactiveAiAlertArea.y2} stroke="rgba(250, 204, 21, 0.5)" fill="rgba(250, 204, 21, 0.2)" strokeOpacity={0.5} />}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute bottom-4 left-4 z-10">
                            <button onClick={() => setIsTradeFromChartArmed(!isTradeFromChartArmed)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-sm transition-all duration-300 ${isTradeFromChartArmed ? 'bg-brand-gold text-black shadow-lg animate-pulse' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'}`}
                                title={settings.tooltips ? "Activa para hacer clic en el gráfico y ejecutar una operación." : undefined}
                            >
                                <BoltIcon className="w-5 h-5" />
                                {isTradeFromChartArmed ? t('clickToTrade') : t('tradeFromChart')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Trade Execution */}
                <div className="w-full lg:w-[300px] bg-[#161B22] flex flex-col border-l-0 lg:border-l border-t lg:border-t-0 border-gray-700/50 p-3 space-y-3">
                     <h3 className="text-lg font-semibold">{t('executionPanel')}</h3>
                        <div>
                           <label htmlFor="size" className="block text-xs font-medium text-gray-400 mb-1" title={settings.tooltips ? "El tamaño de la operación en lotes." : undefined}>{t('volumeLots')}</label>
                           <div className="flex items-center gap-1">
                                <input id="size" type="number" value={tradeSize} onChange={e => setTradeSize(Number(e.target.value))} step="0.01" className="w-full bg-[#0D1117] border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                                {[0.01, 0.1, 1.0].map(s => (
                                    <button key={s} onClick={() => setTradeSize(s)} className="bg-gray-700 hover:bg-gray-600 px-2 py-1.5 rounded-md text-xs">{s}</button>
                                ))}
                           </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                           <div>
                                <label htmlFor="stopLoss" className="block text-xs font-medium text-gray-400 mb-1" title={settings.tooltips ? "Precio al que la operación se cierra automáticamente para limitar pérdidas." : undefined}>{t('stopLoss')}</label>
                                <input id="stopLoss" type="number" placeholder="Precio" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full bg-[#0D1117] border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                           </div>
                           <div>
                               <label htmlFor="takeProfit" className="block text-xs font-medium text-gray-400 mb-1" title={settings.tooltips ? "Precio al que la operación se cierra automáticamente para asegurar ganancias." : undefined}>{t('takeProfit')}</label>
                               <input id="takeProfit" type="number" placeholder="Precio" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full bg-[#0D1117] border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                           </div>
                       </div>
                       <div className="flex items-center justify-between py-1">
                           <div className="flex items-center" title={settings.tooltips ? "Ejecuta operaciones con un solo clic, sin confirmación adicional (excepto en Modo Real)." : undefined}>
                               <label htmlFor="one-click-toggle" className="text-xs font-medium text-gray-400 mr-2">{t('oneClickTrading')}</label>
                               <button onClick={() => { setIsOneClick(!isOneClick); dispatchNotification({type: 'info', title: 'Info', message: `1-Click Trading ${!isOneClick ? 'Activado' : 'Desactivado'}.`}); }} className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${isOneClick ? 'bg-brand-gold' : 'bg-gray-600'}`}>
                                   <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${isOneClick ? 'translate-x-5' : 'translate-x-1'}`} />
                               </button>
                           </div>
                            <span className="text-xs text-gray-500">Spread: {calculateSpread(activeAsset)}</span>
                       </div>
                        <button onClick={() => handleRequestAdvice()} disabled={aiIntensity === 'Apagada'} className="w-full flex items-center justify-center gap-2 bg-brand-gold/20 text-brand-gold font-bold py-2 rounded-lg hover:bg-brand-gold/30 transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500" title={settings.tooltips ? "Solicitar un análisis del mercado a la IA." : undefined}>
                            <LightBulbIcon className="w-5 h-5" />
                            {t('requestAiAdvice')}
                        </button>
                       <div className="grid grid-cols-2 gap-2 pt-1 flex-1 content-end">
                         <button onClick={() => handleTradeAction('SELL')} disabled={isTradingDisabled} className="w-full bg-brand-red/80 text-white font-bold py-3 rounded-lg hover:bg-brand-red transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500" title={settings.tooltips ? "Ejecutar una orden de venta." : undefined}>
                           SELL <span className="block text-xs font-normal opacity-90">{activeAsset.sell.toFixed(activeAsset.category === 'Forex' ? 4 : 2)}</span>
                         </button>
                         <button onClick={() => handleTradeAction('BUY')} disabled={isTradingDisabled} className="w-full bg-brand-green/80 text-white font-bold py-3 rounded-lg hover:bg-brand-green transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500" title={settings.tooltips ? "Ejecutar una orden de compra." : undefined}>
                           BUY <span className="block text-xs font-normal opacity-90">{activeAsset.buy.toFixed(activeAsset.category === 'Forex' ? 4 : 2)}</span>
                         </button>
                       </div>
                     <div className="border-t border-gray-700/50 pt-3 space-y-2 text-xs">
                           <h4 className="text-sm font-semibold text-gray-400 mb-1">{t('accountInfo')}</h4>
                           <div className="flex justify-between">
                               <span className="text-gray-400">Equity</span>
                               <span className="font-mono text-white">{walletData.equity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="text-gray-400">Free Margin</span>
                               <span className="font-mono text-white">{walletData.freeMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="text-gray-400">Used Margin</span>
                               <span className="font-mono text-white">{walletData.usedMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                           </div>
                        </div>
                </div>
            </div>

            {/* Bottom Panel: Financial Info */}
            <div className="h-auto md:h-16 bg-[#161B22] border-t border-gray-700/50 flex items-center px-2 md:px-4 py-2 md:py-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full text-sm gap-y-2 gap-x-1">
                    {[
                        { label: 'Equity', value: walletData.equity, icon: WalletIcon },
                        { label: 'Free Margin', value: walletData.freeMargin, icon: BanknotesIcon },
                        { label: 'Used Margin', value: walletData.usedMargin, icon: BanknotesIcon },
                        { label: 'Open P/L', value: walletData.profit, icon: ArrowTrendingUpIcon, color: walletData.profit >= 0 ? 'text-brand-green' : 'text-brand-red' },
                        { label: 'Balance', value: walletData.balance, icon: WalletIcon },
                        { label: 'Credit', value: walletData.credit, icon: CreditCardIcon },
                    ].map((item, index) => (
                        <div key={item.label} className="flex items-center justify-center gap-2 relative">
                           {index > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-gray-700/60 hidden md:block"></div>}
                           <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex flex-col">
                               <span className="text-gray-400 text-xs truncate">{item.label}</span>
                               <span className={`font-semibold text-xs sm:text-sm ${item.color || 'text-white'}`}>{item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuantumDeskView;