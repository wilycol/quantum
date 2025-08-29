

import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MainView } from '../types';


// --- Lucide-inspired SVG Icons ---
const CpuChipIconModern = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6v6H9z"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M12 3v2"/><path d="M12 19v2"/></svg>);
const MonitorDotIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="19" cy="5" r="1"/><path d="M22 12v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>);
const CpuChipIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M19.5 8.25H21M19.5 12H21M19.5 15.75H21M15.75 21v-1.5M12 5.25v-1.5m0 15v1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6.38v11.24a2.25 2.25 0 0 0 2.25 2.25h8.25a2.25 2.25 0 0 0 2.25-2.25V6.38a2.25 2.25 0 0 0-2.25-2.25H7.5A2.25 2.25 0 0 0 5.25 6.38ZM9 9.75h6v4.5H9v-4.5Z" /></svg>);
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14"/><path d="M3 5v14"/><path d="M22 12a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4Z"/></svg>);
const NewspaperIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>);
const LifeBuoyIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m4.93 19.07 4.24-4.24"/><circle cx="12" cy="12" r="4"/></svg>);
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>);
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>);
const ArchiveBoxIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>);
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);


interface SidebarProps {
    activeView: MainView;
    setView: (view: MainView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const { settings, t } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const unreadNotifications = settings.notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'quantum_core', name: t('quantumCore'), icon: CpuChipIconModern },
    { id: 'desk', name: 'Quantum Desk', icon: MonitorDotIcon },
    { id: 'simulator', name: 'AI Simulator', icon: CpuChipIcon },
    { id: 'portfolio', name: 'Portfolio', icon: WalletIcon },
    { id: 'news', name: 'News', icon: NewspaperIcon },
    { id: 'notifications', name: t('notifications'), icon: BellIcon, badge: unreadNotifications },
    { id: 'history', name: t('historyAndReports'), icon: ArchiveBoxIcon },
    { id: 'support', name: 'Support', icon: LifeBuoyIcon },
  ];

  const handleNavClick = (e: React.MouseEvent, id: MainView) => {
      e.preventDefault();
      setView(id);
  };

  const collapsedClass = isCollapsed ? 'w-20' : 'w-64';
  const labelClass = isCollapsed ? 'opacity-0 scale-90' : 'opacity-100 scale-100';

  return (
    <aside className={`bg-gray-100 dark:bg-[#0B0C10] text-gray-500 dark:text-gray-400 flex flex-col transition-all duration-300 border-r border-gray-200 dark:border-gray-700/30 ${collapsedClass}`}>
      <div className={`h-20 flex items-center border-b border-gray-200 dark:border-gray-700/30 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
        {isCollapsed ? 
            <button onClick={() => setIsCollapsed(false)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Expand Sidebar">
                <ArrowRightIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
            </button>
            :
            <>
                <a href="#" onClick={(e) => handleNavClick(e, 'desk')} className="flex items-center gap-2">
                    <img 
                      src="https://res.cloudinary.com/djojon779/image/upload/v1754260994/ChatGPT_Image_3_ago_2025_04_34_50_p.m._naw5on.png" 
                      alt="QuantumTrade Symbol" 
                      className="h-10 w-10 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                    />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">QuantumTrade</span>
                </a>
                <button onClick={() => setIsCollapsed(true)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Collapse Sidebar">
                    <MenuIcon className="w-6 h-6"/>
                </button>
            </>
        }
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
            const isActive = item.id === activeView;
            return (
                <a
                    key={item.id}
                    href="#"
                    onClick={(e) => handleNavClick(e, item.id as MainView)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${isActive ? 'bg-[#FACC15]/10 text-gray-900 dark:text-white shadow-inner' : 'hover:bg-gray-200 dark:hover:bg-gray-800/50'}`}
                    title={settings.tooltips ? item.name : undefined}
                >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-200 ${isActive ? 'bg-[#FACC15]' : 'bg-transparent'}`}></div>
                    <item.icon className={`h-6 w-6 flex-shrink-0 transition-colors ${isActive ? 'text-[#FACC15]' : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                    <span className={`ml-4 font-medium transition-all duration-200 ${isActive ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'} ${isCollapsed ? 'hidden' : ''}`}>{item.name}</span>
                    {item.badge && item.badge > 0 && !isCollapsed && (
                        <span className="ml-auto bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{item.badge}</span>
                    )}
                </a>
            );
        })}
      </nav>

      <div className={`p-4 border-t border-gray-200 dark:border-gray-700/30`}>
        <a href="#" onClick={(e) => handleNavClick(e, 'settings')} title={settings.tooltips ? t("settings") : undefined} className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${activeView === 'settings' ? 'bg-[#FACC15]/10 text-gray-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800/50'}`}>
            <SettingsIcon className={`h-6 w-6 transition-colors ${activeView === 'settings' ? 'text-[#FACC15]' : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
            <span className={`ml-4 font-medium transition-colors ${activeView === 'settings' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'} ${isCollapsed ? 'hidden' : ''}`}>{t('settings')}</span>
        </a>
        <div className={`flex items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700/30 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
             <img src="https://res.cloudinary.com/djojon779/image/upload/v1754407877/hunicorn_jbyfkj.png" alt="User Avatar" className="w-10 h-10 rounded-full" />
             <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-[#0B0C10]"></span>
          </div>
          <div className={`flex flex-col ml-3 ${isCollapsed ? 'hidden' : ''}`}>
              <span className="font-semibold text-gray-900 dark:text-white">Helios Cypher</span>
              <span className="text-sm text-brand-gold/80">Quantum Operator</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;