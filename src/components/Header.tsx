
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MainView } from '../../types';
import { useEnvironment } from '../hooks/useEnvironment';

const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

interface HeaderProps {
    view: MainView;
    setView: (view: MainView) => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  const { settings, t } = useSettings();
  const { enableAI, paper, mode } = useEnvironment();
  const unreadCount = settings.notifications.filter(n => !n.isRead).length;

  const titles: Record<MainView, { title: string; subtitle: string }> = {
      quantum_core: {
          title: t('quantumCore'),
          subtitle: t('quantumCoreSubtitle')
      },
      manual_trading: {
          title: 'Manual Trading',
          subtitle: 'Manual trading with AI coaching in simulation mode.'
      },
      simulator: {
          title: 'AI Trading Simulator',
          subtitle: 'Test AI strategies in a risk-free environment.'
      },
      desk: {
          title: 'Quantum Desk',
          subtitle: 'Manual trading terminal assisted by AI.'
      },
      portfolio: {
          title: t('intelligentPortfolio'),
          subtitle: t('portfolioManagement')
      },
      settings: {
          title: t('settings'),
          subtitle: 'Manage your platform, risk, and AI configurations.'
      },
      news: {
            title: 'Market News & Insights',
            subtitle: 'Stay informed with real-time data and AI analysis.'
      },
      support: {
            title: t('supportTitle'),
            subtitle: t('supportSubtitle')
      },
      notifications: {
            title: t('notifications'),
            subtitle: t('notificationsSubtitle')
      },
      history: {
            title: t('historyAndReports'),
            subtitle: t('historySubtitle')
      }
  }

  const { title, subtitle } = titles[view] || titles.quantum_core;

  return (
    <header className="h-20 bg-gray-900 border-b border-gray-700/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-gold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{title}</h1>
        <p className="text-sm text-gray-400 hidden sm:block">{subtitle}</p>
        
        {/* Status Bar */}
        <div className="flex items-center gap-3 mt-2">
          {/* Mode y Paper Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Mode:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {mode}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">Paper:</span>
            <span className={`px-2 py-1 rounded-full font-medium ${
              paper ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {paper ? 'ON' : 'OFF'}
            </span>
          </div>
          
          {/* AI Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">•</span>
            <span className={`px-2 py-1 rounded-full font-medium text-xs ${
              enableAI ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
            }`}>
              AI: {enableAI ? 'Active' : 'Mock'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative hidden md:block">
          <MagnifyingGlassIcon className="h-5 w-5 text-brand-gold/70 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchAssets')}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>
        <button onClick={() => setView('notifications')} className="p-2 rounded-full hover:bg-gray-800 relative group" title={settings.tooltips ? t('notifications') : undefined}>
          <BellIcon className="h-6 w-6 text-brand-gold/70 group-hover:text-brand-gold transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button className="rounded-full hover:ring-2 hover:ring-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all duration-300" title="User Profile">
            <img src="https://res.cloudinary.com/djojon779/image/upload/v1754407877/hunicorn_jbyfkj.png" alt="User Avatar" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default Header;