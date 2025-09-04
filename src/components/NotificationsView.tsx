
import React from 'react';
import Card from './ui/Card';
import { useSettings } from '../contexts/SettingsContext';
import { AppNotification, MainView } from '../../types';

// Icons
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>);
const BoltIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>);
const InformationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>);

const NotificationIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
    switch (type) {
        case 'ai_alert': return <SparklesIcon className="w-6 h-6 text-brand-gold" />;
        case 'portfolio_warning': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />;
        case 'trade_executed': return <BoltIcon className="w-6 h-6 text-blue-400" />;
        case 'news_high_impact': return <BellIcon className="w-6 h-6 text-red-500" />;
        case 'info':
        default: return <InformationCircleIcon className="w-6 h-6 text-gray-400" />;
    }
};

const NotificationsView: React.FC = () => {
    const { settings, markAllAsRead, clearAllNotifications, t } = useSettings();
    const { notifications } = settings;

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-brand-navy border border-gray-700/50">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-white">{t('notifications')}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={markAllAsRead} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-1.5 px-3 rounded-md transition-colors">
                            {t('markAllAsRead')}
                        </button>
                        <button onClick={clearAllNotifications} className="text-sm bg-brand-red/80 hover:bg-brand-red text-white font-bold py-1.5 px-3 rounded-md transition-colors">
                            {t('clearAll')}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <BellIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-lg font-semibold">{t('noNotifications')}</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div key={notification.id} className={`p-4 rounded-lg flex items-start gap-4 transition-colors ${notification.isRead ? 'bg-gray-800/40 opacity-70' : 'bg-gray-800'}`}>
                                <div className="flex-shrink-0 mt-1">
                                    <NotificationIcon type={notification.type} />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-white">{t(`notificationType_${notification.type}` as any)}</h3>
                                        <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-300">{notification.message}</p>
                                </div>
                                {!notification.isRead && (
                                     <div className="flex-shrink-0 w-2.5 h-2.5 bg-brand-gold rounded-full mt-2 animate-pulse"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

export default NotificationsView;
