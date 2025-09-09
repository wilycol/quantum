import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import LegalGuard from './components/LegalGuard';
import { withBoundary } from './components/withBoundary';
import { useSettings } from './contexts/SettingsContext';
import { MainView, AppNotification } from './types';
import { bindOrderEvents } from './stores/account';

// Carga perezosa de vistas pesadas
const TradingManualView = lazy(() => import('./components/TradingManualView'));
const PortfolioView = lazy(() => import('./components/PortfolioView'));
const QuantumCoreView = lazy(() => import('./app/qcore/page'));
const SimulatorView = lazy(() => import('./components/SimulatorView'));
const QuantumDeskView = lazy(() => import('./components/QuantumDeskView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const NewsView = lazy(() => import('./components/NewsView'));
const SupportView = lazy(() => import('./components/SupportView'));
const NotificationsView = lazy(() => import('./components/NotificationsView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const LegalView = lazy(() => import('./components/LegalView'));
const DocumentView = lazy(() => import('./components/DocumentView'));

// Document views
const BusinessPlanView = lazy(() => import('./components/documents/BusinessPlanView'));
const MarketingStrategyView = lazy(() => import('./components/documents/MarketingStrategyView'));
const TechnicalSpecView = lazy(() => import('./components/documents/TechnicalSpecView'));
const UIGuideView = lazy(() => import('./components/documents/UIGuideView'));
const SecurityComplianceView = lazy(() => import('./components/documents/SecurityComplianceView'));
const LegalPrivacyView = lazy(() => import('./components/documents/LegalPrivacyView'));

// Componente de loading para Suspense
const LoadingFallback: React.FC = () => (
  <div style={{ 
    padding: 16, 
    textAlign: 'center', 
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px'
  }}>
    <div>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }}></div>
      <div>Cargando vista...</div>
    </div>
  </div>
);

// versiones envueltas con ErrorBoundary
const TradingManualSafe = withBoundary('TradingManualView', TradingManualView);
const PortfolioSafe = withBoundary('PortfolioView', PortfolioView);
const QuantumCoreSafe = withBoundary('QuantumCoreView', QuantumCoreView);
const SimulatorSafe = withBoundary('SimulatorView', SimulatorView);
const QuantumDeskSafe = withBoundary('QuantumDeskView', QuantumDeskView);
const SettingsSafe = withBoundary('SettingsView', SettingsView);
const NewsSafe = withBoundary('NewsView', NewsView);
const SupportSafe = withBoundary('SupportView', SupportView);
const NotificationsSafe = withBoundary('NotificationsView', NotificationsView);
const HistorySafe = withBoundary('HistoryView', HistoryView);
const LegalSafe = withBoundary('LegalView', LegalView);
const DocumentSafe = withBoundary('DocumentView', DocumentView);

// Document view boundaries
const BusinessPlanSafe = withBoundary('BusinessPlanView', BusinessPlanView);
const MarketingStrategySafe = withBoundary('MarketingStrategyView', MarketingStrategyView);
const TechnicalSpecSafe = withBoundary('TechnicalSpecView', TechnicalSpecView);
const UIGuideSafe = withBoundary('UIGuideView', UIGuideView);
const SecurityComplianceSafe = withBoundary('SecurityComplianceView', SecurityComplianceView);
const LegalPrivacySafe = withBoundary('LegalPrivacyView', LegalPrivacyView);

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
  const [currentView, setCurrentView] = useState<MainView>('manual_trading');
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (settings.notifications.length > 0 && settings.notificationConfig.pushEnabled) {
      if (!lastNotification || settings.notifications[0].id !== lastNotification.id) {
        setLastNotification(settings.notifications[0]);
      }
    }
  }, [settings.notifications, settings.notificationConfig.pushEnabled, lastNotification]);

  // Bindear eventos de órdenes para el store de cuenta
  useEffect(() => {
    const cleanup = bindOrderEvents();
    return cleanup;
  }, []);

  // Listener para navegación desde SupportView
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { view } = event.detail;
      if (view && typeof view === 'string') {
        setCurrentView(view as MainView);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);


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
              <Header 
                view={currentView} 
                setView={setCurrentView}
                showTradingControls={currentView === 'manual_trading'}
                appMode="demo-hybrid"
                onModeChange={(mode) => {
                  // TODO: Implementar cambio de modo global
                  console.log('Mode changed to:', mode);
                }}
              />
              <main className={`flex-1 overflow-y-auto ${needsPadding ? 'p-2 sm:p-4 lg:p-6' : ''}`}>
                <Suspense fallback={<LoadingFallback />}>
                  {currentView === 'quantum_core' && <QuantumCoreSafe />}
                  {currentView === 'manual_trading' && <TradingManualSafe />}
                  {currentView === 'simulator' && <SimulatorSafe />}
                  {currentView === 'desk' && <QuantumDeskSafe />}
                  {currentView === 'portfolio' && <PortfolioSafe />}
                  {currentView === 'settings' && <SettingsSafe />}
                  {currentView === 'news' && <NewsSafe />}
                  {currentView === 'support' && <SupportSafe />}
                  {currentView === 'notifications' && <NotificationsSafe />}
                  {currentView === 'history' && <HistorySafe />}
                  {currentView === 'legal' && <LegalSafe />}
                  {currentView === 'document' && <DocumentSafe />}
                  
                  {/* Document views */}
                  {currentView === 'business-plan' && <BusinessPlanSafe />}
                  {currentView === 'marketing-strategy' && <MarketingStrategySafe />}
                  {currentView === 'technical-spec' && <TechnicalSpecSafe />}
                  {currentView === 'ui-guide' && <UIGuideSafe />}
                  {currentView === 'security-compliance' && <SecurityComplianceSafe />}
                  {currentView === 'legal-privacy' && <LegalPrivacySafe />}
                </Suspense>
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
        <LegalGuard onNavigateToLegal={() => setCurrentView('legal')} />
    </div>
  );
};

export default App;
