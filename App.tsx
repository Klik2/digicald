
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CalendarType, CalendarViewFormat, CalendarPeriod, CalendarContentMode, AiOptionsData, AppSettings, LANGUAGES, COUNTRIES, CustomEvent, Task, AI_GENERATORS, MediaItem } from './types';
import { getMonthData, getFormattedDateString, fetchHolidays, getNativeDateDigit, exportToICS } from './utils/calendarLogic';
import { generateCalendarImage } from './services/geminiService';

// --- Text Content Constants ---
const guideContent = `
**DIGICALD User Guide**

**1. Main Dashboard**
- **Calendar Types**: Select from various calendar systems (Gregorian, Hijri, Javanese, etc.) from the main menu.
- **Settings**: Access settings via the gear icon to change themes, language, and zoom.

**2. Calendar View**
- **Navigation**: Use the 'Prev' and 'Next' buttons to navigate months.
- **Details**: Click on a date to see tasks and specific details (Weton, etc.).
- **Events**: Add events by clicking the '+' button on a date cell.

**3. Features**
- **AI Builder**: Generate custom calendar backgrounds using the AI Template Builder.
- **Tasks**: Manage your daily tasks with reminders.
- **Export**: Export your calendar data to ICS format.
`;

const termsContent = `
**Terms of Service**

1. **Acceptance**: By using DIGICALD, you agree to these terms.
2. **Usage**: The app is for personal use. Do not misuse the AI generation features.
3. **Data**: Your data is stored locally. We are not responsible for data loss.

**Privacy Policy**

- **Local Storage**: We use LocalStorage to save your settings and tasks.
- **No Tracking**: We do not track your usage or collect personal information.
`;

const faqContent = `
**FAQ**

**Q: Is it free?**
A: Yes, DIGICALD is completely free.

**Q: Can I use it offline?**
A: Yes, install the PWA version for offline access.

**Q: How do I change the language?**
A: Use the flag icon in the header to switch languages.

**Q: Who made this?**
A: Created by Te_eR Inovative.
`;

// --- Assets ---
const ASSETS = {
    ICON_SETTINGS: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD_icon_stg.png?raw=true",
    ICON_GREGORIAN: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_grg.png?raw=true",
    ICON_HIJRI: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_hijr.png?raw=true",
    ICON_JAVA: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_java.png?raw=true",
    ICON_CHINESE: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_Chinese.png?raw=true",
    ICON_BAZI: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_bazi.png?raw=true",
    ICON_JAPAN: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_japan.png?raw=true",
    ICON_KOREAN: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_korean.png?raw=true",
    ICON_THAI: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_thai.png?raw=true",
    ICON_IRAN: "https://github.com/vandratop/Yuk/blob/17832c2f74458a61a7e05bafd84e78a8d6acecb4/DGCALD/DIGICALD-Sub-page_10.png?raw=true",
};

// --- Types for Global Window ---
declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: any;
    deferredPrompt?: any;
  }
}

// --- Starfield Component ---
const Starfield = () => {
    // Generates stars and comets using CSS animations
    return (
        <div className="starfield">
            {/* Generate stars */}
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={`star-${i}`}
                    className="star"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 2 + 1}px`,
                        height: `${Math.random() * 2 + 1}px`,
                        '--duration': `${Math.random() * 3 + 2}s`
                    } as any}
                />
            ))}
            {/* Generate comets */}
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={`comet-${i}`}
                    className="comet"
                    style={{
                        top: `${Math.random() * 50}%`,
                        left: `${Math.random() * 50}%`,
                        animationDelay: `${Math.random() * 5}s`
                    } as any}
                />
            ))}
        </div>
    );
};

// --- Tutorial Overlay Component ---
const TutorialOverlay = ({ isOpen, onClose }: any) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = [
        { id: 'app-title', text: "Welcome to DIGICALD 2.0! \nYour ultimate Cyberpunk Digital Calendar Universe." },
        { id: 'menu-btn', text: "Access different calendars (Hijri, Javanese, etc.) and information here." },
        { id: 'settings-btn', text: "Customize themes, zoom level, and language settings." },
        { id: 'install-btn', text: "Install DIGICALD as a PWA for offline access." },
        { id: 'ai-btn', text: "Create amazing visuals using our AI Template Builder." },
    ];

    useEffect(() => {
        if (!isOpen) return;
        const updateRect = () => {
            const el = document.getElementById(steps[step].id);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found (e.g. hidden), skip
                if (step < steps.length - 1) setStep(s => s + 1);
            }
        };
        // Small delay to ensure rendering
        setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [step, isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center transition-all duration-500">
            {/* Spotlight Hole */}
            {targetRect && (
                <div 
                    className="absolute border-2 border-cyan-500 shadow-[0_0_50px_#06b6d4] rounded-lg transition-all duration-500 ease-in-out box-content pointer-events-none"
                    style={{
                        top: targetRect.top - 10,
                        left: targetRect.left - 10,
                        width: targetRect.width + 20,
                        height: targetRect.height + 20,
                    }}
                />
            )}
            
            <div className="relative bg-[#0f172a] border border-cyan-500 p-6 rounded-xl max-w-sm text-center shadow-2xl neon-border animate-fade-in-up mt-20">
                <div className="absolute -top-3 -left-3 bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded">
                    Step {step + 1}/{steps.length}
                </div>
                <h3 className="text-xl font-fredoka text-cyan-400 mb-2">SYSTEM GUIDE</h3>
                <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">{steps[step].text}</p>
                <div className="flex justify-between gap-4">
                    <button onClick={onClose} className="text-gray-500 text-xs hover:text-white">Skip</button>
                    <button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-bold shadow-[0_0_10px_#06b6d4]">
                        {step === steps.length - 1 ? "Finish" : "Next >>"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Background Component ---
const Background = ({ isDark, themeName, showStars }: { isDark: boolean, themeName?: string, showStars?: boolean }) => {
  if (!isDark) {
    return (
        <div className="fixed inset-0 z-[-1] bg-gray-100 overflow-hidden no-print">
             <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        </div>
    );
  }

  let bgImage = "https://picsum.photos/id/903/1920/1080";
  switch(themeName) {
      case 'hijri': bgImage = "https://img.freepik.com/free-vector/gradient-islamic-pattern-background_23-2149122822.jpg"; break;
      case 'javanese': bgImage = "https://img.freepik.com/free-vector/traditional-batik-pattern-background_53876-116346.jpg"; break;
      case 'chinese': bgImage = "https://img.freepik.com/free-vector/chinese-new-year-pattern-background_53876-116347.jpg"; break;
      case 'bazi': bgImage = "https://img.freepik.com/free-vector/chinese-style-pattern-background_53876-116348.jpg"; break;
      case 'japan': bgImage = "https://img.freepik.com/free-vector/japanese-wave-pattern-background_53876-116349.jpg"; break;
      case 'korean': bgImage = "https://img.freepik.com/free-vector/korean-traditional-pattern-background_53876-116350.jpg"; break;
      case 'thai': bgImage = "https://img.freepik.com/free-vector/thai-pattern-background_53876-116351.jpg"; break;
      case 'iranian': bgImage = "https://img.freepik.com/free-vector/persian-pattern-background_53876-116352.jpg"; break;
      case 'hindi': bgImage = "https://img.freepik.com/free-vector/indian-mandala-pattern-background_53876-116353.jpg"; break;
      default: bgImage = "https://picsum.photos/id/903/1920/1080";
  }

  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden transition-colors duration-500 no-print">
        <div className="absolute inset-0 bg-cover bg-center opacity-50 transition-all duration-1000" style={{backgroundImage: `url('${bgImage}')`}}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80"></div>
        {showStars && <Starfield />}
    </div>
  );
};

// --- Header ---
const Header = ({ onToggleMenu, onToggleSettings, onToggleLanguage, subPageTitle, onBack, isDark, isMenuOpen, isLangMenuOpen, installPwa }: any) => (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b h-16 flex items-center justify-between px-4 transition-colors duration-300 no-print ${isDark ? 'glass-panel border-cyan-500/30' : 'bg-white/90 border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-4 relative">
            {subPageTitle && (
                <button onClick={onBack} className="text-2xl hover:scale-110 transition-transform" title="Back">🔙</button>
            )}
            <button id="menu-btn" onClick={onToggleMenu} className={`p-2 transition-colors ${isDark ? 'text-cyan-400 hover:text-white' : 'text-gray-700 hover:text-black'} ${isMenuOpen ? 'bg-white/10 rounded-full' : ''}`} title="Menu">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button id="install-btn" onClick={installPwa} className="text-2xl hover:scale-110 transition-transform p-1 animate-pulse" title="Install App">
                📥
            </button>
        </div>
        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
            {subPageTitle ? (
                    <h1 className={`text-xl md:text-2xl font-fredoka font-bold tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`} data-text={subPageTitle}>{subPageTitle}</h1>
            ) : (
                <h1 id="app-title" className="text-3xl font-fredoka text-[#00594C] font-bold" data-text="DIGICALD">DIGICALD</h1>
            )}
        </div>
        <div className="flex items-center gap-2 relative">
            <button onClick={onToggleLanguage} className={`text-2xl hover:scale-110 transition-transform p-1 rounded ${isLangMenuOpen ? 'bg-white/10' : ''}`} title="Translate / Language">🇬🇧</button>
            <button id="settings-btn" onClick={onToggleSettings} className="p-2 transition-colors" title="Settings">
                <img src={ASSETS.ICON_SETTINGS} alt="Settings" className="w-8 h-8 animate-spin-slow" />
            </button>
        </div>
    </header>
);

// --- Menus ---
const MainMenu = ({ isOpen, onClose, onViewChange, onShowGuide, onShowTerms, onShowFAQ, onShowContact, onShowFindUs }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute top-16 left-4 z-[250] bg-[#0f172a] border border-cyan-500 rounded-lg p-2 w-56 shadow-xl neon-border animate-fade-in">
            <div className="mb-2 pb-2 border-b border-gray-700">
                <button onClick={() => { onShowGuide(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">📖 User Guide</button>
                <button onClick={() => { onShowTerms(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">📜 Terms & Policy</button>
                <button onClick={() => { onShowFAQ(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">❓ FAQ</button>
                <button onClick={() => { onShowContact(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">✉️ Contact Us</button>
                <button onClick={() => { onShowFindUs(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">🔍 Find Us</button>
            </div>
            <div className="text-xs text-gray-500 px-2 pt-1 font-bold">Calendars</div>
            {[
                { type: CalendarType.GREGORIAN, label: 'Gregorian' },
                { type: CalendarType.HIJRI, label: 'Hijri' },
                { type: CalendarType.JAVANESE, label: 'Javanese' },
                { type: CalendarType.CHINESE, label: 'Chinese' },
            ].map(item => (
                <button 
                    key={item.type} 
                    onClick={() => { onViewChange(item.type); onClose(); }} 
                    className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded transition-colors"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

const SettingsMenu = ({ isOpen, onClose, settings, onUpdate, onLogout, onPrintPreview, toggleFullscreen, onExport }: any) => {
    if (!isOpen) return null;
    
    const [showShareMenu, setShowShareMenu] = useState(false);

    return (
        <div className="fixed top-16 right-4 z-[250] bg-[#0f172a] border border-cyan-500 rounded-lg p-4 w-72 shadow-xl text-white neon-border no-print animate-fade-in max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                 <h3 className="text-cyan-400 font-bold font-fredoka">SYSTEM CONFIG</h3>
                 <button onClick={onClose} className="text-red-500 font-bold text-lg hover:text-red-400" title="Close">[X]</button>
             </div>
             
             {/* Zoom Controls */}
             <div className="mb-4 bg-gray-800 p-2 rounded border border-gray-700">
                 <label className="text-xs text-gray-400 font-bold block mb-1">ZOOM LEVEL</label>
                 <div className="flex justify-between items-center">
                     <button onClick={() => onUpdate({...settings, zoom: Math.max(0.5, settings.zoom - 0.1)})} className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600">-</button>
                     <span className="text-xs font-mono">{Math.round(settings.zoom * 100)}%</span>
                     <button onClick={() => onUpdate({...settings, zoom: Math.min(1.5, settings.zoom + 0.1)})} className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600">+</button>
                 </div>
             </div>

             <button onClick={toggleFullscreen} className="cyber-button w-full rounded p-2 text-xs font-bold mb-4 flex items-center justify-center gap-2">
                 <span>⛶</span> {settings.isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN MODE'}
             </button>

             <div className="mb-4 relative">
                <button onClick={() => setShowShareMenu(!showShareMenu)} className="cyber-button w-full rounded p-2 text-xs font-bold flex justify-between items-center">
                    SHARE & PRINT <span>▼</span>
                </button>
                {showShareMenu && (
                    <div className="absolute top-full left-0 w-full bg-gray-900 border border-gray-600 rounded mt-1 z-10 max-h-60 overflow-y-auto">
                         <div className="p-2 text-[10px] font-bold text-gray-400">VERTICAL DATA</div>
                         <button onClick={() => { onPrintPreview('vertical-daily'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Daily Calendar</button>
                         <button onClick={() => { onPrintPreview('vertical-monthly'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Monthly Calendar</button>
                         <button onClick={() => { onPrintPreview('vertical-yearly'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Yearly Calendar</button>
                         
                         <div className="p-2 text-[10px] font-bold text-gray-400 border-t border-gray-700">HORIZONTAL DATA</div>
                         <button onClick={() => { onPrintPreview('horizontal-daily'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Daily Calendar</button>
                         <button onClick={() => { onPrintPreview('horizontal-monthly'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Monthly Calendar</button>
                         <button onClick={() => { onPrintPreview('horizontal-yearly'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Yearly Calendar</button>

                         <div className="p-2 text-[10px] font-bold text-gray-400 border-t border-gray-700">TASK LOGS</div>
                         <button onClick={() => { onPrintPreview('task-daily'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Daily Tasks</button>
                         <button onClick={() => { onPrintPreview('task-monthly'); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Monthly Tasks</button>

                         <div className="p-2 text-[10px] font-bold text-gray-400 border-t border-gray-700">BACKUP</div>
                         <button onClick={() => { onExport(); onClose(); }} className="w-full text-left p-2 hover:bg-gray-700 text-xs">Export ICS Data</button>
                    </div>
                )}
             </div>

             <div className="mb-4">
                 <label className="text-xs text-gray-400 font-bold block mb-1">INTERFACE THEME</label>
                 <div className="flex bg-gray-800 rounded p-1">
                     {['light', 'auto', 'dark'].map(mode => (
                         <button 
                            key={mode} 
                            onClick={() => onUpdate({...settings, theme: mode})} 
                            className={`flex-1 text-[10px] py-1 rounded capitalize transition-all ${settings.theme === mode ? 'bg-cyan-600 text-white shadow' : 'text-gray-400'}`}
                         >
                             {mode}
                         </button>
                     ))}
                 </div>

                 <label className="text-xs text-gray-400 font-bold block mt-3 mb-1">TASK HIGHLIGHT</label>
                 <div className="flex gap-2 items-center">
                     <input type="color" value={settings.taskHighlightColor || '#FFFF00'} onChange={(e) => onUpdate({...settings, taskHighlightColor: e.target.value})} className="bg-transparent h-6 w-6 border-none cursor-pointer" />
                     <span className="text-xs text-gray-500 font-mono">{settings.taskHighlightColor || '#FFFF00'}</span>
                 </div>

                 <label className="text-xs text-gray-400 block mt-3">REGION THEME</label>
                 <div className="grid grid-cols-3 gap-2 mt-1">
                     {['hijri','javanese','chinese','bazi','japan','korean','thai','iranian','hindi'].map(t => (
                         <button key={t} onClick={() => onUpdate({...settings, themeName: t})} className={`text-[10px] py-1 border rounded capitalize ${settings.themeName===t?'bg-purple-600 border-purple-400':'bg-gray-800 border-gray-600'}`}>{t}</button>
                     ))}
                 </div>
             </div>
             
             <button onClick={onLogout} className="w-full bg-red-900/80 hover:bg-red-700 text-white text-xs py-2 rounded mt-2 font-bold border border-red-500">LOGOUT SYSTEM</button>
        </div>
    );
};

// ... (LanguageMenu, TaskModal, EventModal, ImageResultModal, TextModal, ContactModal, FindUsModal, PrintPreviewModal remain mostly the same, minor refactoring included if needed)
const LanguageMenu = ({ isOpen, onClose, currentLang, onLangChange }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute top-16 right-16 z-[250] bg-[#0f172a] border border-cyan-500 rounded-lg p-2 w-48 shadow-xl neon-border animate-fade-in max-h-[60vh] overflow-y-auto">
            {LANGUAGES.map(lang => (
                <button 
                    key={lang.code} 
                    onClick={() => { onLangChange(lang.code); onClose(); }} 
                    className={`w-full text-left p-2 hover:bg-cyan-900/50 text-xs rounded transition-colors flex items-center gap-2 ${currentLang === lang.code ? 'text-cyan-400 font-bold' : 'text-white'}`}
                >
                    <span className="text-lg">{lang.flag}</span> {lang.name}
                </button>
            ))}
            <div id="google_translate_element" className="hidden"></div>
        </div>
    );
};

// --- AI Template Builder (Restructured) ---
const AiTemplateBuilder = ({ isOpen, onClose, onImageGenerated }: any) => {
    const [activeTab, setActiveTab] = useState('Ratio');
    const [selections, setSelections] = useState({
        ratio: '16:9', size: '1K', background: 'none', camera: 'none', style: 'none', light: 'none', weather: 'none', time: 'none'
    });
    const [promptText, setPromptText] = useState("");

    useEffect(() => {
        const p = `High quality, ${selections.style === 'none' ? '' : selections.style} image of ${selections.background}, ${selections.weather === 'none' ? '' : selections.weather}, ${selections.time === 'none' ? '' : selections.time}, ${selections.light === 'none' ? '' : selections.light} lighting, ${selections.camera === 'none' ? '' : selections.camera} view`.replace(/\s+/g, ' ').trim();
        setPromptText(p);
    }, [selections]);

    const updateSelection = (key: string, val: string) => setSelections(prev => ({ ...prev, [key]: val }));

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(promptText);
        alert("Prompt copied!");
    };

    const handleExternalGenerate = (url: string) => {
        if(url) window.open(url, '_blank');
    };

    const tabs = ['Ratio', 'Background', 'Camera', 'Style', 'Light', 'Weather', 'Time'];

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4">
             <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-4 w-[80%] max-w-4xl shadow-2xl neon-border flex flex-col max-h-[90vh] overflow-hidden relative">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                     <h3 className="text-xl font-fredoka text-cyan-400">AI TEMPLATE BUILDER</h3>
                     <button onClick={onClose} className="text-red-500 font-bold hover:text-red-400 text-xl">[X]</button>
                 </div>
                 
                 {/* Tabs */}
                 <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-2">
                    {tabs.map(t => (
                        <button 
                            key={t} 
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-1 rounded text-sm font-bold transition-colors ${activeTab === t ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {t}
                        </button>
                    ))}
                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-y-auto mb-4 bg-black/20 p-2 rounded">
                    {activeTab === 'Ratio' && (
                        <div className="flex gap-4 justify-center">
                            {AiOptionsData.ratio.map(r => (
                                <button key={r} onClick={() => updateSelection('ratio', r)} className={`flex flex-col items-center gap-2 p-4 border rounded hover:bg-gray-800 ${selections.ratio === r ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600'}`}>
                                    <div className={`border border-white ${r === '1:1' ? 'w-10 h-10' : r === '16:9' ? 'w-16 h-9' : 'w-9 h-16'}`}></div>
                                    <span className="text-xs">{r}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {activeTab === 'Background' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {AiOptionsData.background.map(b => (
                                <button key={b} onClick={() => updateSelection('background', b)} className={`flex flex-col items-center p-2 border rounded hover:bg-gray-800 ${selections.background === b ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600'}`}>
                                    <div className="w-full h-12 bg-gray-700 mb-1 rounded flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                                    <span className="text-xs capitalize">{b}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {activeTab === 'Camera' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {AiOptionsData.camera.map(c => (
                                <button key={c} onClick={() => updateSelection('camera', c)} className={`flex flex-col items-center p-2 border rounded hover:bg-gray-800 ${selections.camera === c ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600'}`}>
                                    <div className="w-full h-12 bg-gray-700 mb-1 rounded flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                                    <span className="text-xs capitalize">{c}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {['Style', 'Light', 'Weather', 'Time'].includes(activeTab) && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {AiOptionsData[activeTab.toLowerCase() as keyof typeof AiOptionsData]?.map(opt => (
                                <button key={opt} onClick={() => updateSelection(activeTab.toLowerCase(), opt)} className={`px-3 py-1 rounded border text-sm capitalize hover:bg-gray-800 ${selections[activeTab.toLowerCase() as keyof typeof selections] === opt ? 'bg-cyan-600 border-cyan-400' : 'bg-transparent border-gray-600'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>

                 {/* Prompt Display */}
                 <div className="bg-black p-3 rounded border border-gray-700 mb-4">
                    <label className="text-[10px] text-gray-500 block mb-1">GENERATED PROMPT:</label>
                    <textarea 
                        className="w-full h-16 bg-transparent text-cyan-300 text-sm resize-none focus:outline-none font-mono"
                        value={promptText}
                        onChange={e => setPromptText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">Select All & Copy</button>
                    </div>
                 </div>

                 {/* Generator Dropdown */}
                 <div className="flex flex-col items-center gap-2 border-t border-gray-700 pt-4">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Generator external with:</span>
                        <select 
                            onChange={(e) => handleExternalGenerate(e.target.value)}
                            className="bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 cursor-pointer hover:border-cyan-500"
                            defaultValue=""
                        >
                            <option value="" disabled>Select AI Tool...</option>
                            {AI_GENERATORS.map(gen => (
                                <option key={gen.name} value={gen.url}>{gen.name}</option>
                            ))}
                        </select>
                     </div>
                     <p className="text-xs text-gray-400 italic">Note : After your get image, back to "DIGICALD" menu and upload your image</p>
                 </div>
             </div>
        </div>
    );
};

// ... (Other components like ImageResultModal, etc. remain present)
const ImageResultModal = ({ isOpen, onClose, imageSrc, onSave }: any) => {
    if (!isOpen || !imageSrc) return null;
    return (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-4 max-w-3xl w-full shadow-2xl neon-border flex flex-col">
                <div className="relative aspect-video w-full bg-black rounded overflow-hidden mb-4 border border-gray-700">
                    <img src={imageSrc} alt="Generated" className="w-full h-full object-contain" />
                </div>
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">DISCARD</button>
                    <button onClick={onSave} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-[0_0_10px_#22c55e]">USE THIS VISUAL</button>
                </div>
            </div>
        </div>
    );
};

const TextModal = ({ isOpen, onClose, title, content }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 max-w-lg w-full shadow-2xl neon-border animate-fade-in relative">
                 <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-400">[X]</button>
                 <h2 className="text-xl font-fredoka text-cyan-400 mb-4">{title}</h2>
                 <div className="text-gray-300 text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto custom-scrollbar">
                     {content}
                 </div>
            </div>
        </div>
    );
};

const ContactModal = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 max-w-md w-full shadow-2xl neon-border text-center">
                 <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-400">[X]</button>
                 <h2 className="text-xl font-fredoka text-cyan-400 mb-4">CONTACT SIGNAL</h2>
                 <p className="text-gray-300 mb-4">For bugs, feedback, or feature requests:</p>
                 <a href="mailto:support@digicald.com" className="text-cyan-300 hover:text-white underline">support@digicald.com</a>
            </div>
        </div>
    );
};

const FindUsModal = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
             <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 max-w-md w-full shadow-2xl neon-border text-center">
                 <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-400">[X]</button>
                 <h2 className="text-xl font-fredoka text-cyan-400 mb-4">LOCATE US</h2>
                 <p className="text-gray-300 text-sm">We are everywhere in the digital realm.</p>
            </div>
        </div>
    );
};

const PrintPreviewModal = ({ isOpen, onClose, previewType }: any) => {
    if (!isOpen) return null;
    const handlePrint = () => { window.print(); };
    return (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center no-print">
                <h2 className="font-bold">PRINT PREVIEW: {previewType?.toUpperCase()}</h2>
                <div className="flex gap-4">
                    <button onClick={handlePrint} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">PRINT</button>
                    <button onClick={onClose} className="bg-red-600 px-4 py-2 rounded hover:bg-red-500">CLOSE</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-100 text-black">
                <div className="max-w-4xl mx-auto bg-white shadow-lg p-8 min-h-[1000px]">
                    <h1 className="text-3xl font-bold text-center mb-4">DIGICALD REPORT</h1>
                    <p className="text-center text-gray-600 mb-8">{new Date().toLocaleDateString()}</p>
                    <div className="border border-gray-300 p-4 rounded text-center">
                         <p className="italic text-gray-500">Preview content for {previewType} would appear here formatted for A4/Letter.</p>
                         <p className="mt-4">Please use the browser print dialog to save as PDF or print.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskModal = ({ isOpen, onClose, dateStr, tasks, onSaveTask, monthDays, settings }: any) => {
    const [newTask, setNewTask] = useState('');
    const [newTime, setNewTime] = useState('');
    
    if (!isOpen || !dateStr) return null;

    const dayTasks = tasks.filter((t: any) => t.date === dateStr);
    const dayInfo = monthDays.find((d: any) => d.year === parseInt(dateStr.split('-')[0]) && d.month + 1 === parseInt(dateStr.split('-')[1]) && d.day === parseInt(dateStr.split('-')[2]));

    const handleAdd = () => {
        if (!newTask) return;
        const task: Task = {
            id: Date.now().toString(),
            date: dateStr,
            timeSlot: newTime,
            content: newTask,
            isCompleted: false
        };
        onSaveTask([...tasks, task]);
        setNewTask('');
        setNewTime('');
    };

    const toggleTask = (id: string) => {
        const updated = tasks.map((t: any) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
        onSaveTask(updated);
    };

    const deleteTask = (id: string) => {
        const updated = tasks.filter((t: any) => t.id !== id);
        onSaveTask(updated);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
             <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 w-full max-w-md shadow-2xl neon-border h-[80vh] flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                    <div>
                        <h2 className="text-2xl font-tech text-white">{dateStr}</h2>
                        {dayInfo && <p className="text-cyan-400 text-sm font-jannah">{dayInfo.nativeDateStr}</p>}
                    </div>
                    <button onClick={onClose} className="text-red-500 font-bold hover:text-red-400">[X]</button>
                </div>
                <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                    {dayTasks.length === 0 ? (
                        <p className="text-gray-500 text-center italic text-sm mt-10">No tasks log for this cycle.</p>
                    ) : (
                        dayTasks.map((t: any) => (
                            <div key={t.id} className={`flex items-center justify-between p-2 mb-2 rounded border ${t.isCompleted ? 'bg-green-900/20 border-green-700' : 'bg-gray-800 border-gray-700'}`} style={!t.isCompleted && settings.taskHighlightColor ? { borderLeft: `3px solid ${settings.taskHighlightColor}` } : {}}>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleTask(t.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${t.isCompleted ? 'bg-green-500 border-green-500 text-black' : 'border-gray-500'}`}>
                                        {t.isCompleted && '✓'}
                                    </button>
                                    <div>
                                        <p className={`text-sm ${t.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{t.content}</p>
                                        {t.timeSlot && <p className="text-[10px] text-cyan-300">{t.timeSlot}</p>}
                                    </div>
                                </div>
                                <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400 text-xs">DEL</button>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700">
                    <div className="flex gap-2 mb-2">
                        <input type="time" className="bg-gray-800 text-white p-2 rounded border border-gray-600 text-xs w-24" value={newTime} onChange={e => setNewTime(e.target.value)} />
                        <input type="text" placeholder="New Task..." className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm focus:border-cyan-500 outline-none" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    </div>
                    <button onClick={handleAdd} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold text-sm shadow-[0_0_10px_#06b6d4]">ADD TASK LOG</button>
                </div>
             </div>
        </div>
    );
};

const EventModal = ({ isOpen, onClose, onSave }: any) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [color, setColor] = useState('#00ffdf');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!title || !date) return;
        onSave({ id: Date.now().toString(), title, date, time, color });
        setTitle(''); setDate(''); setTime('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 w-full max-w-sm shadow-2xl neon-border">
                <h3 className="text-cyan-400 font-bold font-tech mb-4">ADD EVENT</h3>
                <input type="text" placeholder="Event Title" className="w-full bg-gray-800 text-white p-2 rounded mb-2 border border-gray-600 focus:border-cyan-500 outline-none" value={title} onChange={e => setTitle(e.target.value)} />
                <input type="date" className="w-full bg-gray-800 text-white p-2 rounded mb-2 border border-gray-600 focus:border-cyan-500 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                <input type="time" className="w-full bg-gray-800 text-white p-2 rounded mb-2 border border-gray-600 focus:border-cyan-500 outline-none" value={time} onChange={e => setTime(e.target.value)} />
                <div className="flex items-center gap-2 mb-4">
                    <label className="text-white text-xs">Color:</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="bg-transparent border-none h-8 w-8 cursor-pointer" />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-red-400 hover:text-red-300 text-xs font-bold">CANCEL</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shadow-[0_0_10px_#06b6d4]">SAVE</button>
                </div>
            </div>
        </div>
    );
};

// --- Calendar View ---
const CalendarView = ({ date, setDate, days, onDayClick, isDark, viewFormat, period, contentMode, onAddEventClick, apiHolidays }: any) => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const isYearly = period === CalendarPeriod.YEARLY;
    const isDaily = period === CalendarPeriod.DAILY;

    // Helper to get day class for high contrast in light mode
    const getDayClass = (d: any) => {
        if (!d || d.day === 0) return 'invisible';
        
        // Forced high contrast for light mode
        const lightModeClass = 'bg-white text-black font-extrabold border border-gray-300 shadow-[inset_0_0_1px_rgba(0,0,0,0.2)] hover:bg-gray-100';
        const darkModeClass = 'bg-white/5 text-gray-400 hover:bg-white/10';

        const base = d.day > 0 
            ? (d.isToday ? 'bg-cyan-600 text-white font-bold shadow-md' : (!isDark ? lightModeClass : darkModeClass)) 
            : 'invisible';
            
        // Enhanced red for holidays in light mode
        const holiday = d.isHoliday ? (isDark ? '!text-red-500 font-bold' : '!text-[#D32F2F] !font-black') : '';
        return `${base} ${holiday}`;
    };

    if (isDaily) {
        const selectedData = days.find((d: any) => d.day === date.getDate() && d.month === date.getMonth() && d.year === date.getFullYear()) 
                             || days.find((d: any) => d.day === date.getDate()); 

        if (!selectedData) return <div className="text-center p-10 text-gray-500">Date data unavailable</div>;

        return (
            <div className={`flex flex-col items-center justify-center p-8 border rounded-lg min-h-[400px] w-full h-full ${isDark ? 'border-cyan-500/30 bg-black/40 neon-border' : 'border-gray-400 bg-white shadow-lg'}`}>
                <h2 className={`text-3xl font-jannah mb-2 ${isDark ? 'text-cyan-400' : 'text-black font-bold'}`}>{date.toLocaleDateString('en-US', {weekday:'long'})}</h2>
                <div className={`text-[150px] font-fredoka font-bold leading-none relative ${isDark ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-black'}`}>
                    {selectedData.day}
                </div>
                <div className={`text-4xl font-bold mt-4 font-fredoka ${isDark ? 'text-fuchsia-500' : 'text-purple-700'}`}>{date.getFullYear()}</div>
                <div className="mt-8 text-center">
                    <p className={`text-xl font-jannah ${isDark ? 'text-yellow-400' : 'text-gray-800 font-bold'}`}>{selectedData.nativeDateStr}</p>
                    {selectedData.isHoliday && <p className="text-red-600 font-extrabold mt-2 animate-pulse text-2xl">{selectedData.holidayName}</p>}
                </div>
            </div>
        );
    }

    if (isYearly) {
        const months = Array.from({length: 12}, (_, i) => i);
        
        // Vertical Yearly: 3 columns (3x4 grid)
        // Horizontal Yearly: 4 columns (4x3 grid)
        // Responsive breakpoints: Mobile (1 col) -> Tablet (2 cols) -> Desktop (3 or 4 cols)
        const gridClass = viewFormat === CalendarViewFormat.VERTICAL 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

        return (
            <div className={`grid ${gridClass} gap-4 w-full h-full overflow-y-auto pb-20 custom-scrollbar p-1`}>
                {months.map(m => {
                    const mDate = new Date(date.getFullYear(), m, 1);
                    // Re-fetch logic locally for visual rendering of small months
                    const mDays = getMonthData(date.getFullYear(), m, CalendarType.GREGORIAN, "ID", "en-US", [], [], apiHolidays);
                    return (
                        <div key={m} className={`border p-2 rounded transition-colors ${isDark ? 'border-cyan-500/20 bg-black/40 hover:border-cyan-500/60' : 'border-gray-400 bg-white hover:border-black shadow-sm'}`}>
                            <h4 className={`text-center font-bold mb-2 text-xs uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-black'}`}>{mDate.toLocaleString('default', { month: 'long' })}</h4>
                            <div className="grid grid-cols-7 gap-1">
                                {['S','M','T','W','T','F','S'].map(d => (
                                    <div key={d} className={`text-center text-[9px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-800'}`}>{d}</div>
                                ))}
                                {mDays.map((d, i) => (
                                    <div key={i} className={`aspect-square flex items-center justify-center text-[9px] rounded-sm cursor-default ${getDayClass(d)}`}>
                                        {d.day}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className={`relative p-2 rounded-lg overflow-hidden ${isDark ? 'bg-black/20 border border-cyan-500/30 neon-border' : 'bg-white border border-gray-300'} w-full h-full`}>
             <div className="grid grid-cols-7 gap-1 h-full content-start">
                {weekDays.map(day => (
                    <div key={day} className={`font-jannah font-bold text-center py-1 text-[10px] md:text-xs border-b ${isDark ? 'text-[#00594C] bg-white' : 'text-black bg-gray-200 border-gray-400'}`}>
                        {day}
                    </div>
                ))}
                {days.map((day: any, idx: number) => (
                    <div 
                        key={idx}
                        onClick={() => day.day > 0 && onDayClick(day)}
                        className={`
                            min-h-[50px] md:min-h-[80px] p-1 border flex flex-col items-center justify-start relative cursor-pointer transition-all group
                            ${day.isToday ? 'bg-white text-[#00594C] font-bold shadow-[0_0_10px_white]' : (isDark ? 'text-white border-cyan-500/30 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-black font-bold border-gray-300 hover:bg-gray-100')}
                            ${day.isHoliday ? 'bg-red-900/10' : ''}
                            ${day.day === 0 ? 'invisible' : ''}
                        `}
                    >
                        {day.day > 0 && (
                            <>
                                <span className={`font-jannah font-bold text-sm md:text-lg ${day.isHoliday ? 'text-red-600' : ''}`}>
                                    {contentMode === CalendarContentMode.NATIVE_ONLY ? day.nativeDay : day.day}
                                </span>
                                 {contentMode === CalendarContentMode.DUAL && (
                                    <span className={`text-[9px] mt-1 font-jannah ${isDark ? 'opacity-70' : 'text-gray-600'}`}>{day.nativeDay}</span>
                                )}
                                {day.hasTasks && <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_yellow]" title="Has Tasks"></div>}
                                {day.hasReminders && <div className="absolute top-1 right-4 text-[8px] text-yellow-400 animate-bounce">🔔</div>}
                                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                                    {day.events?.map((e: any, i: number) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: e.color || '#00ffdf', boxShadow: `0 0 5px ${e.color}`}} title={e.title}></div>
                                    ))}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAddEventClick(day); }}
                                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-fuchsia-400 font-bold hover:scale-110"
                                    title="Add Event"
                                >+</button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- App Component ---
function App() {
    const [view, setView] = useState<'main' | 'sub'>('main');
    const [selectedCalendar, setSelectedCalendar] = useState<CalendarType>(CalendarType.GREGORIAN);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const subPageRef = useRef<HTMLDivElement>(null);
    const [format, setFormat] = useState<CalendarViewFormat>(CalendarViewFormat.VERTICAL);
    const [period, setPeriod] = useState<CalendarPeriod>(CalendarPeriod.MONTHLY);
    const [country, setCountry] = useState("ID");
    const [contentMode, setContentMode] = useState<CalendarContentMode>(CalendarContentMode.DUAL);
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showAiBuilder, setShowAiBuilder] = useState(false);
    const [printPreviewType, setPrintPreviewType] = useState<string | null>(null);
    const [showImageResult, setShowImageResult] = useState(false);
    const [generatedImageTemp, setGeneratedImageTemp] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showFindUs, setShowFindUs] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
        const saved = localStorage.getItem('digicald_events');
        return saved ? JSON.parse(saved) : [];
    });
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('digicald_tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
    const [apiHolidays, setApiHolidays] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [appSettings, setAppSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('digicald_settings');
        return saved ? JSON.parse(saved) : { theme: 'auto', zoom: 1, language: 'en-US', isFullscreen: false, taskHighlightColor: '#FFFF00' };
    });
    const [systemTheme, setSystemTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
        mq.addEventListener('change', listener);
        return () => mq.removeEventListener('change', listener);
    }, []);
    const isDark = appSettings.theme === 'auto' ? systemTheme === 'dark' : appSettings.theme === 'dark';
    useEffect(() => {
        if (!isDark) document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
    }, [isDark]);
    useEffect(() => { localStorage.setItem('digicald_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('digicald_events', JSON.stringify(customEvents)); }, [customEvents]);
    useEffect(() => {
        const loadHolidays = async () => {
            const h = await fetchHolidays(date.getFullYear(), country);
            setApiHolidays(h);
        };
        loadHolidays();
    }, [date.getFullYear(), country]);
    useEffect(() => {
        localStorage.setItem('digicald_settings', JSON.stringify(appSettings));
        document.body.style.transform = `scale(${appSettings.zoom})`;
        document.body.style.transformOrigin = 'top center';
    }, [appSettings]);
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('digicald_tutorial_seen');
        if (!hasSeenTutorial && isLoggedIn) {
            setTimeout(() => setShowTutorial(true), 1500);
        }
    }, [isLoggedIn]);

    const handleTutorialClose = () => { setShowTutorial(false); localStorage.setItem('digicald_tutorial_seen', 'true'); };
    const handleLogin = async () => { setIsLoggedIn(true); };
    const handlePWAInstall = () => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); window.deferredPrompt.userChoice.then((choiceResult: any) => { window.deferredPrompt = null; }); } else { alert("App install handled by browser. Check address bar or share menu."); } };
    useEffect(() => { window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.deferredPrompt = e; }); }, []);
    const saveTasksToStorage = (newTasks: Task[]) => { setTasks(newTasks); };
    const handleAddEvent = (newEvent: CustomEvent) => { setCustomEvents([...customEvents, newEvent]); };
    const handleExport = () => { exportToICS(customEvents, apiHolidays); };
    const handleImageGenerated = (img: string) => { setGeneratedImageTemp(img); setShowImageResult(true); };
    const handleSaveImage = () => { if (generatedImageTemp) { const newItem: MediaItem = { type: 'image', url: generatedImageTemp, id: Date.now().toString() }; setMediaList(prev => [...prev, newItem].slice(-3)); setCurrentMediaIndex(prev => prev === 0 && mediaList.length === 0 ? 0 : prev); setGeneratedImageTemp(null); setShowImageResult(false); setShowAiBuilder(false); } };
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; const url = URL.createObjectURL(file); const newItem: MediaItem = { type: file.type.startsWith('video') ? 'video' : 'image', url: url, id: Date.now().toString() }; setMediaList(prev => { const newList = [...prev, newItem]; return newList.length > 3 ? newList.slice(1) : newList; }); setCurrentMediaIndex(mediaList.length); } };
    const days = getMonthData(date.getFullYear(), date.getMonth(), selectedCalendar, country, appSettings.language, customEvents, tasks, apiHolidays);
    const isHorizontal = format === CalendarViewFormat.HORIZONTAL;

    // Logic for showing Starfield: Login, Main Menu, or Gregorian Subpage only.
    // Not on Hijri, Javanese, etc unless requested.
    // The prompt requested visual effects removal from all sub-pages but added specific animation to Gregorian.
    const showStars = !isLoggedIn || view === 'main' || (view === 'sub' && selectedCalendar === CalendarType.GREGORIAN);

    const renderSubPage = () => {
        const today = new Date();
        const todayGregorian = getFormattedDateString(today, CalendarType.GREGORIAN, appSettings.language);
        const todayNative = getFormattedDateString(date, selectedCalendar, appSettings.language);
        const monthNameNative = getFormattedDateString(date, selectedCalendar, appSettings.language).split(',')[0];
        const monthNameGregorian = date.toLocaleDateString(appSettings.language, { month: 'long', year: 'numeric' });
        const holidaysThisMonth = apiHolidays.filter(h => { const hDate = new Date(h.date); return hDate.getMonth() === date.getMonth() && hDate.getFullYear() === date.getFullYear(); });
        const currentMedia = mediaList[currentMediaIndex];

        // Navigation Handlers
        const handlePrev = () => {
            const newDate = new Date(date);
            if (period === CalendarPeriod.DAILY) {
                newDate.setDate(date.getDate() - 1);
            } else {
                newDate.setMonth(date.getMonth() - 1);
            }
            setDate(newDate);
        };

        const handleNext = () => {
            const newDate = new Date(date);
            if (period === CalendarPeriod.DAILY) {
                newDate.setDate(date.getDate() + 1);
            } else {
                newDate.setMonth(date.getMonth() + 1);
            }
            setDate(newDate);
        };

        return (
            <div ref={subPageRef} className={`flex flex-col gap-6 w-full ${isHorizontal ? 'max-w-full' : 'max-w-4xl'} bg-transparent transition-all duration-500`}>
                <div className={`text-center p-4 rounded bg-black/40 backdrop-blur-sm shadow-lg w-full ${isDark ? 'border border-cyan-500/30' : 'border border-gray-400 bg-white/80'}`}>
                        <h2 className={`font-jannah text-[14px] font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Today</h2>
                        <h3 className={`font-jannah text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{todayGregorian}</h3>
                        <h3 className={`font-jannah text-[16px] mt-1 ${isDark ? 'text-[#00FFDF]' : 'text-blue-700 font-bold'}`}>{todayNative}</h3>
                </div>

                {/* Updated Navigation Bar */}
                <div className={`flex justify-between items-center w-full p-[2px] rounded-lg shadow-lg ${isDark ? 'bg-gradient-to-r from-[#00FFDF] via-[#0065AD] to-white' : 'bg-gray-300 border border-gray-400'}`}>
                    <button onClick={handlePrev} className={`px-4 py-2 rounded-l w-16 font-bold font-jannah text-xl flex items-center justify-center transition-colors ${isDark ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
                        &lt;
                    </button>
                    <div className={`flex-1 px-2 font-jannah font-bold h-full flex flex-col items-center justify-center text-center min-h-[50px] ${isDark ? 'bg-white/95 text-black' : 'bg-white text-black'}`}>
                        <span className="text-sm md:text-base">{monthNameNative}</span>
                        <span className="text-xs text-gray-600">{monthNameGregorian}</span>
                    </div>
                    <button onClick={handleNext} className={`px-4 py-2 rounded-r w-16 font-bold font-jannah text-xl flex items-center justify-center transition-colors ${isDark ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
                        &gt;
                    </button>
                </div>
                
                {/* Horizontal Layout Structure - Proportional Sizing */}
                <div className={`flex gap-6 w-full items-start transition-all duration-300 ${isHorizontal ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                    {/* Media Frame */}
                    <div className={`relative group transition-all duration-300 ${isHorizontal ? 'w-full lg:w-1/2 min-h-[300px]' : 'w-full aspect-[16/9]'}`}>
                        <div className={`relative w-full h-full flex items-center justify-center p-2 border-[5px] rounded-lg frame-blink ${isDark ? 'border-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'border-[#00594C]'}`}>
                             <div className={`relative z-10 w-full h-full overflow-hidden rounded flex items-center justify-center ${currentMedia ? '' : 'bg-black/20'}`}>
                                {currentMedia ? (
                                    currentMedia.type === 'video' ? 
                                        <video src={currentMedia.url} className="w-full h-full object-contain" controls autoPlay loop muted /> :
                                        <img src={currentMedia.url} className="w-full h-full object-contain" alt="Frame Content" />
                                ) : (
                                    <div className="text-center opacity-50 flex flex-col items-center p-4">
                                        <p className={isDark ? 'text-white' : 'text-black font-bold'}>Upload Image/Video or Use AI Template</p>
                                        <div className="text-4xl mt-2">🖼️</div>
                                    </div>
                                )}
                                {mediaList.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentMediaIndex(prev => Math.max(0, prev - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80">‹</button>
                                        <button onClick={() => setCurrentMediaIndex(prev => Math.min(mediaList.length - 1, prev + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80">›</button>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                            {mediaList.map((_, idx) => (<div key={idx} className={`w-2 h-2 rounded-full ${idx === currentMediaIndex ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Calendar Content */}
                    <div className={`flex flex-col ${isHorizontal ? 'w-full lg:w-1/2' : 'w-full'} min-h-[300px]`}>
                        <div className="flex-1 w-full">
                            <CalendarView 
                                date={date} setDate={setDate} type={selectedCalendar} days={days} 
                                onDayClick={(day: any) => setSelectedTaskDate(`${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`)} 
                                isDark={isDark} viewFormat={format} period={period} contentMode={contentMode}
                                onAddEventClick={(day: any) => { setIsEventModalOpen(true); }}
                                apiHolidays={apiHolidays}
                            />
                        </div>
                    </div>
                </div>

                {/* Moved Control Menu to Bottom */}
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded w-full transition-all ${isDark ? 'glass-panel' : 'bg-white border border-gray-300'}`}>
                    <div>
                        <label className={`text-[10px] block mb-1 font-bold ${isDark ? 'text-cyan-400' : 'text-black'}`}>Format & Period</label>
                        <select value={`${format}-${period}`} onChange={(e) => { const [f, p] = e.target.value.split('-'); setFormat(f as any); setPeriod(p as any); }} className={`w-full border text-xs rounded p-2 transition-colors ${isDark ? 'bg-black border-gray-600 text-white hover:border-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-400 text-black hover:border-black font-bold'}`}>
                            <optgroup label="Vertical">
                                <option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.DAILY}`}>Vertical Daily</option>
                                <option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.MONTHLY}`}>Vertical Monthly</option>
                                <option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.YEARLY}`}>Vertical Yearly</option>
                            </optgroup>
                            <optgroup label="Horizontal">
                                <option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.DAILY}`}>Horizontal Daily</option>
                                <option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.MONTHLY}`}>Horizontal Monthly</option>
                                <option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.YEARLY}`}>Horizontal Yearly</option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label className={`text-[10px] block mb-1 font-bold ${isDark ? 'text-cyan-400' : 'text-black'}`}>Region</label>
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className={`w-full border text-xs rounded p-2 transition-colors ${isDark ? 'bg-black border-gray-600 text-white hover:border-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-400 text-black hover:border-black font-bold'}`}>
                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className={`text-[10px] block mb-1 font-bold ${isDark ? 'text-cyan-400' : 'text-black'}`}>Data View</label>
                         <select value={contentMode} onChange={(e) => setContentMode(e.target.value as any)} className={`w-full border text-xs rounded p-2 transition-colors ${isDark ? 'bg-black border-gray-600 text-white hover:border-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-400 text-black hover:border-black font-bold'}`}>
                             <option value={CalendarContentMode.DUAL}>Gregorian - {selectedCalendar}</option>
                             <option value={CalendarContentMode.NATIVE_ONLY}>{selectedCalendar} Only</option>
                         </select>
                    </div>
                </div>

                <div className={`w-full border p-2 rounded ${isDark ? 'bg-black/30 border-gray-700' : 'bg-white border-gray-300'}`}>
                    <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-cyan-400' : 'text-black'}`}>Holiday Information ({country})</h4>
                    <div className={`text-xs max-h-20 overflow-y-auto ${isDark ? 'text-white' : 'text-black'}`}>
                        {holidaysThisMonth.length > 0 ? (
                            holidaysThisMonth.map((h, i) => (<p key={i}><span className="text-red-500 font-bold">{h.date}:</span> {h.localName || h.name}</p>))
                        ) : <p className="opacity-50">No holidays this month.</p>}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 py-4 no-print">
                        <label className="cursor-pointer bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform cyber-button text-white" title="Upload Image/Video">
                            <span>⬆️</span> UPLOAD
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                        </label>
                        <button onClick={() => setShowAiBuilder(true)} className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform" title="Generate Prompt"><span>🎨</span> Template prompt</button>
                        <div className="relative group">
                            <button className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-xs font-bold shadow-lg flex items-center gap-2">💾 Save As ▼</button>
                            <div className="absolute top-full left-0 mt-1 w-32 bg-gray-800 rounded shadow-xl hidden group-hover:block z-10">
                                <button className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-700">JPG</button>
                                <button className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-700">PNG</button>
                                <button className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-700">PDF</button>
                            </div>
                        </div>
                </div>
            </div>
        );
    };

    if (!isLoggedIn) {
        return (
             <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <Background isDark={true} showStars={true} />
                <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-cyan-500 shadow-2xl neon-border relative z-10">
                    <h1 className="text-5xl font-fredoka text-white mb-8 neon-text" data-text="DIGICALD">DIGICALD</h1>
                    <p className="text-cyan-400 font-mono text-xs mb-6 tracking-widest">INITIALIZING NEURAL INTERFACE...</p>
                    <button onClick={handleLogin} className="cyber-button w-full text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 mb-4 hover:scale-105">
                        <span className="text-xl">G</span> Login with Google
                    </button>
                    <button onClick={() => { setIsLoggedIn(true); setIsGuest(true); }} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg shadow-lg transition-transform hover:scale-105 text-xs font-mono border border-gray-600">GUEST ACCESS MODE</button>
                    <p className="text-[10px] text-gray-500 mt-2">* login as guest, limit access</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen relative pb-10 transition-colors duration-500 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            <Background isDark={isDark} themeName={appSettings.themeName} showStars={showStars} />
            
            <Header 
                onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} 
                onToggleSettings={() => setIsSettingsOpen(true)} 
                onToggleLanguage={() => setIsLangMenuOpen(!isLangMenuOpen)}
                subPageTitle={view === 'sub' ? selectedCalendar : undefined} 
                onBack={() => setView('main')} 
                isDark={isDark}
                isMenuOpen={isMenuOpen}
                isLangMenuOpen={isLangMenuOpen}
                installPwa={handlePWAInstall}
            />
            
            <MainMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onViewChange={(cal: CalendarType) => { setSelectedCalendar(cal); setView('sub'); }} 
                onShowGuide={() => setShowGuide(true)}
                onShowTerms={() => setShowTerms(true)}
                onShowFAQ={() => setShowFAQ(true)}
                onShowContact={() => setShowContact(true)}
                onShowFindUs={() => setShowFindUs(true)}
            />
            <LanguageMenu isOpen={isLangMenuOpen} onClose={() => setIsLangMenuOpen(false)} currentLang={appSettings.language} onLangChange={(l: string) => setAppSettings({...appSettings, language: l})} />

            <SettingsMenu 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                settings={appSettings} 
                onUpdate={setAppSettings} 
                onLogout={() => { setIsLoggedIn(false); setView('main'); }} 
                onPrintPreview={(type: string) => setPrintPreviewType(type)} 
                toggleFullscreen={() => setAppSettings({...appSettings, isFullscreen: !appSettings.isFullscreen})}
                onExport={handleExport}
            />
            
            {/* All Modals */}
            <TaskModal isOpen={!!selectedTaskDate} onClose={() => setSelectedTaskDate(null)} dateStr={selectedTaskDate} tasks={tasks} onSaveTask={saveTasksToStorage} monthDays={days} settings={appSettings} />
            <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSave={handleAddEvent} />
            <AiTemplateBuilder isOpen={showAiBuilder} onClose={() => setShowAiBuilder(false)} onImageGenerated={handleImageGenerated} />
            <ImageResultModal isOpen={showImageResult} onClose={() => setShowImageResult(false)} imageSrc={generatedImageTemp} onSave={handleSaveImage} />
            <TextModal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Usage Guide" content={guideContent} />
            <TextModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Policy" content={termsContent} />
            <TextModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} title="FAQ" content={faqContent} />
            <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
            <FindUsModal isOpen={showFindUs} onClose={() => setShowFindUs(false)} />
            <PrintPreviewModal isOpen={!!printPreviewType} onClose={() => setPrintPreviewType(null)} previewType={printPreviewType} />
            <TutorialOverlay isOpen={showTutorial} onClose={handleTutorialClose} />

            <main className="pt-20 px-4 container mx-auto flex flex-col gap-6 min-h-[80vh] items-center relative z-10">
                {view === 'sub' && renderSubPage()}
                {view === 'main' && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl animate-fade-in-up">
                         {[
                                { type: CalendarType.GREGORIAN, img: ASSETS.ICON_GREGORIAN },
                                { type: CalendarType.HIJRI, img: ASSETS.ICON_HIJRI },
                                { type: CalendarType.JAVANESE, img: ASSETS.ICON_JAVA },
                                { type: CalendarType.CHINESE, img: ASSETS.ICON_CHINESE },
                                { type: CalendarType.BAZI, img: ASSETS.ICON_BAZI },
                                { type: CalendarType.JAPANESE, img: ASSETS.ICON_JAPAN },
                                { type: CalendarType.KOREAN, img: ASSETS.ICON_KOREAN },
                                { type: CalendarType.THAI, img: ASSETS.ICON_THAI },
                                { type: CalendarType.IRANIAN, img: ASSETS.ICON_IRAN },
                                { type: CalendarType.HINDI, img: ASSETS.ICON_IRAN }, 
                            ].map((item) => (
                                <button 
                                    key={item.type} 
                                    onClick={() => {
                                        if (isGuest && item.type !== CalendarType.GREGORIAN) { alert("Please login first to access this menu"); return; }
                                        setSelectedCalendar(item.type);
                                        setView('sub');
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-105 group ${isDark ? 'glass-panel hover:bg-white/10 hover:neon-border' : 'bg-white shadow hover:shadow-lg border border-gray-100'}`}
                                >
                                    <div className="w-20 h-20 mb-2 relative"><img src={item.img} alt={item.type} className={`w-full h-full object-contain ${isDark ? 'drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]' : ''}`} /></div>
                                    <span className={`text-sm font-fredoka text-center font-bold ${isDark ? 'text-cyan-300 group-hover:neon-text' : 'text-gray-700'}`}>{item.type}</span>
                                </button>
                            ))}
                    </div>
                )}
            </main>
            <footer className="w-full py-6 mt-8 border-t border-gray-700 flex flex-col items-center justify-center gap-2 bg-[#0f172a] text-white no-print relative z-10">
                <a href="https://ko-fi.com/syukran/tip" target="_blank" rel="noreferrer" className="bg-[#FF5E5B] hover:bg-[#ff4542] text-white font-jannah text-[12px] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105">☕ Support Us (Buy me Ko-fi)</a>
                <div className="text-center relative">
                     <p className="font-jannah text-[12px] text-gray-400 italic opacity-50">by Te_eR Inovative</p>
                     <p className="font-jannah text-[9px] text-white">{new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
