import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { translations, TranslationKey } from '../i18n/translations';
import { NotificationConfig, AppNotification, NotificationType, MainView, GitHubConfig, AIStrategyConfig } from '../types';
import { DEFAULT_AI_STRATEGY_CONFIG } from '../constants';

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

        root.classList.remove('text-sm', 'text-base', 'text-lg');
        switch(settings.fontSize) {
            case 'Small': root.classList.add('text-sm'); break;
            case 'Large': root.classList.add('text-lg'); break;
            default: root.classList.add('text-base'); break;
        }

        try {
            localStorage.setItem('quantumTradeSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);
    
    const playSound = useCallback((type: 'info' | 'ai_alert' | 'warning') => {
        if(settings.sounds) {
            const audioContext = new (window.AudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch (type) {
                case 'ai_alert':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    break;
                case 'warning':
                     oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime); // D#4
                    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                    break;
                case 'info':
                default:
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    break;
            }
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
        }
    }, [settings.sounds]);

    const dispatchNotification = useCallback((payload: { type: NotificationType; title: string; message: string; linkTo?: MainView }) => {
        const newNotification: AppNotification = {
            id: Date.now(),
            timestamp: Date.now(),
            isRead: false,
            ...payload,
        };
        setSettings(prev => ({ ...prev, notifications: [newNotification, ...prev.notifications] }));
        
        let soundType: 'info' | 'ai_alert' | 'warning' = 'info';
        if (payload.type === 'ai_alert') soundType = 'ai_alert';
        if (payload.type === 'portfolio_warning') soundType = 'warning';
        playSound(soundType);

    }, [playSound]);

    const markAllAsRead = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => ({...n, isRead: true}))
        }));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setSettings(prev => ({ ...prev, notifications: [] }));
    }, []);

    const t = useCallback((key: TranslationKey, ...args: any[]): string => {
        const lang = settings.language;
        const langKey = lang as keyof typeof translations;
        const translationSet = translations[langKey] || translations.English;
        let template = translationSet[key] || translations.English[key] || String(key);

        if (args.length > 0) {
            args.forEach((arg, index) => {
                template = template.replace(`{${index}}`, String(arg));
            });
        }

        return template;
    }, [settings.language]);

    const value = useMemo(() => ({ settings, setSettings, t, dispatchNotification, markAllAsRead, clearAllNotifications }), [settings, setSettings, t, dispatchNotification, markAllAsRead, clearAllNotifications]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// Create a custom hook for easy access
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};