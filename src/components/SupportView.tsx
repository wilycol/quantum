
import React, { useState, useMemo, useCallback } from 'react';
import Card from './ui/Card';
import { useSettings } from '../contexts/SettingsContext';
import { MOCK_FAQS } from '../constants';
import { FAQItem } from '../types';
import { getSupportChatResponse } from '../services/geminiService';

// --- ICONS ---
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>);
const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>);


const FAQAccordion: React.FC<{ faq: FAQItem }> = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-300 dark:border-gray-700 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{faq.question}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-2 text-gray-600 dark:text-gray-400 prose prose-sm max-w-none">
                    <p>{faq.answer}</p>
                </div>
            )}
        </div>
    );
};

const SupportView: React.FC = () => {
    const { t } = useSettings();
    const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'docs'>('faq');
    const [faqCategory, setFaqCategory] = useState<FAQItem['category'] | 'All'>('All');
    
    // Contact Form State
    const [contactForm, setContactForm] = useState({ name: 'Helios Cypher', email: 'helios.cypher@example.com', subject: '', message: '' });
    
    // AI Chatbot State
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const filteredFaqs = useMemo(() => {
        if (faqCategory === 'All') return MOCK_FAQS;
        return MOCK_FAQS.filter(faq => faq.category === faqCategory);
    }, [faqCategory]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Support ticket submitted!\nSubject: ${contactForm.subject}\n\nWe will get back to you shortly. Estimated response time: 24 hours.`);
        setContactForm(prev => ({ ...prev, subject: '', message: '' }));
    };
    
    const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatQuestion.trim()) return;
        
        setIsChatLoading(true);
        setChatResponse('');
        try {
            const response = await getSupportChatResponse(chatQuestion, MOCK_FAQS);
            setChatResponse(response);
        } catch (error) {
            setChatResponse("Sorry, I couldn't get a response from the AI. Please try again or use the contact form.");
        } finally {
            setIsChatLoading(false);
        }
    }, [chatQuestion]);

    const renderContent = () => {
        switch (activeTab) {
            case 'contact':
                return (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('yourName')}</label>
                            <input type="text" id="name" name="name" value={contactForm.name} onChange={handleFormChange} required className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('emailAddress')}</label>
                            <input type="email" id="email" name="email" value={contactForm.email} onChange={handleFormChange} required className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('subject')}</label>
                            <input type="text" id="subject" name="subject" value={contactForm.subject} onChange={handleFormChange} required className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold" />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('message')}</label>
                            <textarea id="message" name="message" value={contactForm.message} onChange={handleFormChange} required rows={5} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-brand-gold text-black font-bold py-2.5 rounded-lg hover:bg-amber-400 transition-colors">{t('sendRequest')}</button>
                    </form>
                );
            case 'docs':
                return (
                    <div className="space-y-4">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📚 Documentación Completa</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Accede a toda la documentación técnica y estratégica de QuantumTrade</p>
                        </div>
                        
                        <a href="/docs/business_plan.html" target="_blank" className="flex items-center gap-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <BookOpenIcon className="w-8 h-8 text-brand-gold" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">📊 Business Plan</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Plan de negocios, monetización y roadmap estratégico</p>
                            </div>
                        </a>
                        
                        <a href="/docs/marketing_strategy.html" target="_blank" className="flex items-center gap-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <BookOpenIcon className="w-8 h-8 text-brand-gold" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">🎯 Marketing Strategy</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Estrategia de marketing y go-to-market</p>
                            </div>
                        </a>
                        
                        <a href="/docs/technical_specification.html" target="_blank" className="flex items-center gap-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <BookOpenIcon className="w-8 h-8 text-brand-gold" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">⚙️ Technical Specification</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Especificaciones técnicas y arquitectura del sistema</p>
                            </div>
                        </a>
                        
                        <a href="/docs/ui_guide.html" target="_blank" className="flex items-center gap-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <BookOpenIcon className="w-8 h-8 text-brand-gold" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">🎨 UI & Functionality Guide</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Guía completa de interfaz y funcionalidades</p>
                            </div>
                        </a>
                        
                        <a href="/docs/security_compliance.html" target="_blank" className="flex items-center gap-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <BookOpenIcon className="w-8 h-8 text-brand-gold" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">🔒 Security & Compliance</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Compilación de seguridad y cumplimiento</p>
                            </div>
                        </a>
                        
                        {/* Documentación Legal */}
                        <div className="border-t border-gray-300 dark:border-gray-700 pt-4 mt-6">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">📋 Documentación Legal</h4>
                            
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'legal' } }))}
                                className="w-full flex items-center gap-4 p-4 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                                <BookOpenIcon className="w-8 h-8 text-emerald-600" />
                                <div className="text-left">
                                    <h4 className="font-bold text-gray-900 dark:text-white">⚖️ Términos Legales & Privacidad</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Aviso legal, términos de uso y política de privacidad</p>
                                </div>
                            </button>
                        </div>
                    </div>
                );
            case 'faq':
            default:
                return (
                    <div className="space-y-6">
                        <Card className="bg-gray-200/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700">
                             <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-brand-gold"/> {t('askOurAi')}</h4>
                             <form onSubmit={handleChatSubmit} className="flex gap-2">
                                <input type="text" value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder={t('askAQuestion')} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold text-sm"/>
                                <button type="submit" disabled={isChatLoading} className="bg-brand-gold p-2 rounded-md text-black hover:bg-amber-400 disabled:opacity-50">
                                    {isChatLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div> : <PaperAirplaneIcon className="w-5 h-5"/>}
                                </button>
                             </form>
                             {chatResponse && (
                                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                                    <p>{chatResponse}</p>
                                </div>
                             )}
                        </Card>
                        
                        {/* Acceso Rápido a Documentación Legal */}
                        <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">⚖️ Documentación Legal</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Accede a términos legales y política de privacidad</p>
                                </div>
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'legal' } }))}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                                >
                                    Ver Términos
                                </button>
                            </div>
                        </Card>
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(['All', 'General', 'Trading', 'AI', 'Portfolio', 'Security'] as const).map(cat => (
                                    <button key={cat} onClick={() => setFaqCategory(cat)} className={`px-3 py-1.5 text-xs font-semibold rounded-full ${faqCategory === cat ? 'bg-brand-gold text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                        {t(cat.toLowerCase() as any) || cat}
                                    </button>
                                ))}
                            </div>
                            <div>{filteredFaqs.map(faq => <FAQAccordion key={faq.id} faq={faq} />)}</div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2">
                <Card>
                    <div className="border-b border-gray-300 dark:border-gray-700 mb-4">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('faq')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'faq' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('faqsAndChat')}</button>
                            <button onClick={() => setActiveTab('contact')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'contact' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('contactSupport')}</button>
                            <button onClick={() => setActiveTab('docs')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'docs' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}>{t('documentation')}</button>
                        </nav>
                    </div>
                    {renderContent()}
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{t('quickContact')}</h3>
                    <div className="space-y-3">
                         <a href="#" className="flex items-center gap-3 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <img src="https://cdn.worldvectorlogo.com/logos/whatsapp-icon.svg" alt="WhatsApp" className="w-6 h-6"/>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">WhatsApp</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <img src="https://cdn.worldvectorlogo.com/logos/telegram-2.svg" alt="Telegram" className="w-6 h-6"/>
                             <span className="font-semibold text-gray-800 dark:text-gray-200">Telegram</span>
                        </a>
                         <a href="#" className="flex items-center gap-3 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <img src="https://cdn.worldvectorlogo.com/logos/discord-6.svg" alt="Discord" className="w-6 h-6"/>
                             <span className="font-semibold text-gray-800 dark:text-gray-200">Discord</span>
                        </a>
                    </div>
                </Card>
                 <Card>
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{t('ticketStatus')}</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder={t('enterTicketId')} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-gold text-sm"/>
                        <button className="bg-gray-700 text-white font-semibold px-4 rounded-md hover:bg-gray-600 transition-colors text-sm">{t('check')}</button>
                    </div>
                 </Card>
            </div>
        </div>
    );
};

export default SupportView;
