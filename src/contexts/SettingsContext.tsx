import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { translations, TranslationKey } from '../../i18n/translations';
import { NotificationConfig, AppNotification, NotificationType, MainView, GitHubConfig, AIStrategyConfig } from '../../types';
import { DEFAULT_AI_STRATEGY_CONFIG } from '../../constants';

// Define the shape of your settings
export interface GlobalSettings {
    language: string;
    theme: 'Light' | 'Dark';
    sounds: boolean;
    tooltips: boolean;
    fontSize: 'Small' | 'Medium' | 'Large';
    timezone: string;
    baseCurrency: 'USD' | 'EUR' | 'JPY';
    notificationConfig: NotificationConfig;
    notifications: AppNotification[];
    githubConfig: GitHubConfig;
    aiConfig: AIStrategyConfig;
}

// Define the context type
interface SettingsContextType {
    settings: GlobalSettings;
    setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
    t: (key: TranslationKey, ...args: any[]) => string;
    dispatchNotification: (payload: { type: NotificationType; title: string; message: string; linkTo?: MainView }) => void;
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Default settings
export const DEFAULT_GLOBAL_PREFS: Omit<GlobalSettings, 'notifications'> = {
    language: 'English',
    theme: 'Dark',
    sounds: true,
    tooltips: true,
    fontSize: 'Medium',
    timezone: 'UTC',
    baseCurrency: 'USD',
    notificationConfig: {
        pushEnabled: true,
        triggers: {
            highConfidenceAI: true,
            significantMoves: false,
        },
        integrations: {
            whatsApp: { enabled: false, number: '' },
            telegram: { enabled: false, username: '' },
        },
    },
    githubConfig: {
        token: '',
        repoUrl: '',
        branch: 'main',
    },
    aiConfig: DEFAULT_AI_STRATEGY_CONFIG,
};

// Create a provider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<GlobalSettings>(() => {
        try {
            const storedSettings = localStorage.getItem('quantumTradeSettings');
            if (storedSettings) {
                // Merge stored settings with defaults to ensure new fields are present
                const parsed = JSON.parse(storedSettings);
                return { 
                    ...DEFAULT_GLOBAL_PREFS, 
                    ...parsed,
                    notificationConfig: {
                        ...DEFAULT_GLOBAL_PREFS.notificationConfig,
                        ...(parsed.notificationConfig || {})
                    },
                    githubConfig: {
                        ...DEFAULT_GLOBAL_PREFS.githubConfig,
                        ...(parsed.githubConfig || {})
                    },
                    aiConfig: {
                        ...DEFAULT_GLOBAL_PREFS.aiConfig,
                        ...(parsed.aiConfig || {})
                    },
                    notifications: parsed.notifications || []
                };
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
        return { ...DEFAULT_GLOBAL_PREFS, notifications: [] };
    });

    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme === 'Light') {
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
        }
    }, [settings.theme]);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('quantumTradeSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    // Translation function
    const t = useCallback((key: TranslationKey, ...args: any[]): string => {
        const translation = translations[settings.language]?.[key] || translations['English']?.[key] || key;
        if (args.length > 0) {
            return args.reduce((str, arg, index) => {
                return str.replace(`{${index}}`, String(arg));
            }, translation);
        }
        return translation;
    }, [settings.language]);

    // Notification dispatch function
    const dispatchNotification = useCallback((payload: { type: NotificationType; title: string; message: string; linkTo?: MainView }) => {
        const newNotification: AppNotification = {
            id: Date.now().toString(),
            type: payload.type,
            title: payload.title,
            message: payload.message,
            linkTo: payload.linkTo,
            timestamp: new Date(),
            isRead: false,
        };
        setSettings(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications]
        }));
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
        }));
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            notifications: []
        }));
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        settings,
        setSettings,
        t,
        dispatchNotification,
        markAllAsRead,
        clearAllNotifications,
    }), [settings, t, dispatchNotification, markAllAsRead, clearAllNotifications]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook to use the settings context
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
