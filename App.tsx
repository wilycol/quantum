

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QuantumCoreView from './components/QuantumCoreView';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import SimulatorView from './components/SimulatorView';
import QuantumDeskView from './components/QuantumDeskView';
import PortfolioView from './components/PortfolioView';
import SettingsView from './components/SettingsView';
import NewsView from './components/NewsView';
import SupportView from './components/SupportView';
import NotificationsView from './components/NotificationsView';
import HistoryView from './components/HistoryView';
import { useSettings } from './contexts/SettingsContext';
import { MainView, AppNotification } from './types';

type AppState = 'splash' | 'login' | 'main';

const NotificationToaster: React.FC<{ notification: AppNotification | null }> = ({ notification }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!isVisible || !notification) {
        return null;
    }

    const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>);

    return (
        <div className="fixed top-24 right-8 z-[100] w-80 bg-brand-navy border-l-4 border-brand-gold rounded-r-lg shadow-2xl p-4 animate-fade-in-right">
             <div className="flex items-start gap-3">
                <BellIcon className="w-6 h-6 text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-white">{notification.title}</h4>
                    <p className="text-sm text-gray-300">{notification.message}</p>
                </div>
             </div>
        </div>
    );
};

const App: React.FC = () => {
  const { settings } = useSettings();
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentView, setCurrentView] = useState<MainView>('quantum_core');
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (settings.notifications.length > 0 && settings.notificationConfig.pushEnabled) {
      if (!lastNotification || settings.notifications[0].id !== lastNotification.id) {
        setLastNotification(settings.notifications[0]);
      }
    }
  }, [settings.notifications, settings.notificationConfig.pushEnabled, lastNotification]);


  const handleSplashComplete = () => {
    setAppState('login');
  };

  const handleLogin = () => {
    setAppState('main');
  };
  
  const renderMainView = () => {
      const needsPadding = !['desk'].includes(currentView);
      const themeClass = settings.theme === 'Light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-900 text-gray-300';

      return (
         <div className={`${themeClass} font-sans flex h-screen overflow-hidden`}>
            <Sidebar activeView={currentView} setView={setCurrentView} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header view={currentView} setView={setCurrentView} />
              <main className={`flex-1 overflow-y-auto ${needsPadding ? 'p-2 sm:p-4 lg:p-6' : ''}`}>
                {currentView === 'quantum_core' && <QuantumCoreView />}
                {currentView === 'simulator' && <SimulatorView />}
                {currentView === 'desk' && <QuantumDeskView />}
                {currentView === 'portfolio' && <PortfolioView />}
                {currentView === 'settings' && <SettingsView />}
                {currentView === 'news' && <NewsView />}
                {currentView === 'support' && <SupportView />}
                {currentView === 'notifications' && <NotificationsView />}
                {currentView === 'history' && <HistoryView />}
              </main>
            </div>
          </div>
      )
  }

  const renderContent = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onCompleted={handleSplashComplete} />;
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'main':
          return renderMainView();
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  const fontClass = {
    Small: 'text-sm',
    Medium: 'text-base',
    Large: 'text-lg',
  }[settings.fontSize] || 'text-base';


  return (
    <div className={fontClass}>
        {renderContent()}
        <NotificationToaster notification={lastNotification} />
    </div>
  );
};

export default App;