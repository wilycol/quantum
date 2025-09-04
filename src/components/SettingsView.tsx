import React from 'react';
import Card from './ui/Card';
import { UserRiskConfig, AIStrategyConfig, NotificationConfig } from '../../types';
import { DEFAULT_USER_RISK_CONFIG, DEFAULT_AI_STRATEGY_CONFIG } from '../constants';
import { useSettings, GlobalSettings, DEFAULT_GLOBAL_PREFS } from '../contexts/SettingsContext';
import { TranslationKey } from '../../i18n/translations';

// Icons
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.956 11.956 0 0 1 12 3c2.35 0 4.597.433 6.568 1.263m-13.136 0A11.956 11.956 0 0 1 12 3c-2.35 0-4.597.433-6.568-1.263m13.136 0A11.956 11.956 0 0 0 12 18.75c-2.35 0-4.597-.433-6.568-1.263m13.136 0A11.956 11.956 0 0 0 12 18.75c2.35 0 4.597.433 6.568-1.263m-13.136 0-3.263-3.263A11.956 11.956 0 0 1 2.25 12c0-2.35.433-4.597 1.263-6.568m18 6.568a11.956 11.956 0 0 1-1.263 6.568m-13.136-13.136L12 18.75" /></svg>);
const WrenchScrewdriverIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17l2.472-2.472a3.75 3.75 0 0 0-5.303-5.303L6 11.42m5.83-5.83.22-.22a2.121 2.121 0 0 0-3-3l-.22.22m-1.026 5.026 1.516 1.516" /></svg>);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>);
const GlobeAltIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c.504 0 1.002-.023 1.49-.066M12 3c.504 0 1.002.023 1.49.066M12 3a9.004 9.004 0 0 0-8.716 6.747M12 3a9.004 9.004 0 0 1 8.716 6.747m-17.432 0h17.432M12 12.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /></svg>);
const BellAlertIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M12.75 4.5v.75m-1.5 0V4.5" /></svg>);
const CodeBracketIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V5.75A2.25 2.25 0 0 0 18 3.5H6A2.25 2.25 0 0 0 3.75 5.75v12.5A2.25 2.25 0 0 0 6 20.25Z" /></svg>);



const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => {
    return (
        <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-brand-gold' : 'bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const SettingsView: React.FC = () => {
    const { settings, setSettings, t } = useSettings();
    const [userConfig, setUserConfig] = React.useState<UserRiskConfig>(DEFAULT_USER_RISK_CONFIG);

    const handleUserConfigChange = (field: keyof UserRiskConfig, value: any) => {
        setUserConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleUserRuleChange = (field: keyof UserRiskConfig['rules'], value: boolean) => {
        setUserConfig(prev => ({...prev, rules: { ...prev.rules, [field]: value }}));
    };
    
    const handleGlobalPrefsChange = (field: keyof GlobalSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationConfigChange = (field: keyof NotificationConfig, value: any) => {
        setSettings(prev => ({
            ...prev,
            notificationConfig: { ...prev.notificationConfig, [field]: value }
        }));
    };
    
    const handleNotificationSubChange = <K extends keyof NotificationConfig, SK extends keyof NotificationConfig[K]>(field: K, subField: SK, value: any) => {
        setSettings(prev => ({
            ...prev,
            notificationConfig: {
                ...prev.notificationConfig,
                [field]: {
                    ...(prev.notificationConfig[field] as any),
                    [subField]: value,
                }
            }
        }));
    };
    
    const handleSavePrefs = (prefsKey: string) => {
        alert(`${prefsKey} saved!`);
    };
    
    const handleGitHubConfigChange = (field: keyof GlobalSettings['githubConfig'], value: string) => {
        setSettings(prev => ({
            ...prev,
            githubConfig: {
                ...prev.githubConfig,
                [field]: value
            }
        }));
    };

    const renderSelect = (label: string, value: string, onChange: (value: string) => void, options: string[]) => (
         <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold">
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Riesgos y Estrategias</h2>
                <p className="text-gray-500 dark:text-gray-400">Define tus reglas de operación y el comportamiento de la IA.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-light-border dark:border-gray-700/50">
                    <div className="flex items-center mb-4">
                        <ShieldCheckIcon className="w-6 h-6 text-brand-gold mr-3"/>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configuración de Riesgo para Usuario</h3>
                    </div>
                    <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
                        {/* Stop Loss */}
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Stop Loss</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="number" value={userConfig.stopLossValue} onChange={e => handleUserConfigChange('stopLossValue', parseFloat(e.target.value))} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                                <select value={userConfig.stopLossType} onChange={e => handleUserConfigChange('stopLossType', e.target.value)} className="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold">
                                    <option value="percent">%</option>
                                    <option value="value">$</option>
                                </select>
                            </div>
                        </div>
                         {/* Take Profit */}
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Take Profit</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="number" value={userConfig.takeProfitValue} onChange={e => handleUserConfigChange('takeProfitValue', parseFloat(e.target.value))} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                                <select value={userConfig.takeProfitType} onChange={e => handleUserConfigChange('takeProfitType', e.target.value)} className="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold">
                                    <option value="percent">%</option>
                                    <option value="value">$</option>
                                </select>
                            </div>
                        </div>
                        {/* Investment Limit */}
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Límite de Inversión por Operación ($)</label>
                            <input type="number" value={userConfig.maxInvestmentPerTrade} onChange={e => handleUserConfigChange('maxInvestmentPerTrade', parseFloat(e.target.value))} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>
                        {/* Max Open Trades */}
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Máximo de Operaciones Abiertas</label>
                            <input type="number" value={userConfig.maxOpenTrades} onChange={e => handleUserConfigChange('maxOpenTrades', parseInt(e.target.value, 10))} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>

                        {/* Rules */}
                        <div className="space-y-3 pt-2 border-t border-gray-300 dark:border-gray-700/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Requerir Stop Loss</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Impide abrir operaciones sin un Stop Loss definido.</p>
                                </div>
                                <ToggleSwitch checked={userConfig.rules.requireStopLoss} onChange={c => handleUserRuleChange('requireStopLoss', c)}/>
                            </div>
                             <div className="flex justify-between items-center">
                                 <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Prevenir en Alta Volatilidad</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Bloquea nuevas operaciones si el mercado está muy volátil.</p>
                                 </div>
                                <ToggleSwitch checked={userConfig.rules.preventHighVolatility} onChange={c => handleUserRuleChange('preventHighVolatility', c)}/>
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 flex gap-2">
                        <button onClick={() => handleSavePrefs("User Risk Config")} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">Guardar Cambios</button>
                        <button onClick={() => setUserConfig(DEFAULT_USER_RISK_CONFIG)} className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition-colors">Restaurar</button>
                    </div>
                </Card>

                <Card className="border border-light-border dark:border-gray-700/50">
                    <div className="flex items-center mb-4">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-brand-gold mr-3"/>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configuración de Estrategia para IA</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Perfil de la IA</label>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Afecta cómo la IA decide cuándo y cuánto operar.</p>
                            <div className="flex flex-col gap-2">
                                {(['Conservador', 'Medio', 'Agresivo', 'Personalizado'] as AIStrategyConfig['profile'][]).map(profile => (
                                    <button key={profile} onClick={() => setSettings(prev => ({...prev, aiConfig: { ...prev.aiConfig, profile }}))} className={`w-full text-left p-3 rounded-md border-2 transition-all ${profile === settings.aiConfig.profile ? 'bg-brand-gold/20 border-brand-gold' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}>
                                        <span className={`${profile === settings.aiConfig.profile ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{profile}</span>
                                        {profile === 'Conservador' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prioriza la preservación del capital con operaciones de bajo riesgo y alta probabilidad.</p>}
                                        {profile === 'Medio' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Busca un equilibrio entre crecimiento y riesgo, operando en señales claras.</p>}
                                        {profile === 'Agresivo' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Apunta a mayores retornos aceptando mayor riesgo y operando en señales más especulativas.</p>}
                                        {profile === 'Personalizado' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define manualmente los parámetros de la IA (próximamente).</p>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {settings.aiConfig.profile === 'Personalizado' && (
                             <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                La configuración personalizada estará disponible en una futura actualización.
                            </div>
                        )}
                    </div>
                     <div className="mt-6 flex gap-2">
                        <button onClick={() => handleSavePrefs("AI Strategy Config")} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">Guardar Cambios</button>
                        <button onClick={() => setSettings(prev => ({...prev, aiConfig: DEFAULT_AI_STRATEGY_CONFIG}))} className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition-colors">Restaurar</button>
                    </div>
                </Card>
            </div>
            
            <Card className="border border-light-border dark:border-gray-700/50">
                <div className="flex items-center mb-4">
                    <BellAlertIcon className="w-6 h-6 text-brand-gold mr-3"/>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('notificationManagement')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                            <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-300">{t('pushNotifications')}</label>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{t('enablePushAlerts')}</p>
                            </div>
                            <ToggleSwitch checked={settings.notificationConfig.pushEnabled} onChange={c => handleNotificationConfigChange('pushEnabled', c)}/>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                           <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-300">{t('soundAlerts')}</label>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{t('enableSoundForNotifications')}</p>
                            </div>
                            <ToggleSwitch checked={settings.sounds} onChange={c => handleGlobalPrefsChange('sounds', c)}/>
                        </div>
                        <div>
                            <label className="font-semibold text-gray-700 dark:text-gray-300">{t('alertOn')}</label>
                             <div className="mt-2 space-y-2">
                                <label className="flex items-center gap-2"><input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-brand-gold focus:ring-brand-gold" checked={settings.notificationConfig.triggers.highConfidenceAI} onChange={e => handleNotificationSubChange('triggers', 'highConfidenceAI', e.target.checked)} /><span>{t('highConfidenceSignals')}</span></label>
                                <label className="flex items-center gap-2"><input type="checkbox" className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-brand-gold focus:ring-brand-gold" checked={settings.notificationConfig.triggers.significantMoves} onChange={e => handleNotificationSubChange('triggers', 'significantMoves', e.target.checked)} /><span>{t('significantMarketMoves')}</span></label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('externalIntegrations')}</h4>
                         <div className="space-y-3">
                             <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                                <label className="font-semibold text-gray-700 dark:text-gray-300">{t('connectWhatsApp')}</label>
                                <ToggleSwitch checked={settings.notificationConfig.integrations.whatsApp.enabled} onChange={c => handleNotificationSubChange('integrations', 'whatsApp', { ...settings.notificationConfig.integrations.whatsApp, enabled: c })}/>
                            </div>
                            {settings.notificationConfig.integrations.whatsApp.enabled && <input type="text" placeholder={t('phoneNumber')} value={settings.notificationConfig.integrations.whatsApp.number} onChange={e => handleNotificationSubChange('integrations', 'whatsApp', { ...settings.notificationConfig.integrations.whatsApp, number: e.target.value })} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold"/>}
                            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                                <label className="font-semibold text-gray-700 dark:text-gray-300">{t('connectTelegram')}</label>
                                <ToggleSwitch checked={settings.notificationConfig.integrations.telegram.enabled} onChange={c => handleNotificationSubChange('integrations', 'telegram', { ...settings.notificationConfig.integrations.telegram, enabled: c })}/>
                            </div>
                            {settings.notificationConfig.integrations.telegram.enabled && <input type="text" placeholder={t('username')} value={settings.notificationConfig.integrations.telegram.username} onChange={e => handleNotificationSubChange('integrations', 'telegram', { ...settings.notificationConfig.integrations.telegram, username: e.target.value })} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold"/>}
                         </div>
                    </div>
                </div>
            </Card>

             <Card className="border border-light-border dark:border-gray-700/50">
                <div className="flex items-center mb-4">
                    <CodeBracketIcon className="w-6 h-6 text-brand-gold mr-3"/>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('githubIntegration')}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">Conecta un repositorio de GitHub para almacenar los reportes semanales de la IA, permitiendo su aprendizaje y evolución continua.</p>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{t('githubToken')}</label>
                        <input type="password" placeholder="ghp_..." value={settings.githubConfig.token} onChange={e => handleGitHubConfigChange('token', e.target.value)} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                    </div>
                     <div>
                        <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{t('repoUrl')}</label>
                        <input type="text" placeholder="https://github.com/user/repo" value={settings.githubConfig.repoUrl} onChange={e => handleGitHubConfigChange('repoUrl', e.target.value)} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                    </div>
                     <div>
                        <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{t('branchName')}</label>
                        <input type="text" placeholder="main" value={settings.githubConfig.branch} onChange={e => handleGitHubConfigChange('branch', e.target.value)} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                    </div>
                </div>
                 <div className="mt-6 flex gap-2">
                    <button onClick={() => handleSavePrefs("GitHub Config")} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">{t('save')}</button>
                    <button onClick={() => handleGitHubConfigChange('token', '')} className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition-colors">{t('restore')}</button>
                </div>
            </Card>

             <Card className="border border-light-border dark:border-gray-700/50">
                <div className="flex items-center mb-4">
                    <GlobeAltIcon className="w-6 h-6 text-brand-gold mr-3"/>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('globalSettingsTitle')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {renderSelect(t('language'), settings.language, (v) => handleGlobalPrefsChange('language', v), ['English', 'Español', 'Français', 'Italiano', 'Deutsch', '日本語', 'العربية'])}
                    
                    <div>
                         <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{t('visualTheme')}</label>
                         <div className="flex gap-2">
                             <button onClick={() => handleGlobalPrefsChange('theme', 'Dark')} className={`w-full py-1.5 rounded-md ${settings.theme === 'Dark' ? 'bg-brand-gold text-black font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>{t('dark')}</button>
                             <button onClick={() => handleGlobalPrefsChange('theme', 'Light')} className={`w-full py-1.5 rounded-md ${settings.theme === 'Light' ? 'bg-brand-gold text-black font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>{t('light')}</button>
                         </div>
                    </div>

                    {renderSelect(t('timezone'), settings.timezone, (v) => handleGlobalPrefsChange('timezone', v), ['UTC-5', 'UTC-8', 'UTC', 'UTC+1', 'UTC+2'])}
                    
                    {renderSelect(t('baseCurrency'), settings.baseCurrency, (v) => handleGlobalPrefsChange('baseCurrency', v), ['USD', 'EUR', 'JPY'])}

                     <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                        <label className="font-semibold text-gray-700 dark:text-gray-300">{t('showTooltips')}</label>
                        <ToggleSwitch checked={settings.tooltips} onChange={c => handleGlobalPrefsChange('tooltips', c)}/>
                    </div>

                    <div>
                         <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">{t('fontSize')}</label>
                         <div className="flex gap-2">
                            {(['Small', 'Medium', 'Large'] as const).map(size => (
                               <button key={size} onClick={() => handleGlobalPrefsChange('fontSize', size)} className={`w-full py-1.5 rounded-md ${settings.fontSize === size ? 'bg-brand-gold text-black font-bold' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>{t(size.toLowerCase() as TranslationKey)}</button>
                            ))}
                         </div>
                    </div>
                </div>
                 <div className="mt-6 flex gap-2">
                    <button onClick={() => handleSavePrefs("Global Preferences")} className="w-full bg-brand-gold text-black font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">{t('savePreferences')}</button>
                    <button onClick={() => setSettings(prev => ({...prev, ...DEFAULT_GLOBAL_PREFS}))} className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition-colors">{t('restoreDefaults')}</button>
                </div>
            </Card>
        </div>
    );
};

export default SettingsView;