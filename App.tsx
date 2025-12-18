import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CalendarType, CalendarViewFormat, CalendarPeriod, CalendarContentMode, AiOptionsData, AppSettings, LANGUAGES, COUNTRIES, CustomEvent, Task, AI_GENERATORS, MediaItem } from './types';
import { getMonthData, getFormattedDateString, fetchHolidays, getNativeDateDigit, exportToICS } from './utils/calendarLogic';
import { generateCalendarImage } from './services/geminiService';

// Fix: Add global interface for window properties
declare global {
  interface Window {
    deferredPrompt: any;
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

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
    BTN_KOFI: "https://github.com/vandratop/Yuk/blob/872daa6f963613ba58fc4ff71f886beed94ff15d/support_me_on_kofi_beige.png?raw=true"
};

// --- Missing Components Implementation ---

// Fix: Added ImageResultModal
const ImageResultModal = ({ isOpen, onClose, imageSrc, onSave }: any) => {
    if (!isOpen || !imageSrc) return null;
    return (
        <div className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 p-4 rounded-xl max-w-2xl w-full flex flex-col items-center neon-border">
                <img src={imageSrc} alt="Generated" className="max-w-full max-h-[60vh] rounded mb-4" />
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded font-bold">CANCEL</button>
                    <button onClick={onSave} className="px-6 py-2 bg-cyan-600 text-white rounded font-bold shadow-[0_0_15px_#06b6d4]">UPLINK IMAGE</button>
                </div>
            </div>
        </div>
    );
};

// Fix: Added TextModal
const TextModal = ({ isOpen, onClose, title, content }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 p-6 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto text-white neon-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-fredoka text-cyan-400">{title}</h3>
                    <button onClick={onClose} className="text-red-500 font-bold">[X]</button>
                </div>
                <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                    {content}
                </div>
            </div>
        </div>
    );
};

// Fix: Added FindUsModal
const FindUsModal = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-cyan-500 p-6 rounded-xl max-w-md w-full text-white neon-border text-center">
                <h3 className="text-xl font-fredoka text-cyan-400 mb-4">FIND US IN THE NET</h3>
                <div className="flex flex-col gap-3">
                    <a href="https://github.com/vandratop" target="_blank" rel="noreferrer" className="p-3 bg-gray-800 rounded hover:bg-cyan-900/50 transition-colors text-white no-underline">GitHub Repository</a>
                    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="p-3 bg-gray-800 rounded hover:bg-cyan-900/50 transition-colors text-white no-underline">Instagram Signal</a>
                    <a href="https://twitter.com/" target="_blank" rel="noreferrer" className="p-3 bg-gray-800 rounded hover:bg-cyan-900/50 transition-colors text-white no-underline">X / Twitter Stream</a>
                </div>
                <button onClick={onClose} className="mt-6 text-gray-500 hover:text-white">Close Connection</button>
            </div>
        </div>
    );
};

// Fix: Added PrintPreviewModal
const PrintPreviewModal = ({ isOpen, onClose, previewType }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="bg-white text-black p-8 rounded shadow-2xl max-w-4xl w-full overflow-y-auto mb-4">
                <h2 className="text-center font-bold text-2xl mb-4 border-b pb-2 uppercase">{previewType?.replace('-', ' ')} PREVIEW</h2>
                <div className="p-4 border-2 border-dashed border-gray-300 text-center text-gray-400 italic">
                    [ Digital Calendar System Data Stream Rendering... ]
                    <br />
                    This represents the printed layout for: {previewType}
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={onClose} className="px-8 py-2 bg-red-600 text-white font-bold rounded">CANCEL</button>
                <button onClick={() => { window.print(); onClose(); }} className="px-8 py-2 bg-blue-600 text-white font-bold rounded">CONFIRM PRINT</button>
            </div>
        </div>
    );
};

// --- Starfield Component ---
const Starfield = () => {
    return (
        <div className="starfield">
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
        { id: 'menu-btn', text: "Access system information and contact signal here." },
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
                if (step < steps.length - 1) setStep(s => s + 1);
            }
        };
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
      case CalendarType.HIJRI: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_hijri.png?raw=true"; break;
      case CalendarType.JAVANESE: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_javanese.png?raw=true"; break;
      case CalendarType.CHINESE: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_chinese.png?raw=true"; break;
      case CalendarType.BAZI: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_bazi.png?raw=true"; break;
      case CalendarType.JAPANESE: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_japan.png?raw=true"; break;
      case CalendarType.KOREAN: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_korean.png?raw=true"; break;
      case CalendarType.THAI: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_thai.png?raw=true"; break;
      case CalendarType.IRANIAN: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_iranian.png?raw=true"; break;
      case CalendarType.HINDI: bgImage = "https://github.com/vandratop/Yuk/blob/1fa6d0cb2689688b21c0e288cf45ad92fd422286/DGCALD/DIGICALD_back_hindi.png?raw=true"; break;
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
    <header className={`fixed top-0 left-0 right-0 z-50 border-b h-16 flex items-center justify-between px-2 md:px-6 transition-colors duration-300 no-print ${isDark ? 'glass-panel border-cyan-500/30' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-1 md:gap-3 relative z-20">
            {subPageTitle && (
                <button onClick={onBack} className="text-xl md:text-2xl hover:scale-110 transition-transform" title="Back">🔙</button>
            )}
            <button id="menu-btn" onClick={onToggleMenu} className={`p-1.5 md:p-2 transition-colors ${isDark ? 'text-cyan-400 hover:text-white' : 'text-gray-700 hover:text-black'} ${isMenuOpen ? 'bg-white/10 rounded-full' : ''}`} title="Menu">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button id="install-btn" onClick={installPwa} className="text-xl md:text-2xl hover:scale-110 transition-transform p-1 animate-pulse" title="Install App">
                📥
            </button>
        </div>
        
        <div className="flex flex-col items-center justify-center absolute left-0 right-0 pointer-events-none z-10">
            {subPageTitle ? (
                    <h1 className={`text-sm md:text-2xl font-fredoka font-bold tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`} data-text={subPageTitle}>{subPageTitle}</h1>
            ) : (
                <h1 id="app-title" className="text-xl md:text-3xl font-fredoka text-[#00594C] font-bold" data-text="DIGICALD">DIGICALD</h1>
            )}
        </div>

        <div className="flex items-center gap-1 md:gap-3 relative z-20">
            <button onClick={onToggleLanguage} className={`text-xl md:text-2xl hover:scale-110 transition-transform p-1 rounded ${isLangMenuOpen ? 'bg-white/10' : ''}`} title="Translate / Language">🇬🇧</button>
            <button id="settings-btn" onClick={onToggleSettings} className="p-1.5 md:p-2 transition-colors" title="Settings">
                <img src={ASSETS.ICON_SETTINGS} alt="Settings" className="w-6 h-6 md:w-8 md:h-8 animate-spin-slow" />
            </button>
        </div>
    </header>
);

const MainMenu = ({ isOpen, onClose, onShowGuide, onShowTerms, onShowFAQ, onShowFindUs }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute top-16 left-4 z-[250] bg-[#0f172a] border border-cyan-500 rounded-lg p-2 w-56 shadow-xl neon-border animate-fade-in">
            <div className="mb-1 pb-1">
                <button onClick={() => { onShowGuide(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">📖 User Guide</button>
                <button onClick={() => { onShowTerms(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">📜 Terms & Policy</button>
                <button onClick={() => { onShowFAQ(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">❓ FAQ</button>
                <a href="mailto:hijr.time@gmail.com" onClick={() => onClose()} className="block w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">✉️ Contact Us</a>
                <button onClick={() => { onShowFindUs(); onClose(); }} className="w-full text-left p-2 text-white hover:bg-cyan-900/50 hover:text-cyan-400 text-sm rounded">🔍 Find Us</button>
            </div>
        </div>
    );
};

const SettingsMenu = ({ isOpen, onClose, settings, onUpdate, onLogout, onPrintPreview, toggleFullscreen, onExport }: any) => {
    if (!isOpen) return null;
    const [showShareMenu, setShowShareMenu] = useState(false);
    return (
        <div className="fixed top-16 right-4 z-[250] bg-[#0f172a] border border-cyan-500 rounded-lg p-4 w-72 shadow-xl text-white neon-border no-print animate-fade-in max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                 <h3 className="text-cyan-400 font-bold font-fredoka uppercase tracking-wider">System Config</h3>
                 <button onClick={onClose} className="text-red-500 font-bold text-lg hover:text-red-400" title="Close">[X]</button>
             </div>
             
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

const AiTemplateBuilder = ({ isOpen, onClose, onImageGenerated, isDark }: any) => {
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
    const cardClass = isDark ? "bg-[#0f172a] border-cyan-500 text-white" : "bg-white border-gray-400 text-black shadow-2xl";
    const tabClass = (t: string) => activeTab === t 
        ? "bg-cyan-600 text-white shadow-lg" 
        : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300");

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4">
             <div className={`${cardClass} border rounded-lg p-4 w-[90%] max-w-4xl shadow-2xl neon-border flex flex-col max-h-[90vh] overflow-hidden relative`}>
                 <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                     <h3 className={`text-xl font-fredoka font-bold ${isDark ? 'text-cyan-400' : 'text-blue-900'}`}>AI TEMPLATE BUILDER</h3>
                     <button onClick={onClose} className="text-red-500 font-bold hover:text-red-400 text-xl">[X]</button>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-2">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${tabClass(t)}`}>
                            {t}
                        </button>
                    ))}
                 </div>

                 <div className={`flex-1 overflow-y-auto mb-4 p-2 rounded ${isDark ? 'bg-black/20' : 'bg-gray-100 border border-gray-300'}`}>
                    {['Style', 'Light', 'Weather', 'Time', 'Ratio', 'Background', 'Camera'].includes(activeTab) && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {(activeTab === 'Ratio' ? AiOptionsData.ratio : activeTab === 'Background' ? AiOptionsData.background : activeTab === 'Camera' ? AiOptionsData.camera : AiOptionsData[activeTab.toLowerCase() as keyof typeof AiOptionsData])?.map(opt => (
                                <button key={opt} onClick={() => updateSelection(activeTab.toLowerCase(), opt)} className={`px-3 py-1.5 rounded border text-xs capitalize transition-colors ${selections[activeTab.toLowerCase() as keyof typeof selections] === opt ? 'bg-cyan-600 border-cyan-400 text-white' : (isDark ? 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-400 text-black hover:bg-gray-200')}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>

                 <div className={`${isDark ? 'bg-black' : 'bg-gray-200'} p-3 rounded border border-gray-400 mb-4`}>
                    <label className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-gray-500' : 'text-gray-700'}`}>Generated Prompt:</label>
                    <textarea 
                        className={`w-full h-16 bg-transparent text-sm resize-none focus:outline-none font-mono ${isDark ? 'text-cyan-300' : 'text-black font-bold'}`}
                        value={promptText}
                        readOnly
                    />
                    <div className="flex justify-end">
                        <button onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">Copy Signal</button>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-2 border-t border-gray-700 pt-4">
                     <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Generator external with:</span>
                        <select 
                            onChange={(e) => handleExternalGenerate(e.target.value)}
                            className={`${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-400'} text-xs p-2 rounded border cursor-pointer hover:border-cyan-500`}
                            defaultValue=""
                        >
                            <option value="" disabled>Select AI Tool...</option>
                            {AI_GENERATORS.map(gen => (
                                <option key={gen.name} value={gen.url}>{gen.name}</option>
                            ))}
                        </select>
                     </div>
                     <p className={`text-[10px] italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Note : After your get image, back to "DIGICALD" menu and upload your image</p>
                 </div>
             </div>
        </div>
    );
};

const TaskModal = ({ isOpen, onClose, dateStr, tasks, onSaveTask, isDark }: any) => {
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
    const [newTask, setNewTask] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newMonthDate, setNewMonthDate] = useState('1');
    const [highlightColor, setHighlightColor] = useState('#06b6d4');
    
    if (!isOpen || !dateStr) return null;

    const dateParts = dateStr.split('-');
    const currentYear = parseInt(dateParts[0]);
    const currentMonth = parseInt(dateParts[1]);
    const currentDate = new Date(currentYear, currentMonth - 1, parseInt(dateParts[2]));

    const dayTasks = tasks.filter((t: Task) => t.date === dateStr);
    const monthTasks = tasks.filter((t: Task) => {
        const tParts = t.date.split('-');
        return parseInt(tParts[0]) === currentYear && parseInt(tParts[1]) === currentMonth;
    });

    const displayTasks = activeTab === 'daily' ? dayTasks : monthTasks;

    const handleAdd = () => {
        if (!newTask) return;
        const targetDate = activeTab === 'daily' 
            ? dateStr 
            : `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(newMonthDate).padStart(2, '0')}`;

        const task: Task = {
            id: Date.now().toString(),
            date: targetDate,
            timeSlot: activeTab === 'daily' ? newTime : undefined,
            content: newTask,
            isCompleted: false,
        };
        onSaveTask([...tasks, task]);
        setNewTask('');
        setNewTime('');
    };

    const toggleTask = (id: string) => {
        onSaveTask(tasks.map((t: Task) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const deleteTask = (id: string) => {
        onSaveTask(tasks.filter((t: Task) => t.id !== id));
    };

    const handleShare = async () => {
        const shareData = {
            title: 'DIGICALD Task Log',
            text: `Tasks for ${activeTab === 'daily' ? dateStr : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}:\n` + 
                  displayTasks.map((t: Task) => `- [${t.isCompleted ? 'X' : ' '}] ${t.timeSlot ? t.timeSlot + ': ' : ''}${t.content}`).join('\n'),
            url: window.location.href
        };
        if (navigator.share) await navigator.share(shareData);
        else alert("Sharing not supported in this browser.");
    };

    const dailyTitle = currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const monthlyTitle = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-2 md:p-4">
             <div className="bg-[#0f172a] border border-cyan-500 rounded-lg p-6 w-full max-w-lg shadow-2xl neon-border h-[85vh] flex flex-col relative">
                <div className="absolute top-2 right-12">
                     <button onClick={handleShare} className="p-2 text-cyan-400 hover:text-white" title="Share Tasks">🔗</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-red-500 font-bold hover:text-red-400">[X]</button>
                
                <div className="flex gap-2 mb-6 border-b border-gray-700">
                    <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'daily' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>TAB DAILY</button>
                    <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'monthly' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>TAB MONTHLY</button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-fredoka text-cyan-400 uppercase">{activeTab === 'daily' ? dailyTitle : monthlyTitle}</h2>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar bg-black/20 p-2 rounded">
                    {displayTasks.length === 0 ? (
                        <p className="text-gray-500 text-center italic text-sm mt-10">No tasks logged.</p>
                    ) : (
                        displayTasks.map((t: Task) => (
                            <div key={t.id} className={`flex items-center justify-between p-2 mb-2 rounded border ${t.isCompleted ? 'bg-green-900/10 border-green-800' : 'bg-gray-800 border-gray-700'}`} style={!t.isCompleted ? { borderLeft: `3px solid ${highlightColor}` } : {}}>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleTask(t.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${t.isCompleted ? 'bg-green-500 border-green-500 text-black' : 'border-gray-500'}`}>
                                        {t.isCompleted && '✓'}
                                    </button>
                                    <div>
                                        <p className={`text-sm ${t.isCompleted ? 'text-gray-500 line-through italic' : 'text-white'}`}>{t.content}</p>
                                        <p className="text-[10px] text-cyan-400 font-mono">
                                            {activeTab === 'daily' ? (t.timeSlot || '--:--') : t.date}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400 text-xs">DEL</button>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col gap-2">
                    <div className="flex gap-2">
                        {activeTab === 'daily' ? (
                             <input type="time" className="bg-gray-800 text-white p-2 rounded border border-gray-600 text-xs w-28" value={newTime} onChange={e => setNewTime(e.target.value)} />
                        ) : (
                             <select className="bg-gray-800 text-white p-2 rounded border border-gray-600 text-xs w-28" value={newMonthDate} onChange={e => setNewMonthDate(e.target.value)}>
                                 {Array.from({length: 31}, (_, i) => i+1).map(d => <option key={d} value={d}>Date {d}</option>)}
                             </select>
                        )}
                        <input type="text" placeholder={activeTab === 'daily' ? "Catatan / Memo..." : "Plan / Schedule..."} className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm focus:border-cyan-500 outline-none" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded border border-gray-700">
                             <label className="text-[10px] font-bold text-gray-400">HIGHLIGHT:</label>
                             <input type="color" value={highlightColor} onChange={e => setHighlightColor(e.target.value)} className="bg-transparent border-none w-6 h-6 cursor-pointer" />
                        </div>
                        <button onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-6 rounded font-bold text-sm shadow-[0_0_15px_#06b6d4]">SAVE LOG</button>
                    </div>
                </div>
             </div>
        </div>
    );
};

// --- Calendar View ---
const CalendarView = ({ date, type, days, onDayClick, isDark, viewFormat, period, contentMode, apiHolidays }: any) => {
    const isYearly = period === CalendarPeriod.YEARLY;
    const isDaily = period === CalendarPeriod.DAILY;
    const isHorizontal = viewFormat === CalendarViewFormat.HORIZONTAL;

    const getDayClass = (d: any) => {
        if (!d || d.day === 0) return 'invisible';
        const holiday = d.isHoliday ? '!text-red-600 !font-black' : '';
        const today = d.isToday ? 'bg-cyan-600 text-white font-bold shadow-md' : (isDark ? 'bg-white/5 text-white border-white/10' : 'bg-white text-black border-gray-300 font-bold shadow-sm');
        return `${today} ${holiday}`;
    };

    if (isDaily) {
        const selectedData = days.find((d: any) => d.day === date.getDate() && d.month === date.getMonth() && d.year === date.getFullYear()) 
                             || days.find((d: any) => d.day === date.getDate()); 

        if (!selectedData) return <div className="text-center p-10 text-gray-500">Date data unavailable</div>;

        return (
            <div className={`flex flex-col items-center justify-center p-6 md:p-10 border rounded-lg h-full min-h-[400px] ${isDark ? 'border-cyan-500/30 bg-black/40 neon-border' : 'border-gray-400 bg-white shadow-xl'}`}>
                <h2 className={`text-2xl md:text-3xl font-jannah mb-2 uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-blue-900 font-black'}`}>{date.toLocaleDateString('id-ID', {weekday:'long'})}</h2>
                <div className={`text-[120px] md:text-[180px] font-fredoka font-bold leading-none ${isDark ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-black'}`}>
                    {selectedData.day}
                </div>
                <div className={`text-3xl md:text-5xl font-bold mt-4 font-fredoka ${isDark ? 'text-fuchsia-500' : 'text-purple-800'}`}>{date.getFullYear()}</div>
                <div className="mt-8 text-center border-t border-gray-200 w-full pt-4">
                    <p className={`text-lg md:text-xl font-jannah ${isDark ? 'text-yellow-400' : 'text-gray-900 font-black'}`}>{selectedData.nativeDateStr}</p>
                    {selectedData.isHoliday && <p className="text-red-600 font-black mt-2 animate-pulse text-xl md:text-2xl uppercase">{selectedData.holidayName}</p>}
                </div>
            </div>
        );
    }

    if (isYearly) {
        const months = Array.from({length: 12}, (_, i) => i);
        // Vertical Yearly: 3 cols wide (3x4)
        // Horizontal Yearly: 4 cols wide (4x3)
        const gridClass = isHorizontal 
            ? 'grid-cols-2 md:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-3';

        return (
            <div className={`grid ${gridClass} gap-2 md:gap-4 w-full h-full overflow-y-auto pb-10 custom-scrollbar p-1`}>
                {months.map(m => {
                    const mDate = new Date(date.getFullYear(), m, 1);
                    const mDays = getMonthData(date.getFullYear(), m, CalendarType.GREGORIAN, "ID", "en-US", [], [], apiHolidays);
                    return (
                        <div key={m} className={`border p-2 rounded transition-all hover:scale-[1.02] ${isDark ? 'border-cyan-500/20 bg-black/40 hover:border-cyan-500/60' : 'border-gray-400 bg-white hover:border-black shadow-md'}`}>
                            <h4 className={`text-center font-bold mb-2 text-[10px] md:text-xs uppercase tracking-widest ${isDark ? 'text-cyan-400 font-fredoka' : 'text-black font-black'}`}>{mDate.toLocaleString('default', { month: 'long' })}</h4>
                            <div className="grid grid-cols-7 gap-1">
                                {['S','M','T','W','T','F','S'].map(d => (
                                    <div key={d} className={`text-center text-[8px] md:text-[9px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-800'}`}>{d}</div>
                                ))}
                                {mDays.map((d, i) => (
                                    <div key={i} className={`aspect-square flex items-center justify-center text-[8px] md:text-[9px] rounded-sm cursor-default transition-colors ${getDayClass(d)}`}>
                                        {d.day > 0 ? d.day : ''}
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
        <div className={`relative p-2 rounded-lg overflow-hidden ${isDark ? 'bg-black/20 border border-cyan-500/30 neon-border' : 'bg-white border border-gray-300 shadow-xl'} w-full h-full`}>
             <div className="grid grid-cols-7 gap-1 h-full content-start">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={`font-jannah font-bold text-center py-2 text-[10px] md:text-sm border-b uppercase tracking-tighter ${isDark ? 'text-[#00594C] bg-white' : 'text-black bg-gray-200 border-gray-400'}`}>
                        {day}
                    </div>
                ))}
                {days.map((day: any, idx: number) => (
                    <div key={idx} onClick={() => day.day > 0 && onDayClick(day)}
                        className={`min-h-[60px] md:min-h-[100px] p-1 border flex flex-col items-center justify-start relative cursor-pointer transition-all group
                            ${day.isToday ? 'bg-cyan-600/20 border-cyan-400' : (isDark ? 'text-white border-cyan-500/10 hover:bg-cyan-900/30' : 'text-black border-gray-300 font-bold hover:bg-gray-100')}
                            ${day.isHoliday ? 'bg-red-900/5' : ''} ${day.day === 0 ? 'invisible' : ''}`}>
                        {day.day > 0 && (
                            <>
                                <span className={`font-jannah font-bold text-base md:text-2xl ${day.isHoliday ? 'text-red-600 font-black' : ''}`}>
                                    {contentMode === CalendarContentMode.NATIVE_ONLY ? day.nativeDay : day.day}
                                </span>
                                {contentMode === CalendarContentMode.DUAL && (
                                    <span className={`text-[10px] md:text-xs mt-1 font-jannah ${isDark ? 'opacity-70' : 'text-gray-600'}`}>{day.nativeDay}</span>
                                )}
                                {day.weton && (
                                    <span className={`text-[9px] md:text-[11px] block mt-1 font-jannah uppercase tracking-tighter font-bold ${isDark ? 'text-yellow-500/80' : 'text-orange-700'}`}>
                                        {day.weton}
                                    </span>
                                )}
                                {day.hasTasks && <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_yellow]"></div>}
                                <div className="mt-auto w-full flex justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="text-[10px] text-cyan-400 font-bold">+ LOG</span>
                                </div>
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
    const subPageRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
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
    const [showFindUs, setShowFindUs] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => JSON.parse(localStorage.getItem('digicald_events') || '[]'));
    const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('digicald_tasks') || '[]'));
    const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
    const [apiHolidays, setApiHolidays] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [appSettings, setAppSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('digicald_settings');
        // Default theme is 'light' as per request
        return saved ? JSON.parse(saved) : { theme: 'light', zoom: 1, language: 'id-ID', isFullscreen: false, taskHighlightColor: '#FFFF00' };
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

    // Fix: Missing handleExport
    const handleExport = () => {
        exportToICS(customEvents, apiHolidays);
    };

    const handleLogin = () => setIsLoggedIn(true);
    // Fix: Fixed window.deferredPrompt type error
    const handlePWAInstall = () => { if ((window as any).deferredPrompt) (window as any).deferredPrompt.prompt(); else alert("Installation handled by browser."); };
    const handleImageGenerated = (img: string) => { setGeneratedImageTemp(img); setShowImageResult(true); };
    // Fix: Fixed MediaItem type casting for setMediaList
    const handleSaveImage = () => { if (generatedImageTemp) { setMediaList(prev => [...prev, { type: 'image' as const, url: generatedImageTemp, id: Date.now().toString() }].slice(-3)); setShowImageResult(false); setShowAiBuilder(false); } };
    // Fix: Fixed MediaItem type casting for setMediaList
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setMediaList(prev => [...prev, { type: (e.target.files![0].type.startsWith('video') ? 'video' : 'image') as any, url: URL.createObjectURL(e.target.files![0]), id: Date.now().toString() }].slice(-3)); } };

    const handlePrev = () => {
        const d = new Date(date);
        if (period === CalendarPeriod.DAILY) d.setDate(d.getDate() - 1);
        else if (period === CalendarPeriod.MONTHLY) d.setMonth(d.getMonth() - 1);
        else d.setFullYear(d.getFullYear() - 1);
        setDate(d);
    };

    const handleNext = () => {
        const d = new Date(date);
        if (period === CalendarPeriod.DAILY) d.setDate(d.getDate() + 1);
        else if (period === CalendarPeriod.MONTHLY) d.setMonth(d.getMonth() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        setDate(d);
    };

    const handleSaveFile = async (type: string) => {
        if (!printRef.current) return;
        if (type === 'mpeg') {
            alert("Digital Video export requires screen recording permissions. Starting recorder UI simulation...");
            return;
        }
        const canvas = await html2canvas(printRef.current, { useCORS: true, scale: 2 });
        const data = canvas.toDataURL(`image/${type === 'pdf' ? 'png' : type}`);
        if (type === 'pdf') {
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(data, 'PNG', 0, 0, 210, 297);
            pdf.save(`digicald-${Date.now()}.pdf`);
        } else {
            const link = document.createElement('a');
            link.download = `digicald-${Date.now()}.${type}`;
            link.href = data;
            link.click();
        }
    };

    const days = getMonthData(date.getFullYear(), date.getMonth(), selectedCalendar, country, appSettings.language, customEvents, tasks, apiHolidays);
    const isHorizontal = format === CalendarViewFormat.HORIZONTAL;
    const showStars = !isLoggedIn || view === 'main' || (view === 'sub' && selectedCalendar === CalendarType.GREGORIAN);

    const navLabel = period === CalendarPeriod.DAILY 
        ? date.toLocaleDateString(appSettings.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : period === CalendarPeriod.MONTHLY 
            ? date.toLocaleDateString(appSettings.language, { month: 'long', year: 'numeric' })
            : date.getFullYear().toString();

    const holidaysThisMonth = apiHolidays.filter(h => {
        const hDate = new Date(h.date);
        return hDate.getMonth() === date.getMonth() && hDate.getFullYear() === date.getFullYear();
    });

    if (!isLoggedIn) {
        return (
             <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <Background isDark={true} showStars={true} />
                <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-cyan-500 shadow-2xl neon-border relative z-10 animate-fade-in">
                    <h1 className="text-5xl font-fredoka text-white mb-8 neon-text uppercase tracking-widest">DIGICALD</h1>
                    <p className="text-cyan-400 font-mono text-xs mb-8 tracking-[0.3em]">Neural Interface Online</p>
                    <button onClick={handleLogin} className="cyber-button w-full text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3 mb-4 hover:scale-105 transition-transform">
                        <span className="text-xl">G</span> Login with Neural ID
                    </button>
                    <button onClick={() => { setIsLoggedIn(true); setIsGuest(true); }} className="w-full bg-gray-800/50 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg border border-gray-600 text-xs font-mono">GUEST ACCESS MODE</button>
                    <p className="text-[10px] text-gray-500 mt-4">* login as guest, limit access</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen relative pb-10 transition-colors duration-500 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            <Background isDark={isDark} themeName={appSettings.themeName || selectedCalendar} showStars={showStars} />
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
            
            <MainMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onShowGuide={() => setShowGuide(true)} onShowTerms={() => setShowTerms(true)} onShowFAQ={() => setShowFAQ(true)} onShowFindUs={() => setShowFindUs(true)} />
            <LanguageMenu isOpen={isLangMenuOpen} onClose={() => setIsLangMenuOpen(false)} currentLang={appSettings.language} onLangChange={(l: string) => setAppSettings({...appSettings, language: l})} />
            <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={appSettings} onUpdate={setAppSettings} onLogout={() => { setIsLoggedIn(false); setView('main'); }} onPrintPreview={(type: string) => setPrintPreviewType(type)} toggleFullscreen={() => setAppSettings({...appSettings, isFullscreen: !appSettings.isFullscreen})} onExport={handleExport} />
            
            <TaskModal isOpen={!!selectedTaskDate} onClose={() => setSelectedTaskDate(null)} dateStr={selectedTaskDate} tasks={tasks} onSaveTask={setTasks} isDark={isDark} />
            <AiTemplateBuilder isOpen={showAiBuilder} onClose={() => setShowAiBuilder(false)} onImageGenerated={handleImageGenerated} isDark={isDark} />
            <ImageResultModal isOpen={showImageResult} onClose={() => setShowImageResult(false)} imageSrc={generatedImageTemp} onSave={handleSaveImage} />
            <TextModal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Usage Guide" content={guideContent} />
            <TextModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Policy" content={termsContent} />
            <TextModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} title="FAQ" content={faqContent} />
            <FindUsModal isOpen={showFindUs} onClose={() => setShowFindUs(false)} />
            <PrintPreviewModal isOpen={!!printPreviewType} onClose={() => setPrintPreviewType(null)} previewType={printPreviewType} />
            <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

            <main className="pt-20 px-4 container mx-auto flex flex-col gap-6 items-center relative z-10 max-w-7xl">
                {view === 'main' ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl animate-fade-in-up mt-10">
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
                                <button key={item.type} onClick={() => { if (isGuest && item.type !== CalendarType.GREGORIAN) { alert("Neural Login Required for this data stream."); return; } setSelectedCalendar(item.type); setView('sub'); }}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all hover:scale-105 group border ${isDark ? 'glass-panel border-cyan-500/20 hover:border-cyan-400' : 'bg-white border-gray-100 shadow-lg hover:shadow-2xl'}`}>
                                    <div className="w-24 h-24 mb-4 relative"><img src={item.img} alt={item.type} className={`w-full h-full object-contain ${isDark ? 'drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]' : ''}`} /></div>
                                    <span className={`text-xs md:text-sm font-fredoka text-center font-bold tracking-widest ${isDark ? 'text-cyan-300' : 'text-gray-800'}`}>{item.type}</span>
                                </button>
                            ))}
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-6 animate-fade-in">
                        <div ref={printRef} className="flex flex-col gap-6">
                            {/* Proportional Layout Area */}
                            <div className={`flex gap-6 w-full ${isHorizontal ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                                {/* LEFT/TOP FRAME */}
                                <div className={`relative transition-all duration-500 ${isHorizontal ? 'w-full lg:w-[45%]' : 'w-full aspect-[16/9]'}`}>
                                    <div className={`relative w-full h-full p-2 border-[5px] rounded-2xl frame-blink ${isDark ? 'border-cyan-500 shadow-[0_0_20px_#06b6d4]' : 'border-blue-900 shadow-2xl bg-white'}`}>
                                        <div className="relative w-full h-full overflow-hidden rounded-xl bg-black/40 flex items-center justify-center">
                                            {mediaList[currentMediaIndex] ? (
                                                mediaList[currentMediaIndex].type === 'video' 
                                                ? <video src={mediaList[currentMediaIndex].url} className="w-full h-full object-contain" autoPlay muted loop />
                                                : <img src={mediaList[currentMediaIndex].url} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-center opacity-30 p-10"><p className="text-4xl">🖼️</p><p className="text-xs uppercase font-bold mt-2">No Visual Uplink</p></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-2 mt-4 no-print">
                                        <label className="cyber-button px-4 py-2 rounded text-[10px] font-bold cursor-pointer">UPLOAD <input type="file" className="hidden" onChange={handleFileUpload} /></label>
                                        <button id="ai-btn" onClick={() => setShowAiBuilder(true)} className="cyber-button px-4 py-2 rounded text-[10px] font-bold">AI BUILDER</button>
                                        <div className="relative group">
                                            <button className="cyber-button px-4 py-2 rounded text-[10px] font-bold">SAVE AS ▼</button>
                                            <div className="absolute top-full left-0 mt-1 w-32 bg-[#0f172a] border border-cyan-500 rounded z-[50] hidden group-hover:block shadow-2xl">
                                                <button onClick={() => handleSaveFile('jpg')} className={`w-full text-left p-2 text-[10px] border-b border-cyan-900/30 hover:bg-cyan-900/50 ${isDark ? 'text-cyan-400' : 'text-cyan-400 font-bold'}`}>JPG</button>
                                                <button onClick={() => handleSaveFile('png')} className={`w-full text-left p-2 text-[10px] border-b border-cyan-900/30 hover:bg-cyan-900/50 ${isDark ? 'text-cyan-400' : 'text-cyan-400 font-bold'}`}>PNG</button>
                                                <button onClick={() => handleSaveFile('pdf')} className={`w-full text-left p-2 text-[10px] border-b border-cyan-900/30 hover:bg-cyan-900/50 ${isDark ? 'text-cyan-400' : 'text-cyan-400 font-bold'}`}>PDF</button>
                                                <button onClick={() => handleSaveFile('mpeg')} className={`w-full text-left p-2 text-[10px] hover:bg-cyan-900/50 ${isDark ? 'text-cyan-400' : 'text-cyan-400 font-bold'}`}>MPEG (Video)</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* RIGHT/BOTTOM CALENDAR */}
                                <div className={`flex flex-col gap-4 ${isHorizontal ? 'w-full lg:w-[55%]' : 'w-full'}`}>
                                    <div className={`flex justify-between items-center w-full p-1 rounded-xl shadow-lg ${isDark ? 'bg-gradient-to-r from-cyan-400 to-white' : 'bg-gray-200 border border-gray-400'}`}>
                                        <button onClick={handlePrev} className="px-6 py-3 font-bold text-2xl bg-black/10 hover:bg-black/20 rounded-l-lg transition-colors">&lt;</button>
                                        <div className="text-center flex-1 py-2 uppercase font-tech tracking-tighter text-black">
                                            <span className="text-base md:text-xl font-fredoka font-bold">{navLabel}</span>
                                        </div>
                                        <button onClick={handleNext} className="px-6 py-3 font-bold text-2xl bg-black/10 hover:bg-black/20 rounded-r-lg transition-colors">&gt;</button>
                                    </div>
                                    <div className="w-full flex-1">
                                        <CalendarView date={date} type={selectedCalendar} days={days} 
                                            onDayClick={(day: any) => setSelectedTaskDate(`${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`)} 
                                            isDark={isDark} viewFormat={format} period={period} contentMode={contentMode} apiHolidays={apiHolidays} />
                                    </div>
                                    <div className={`w-full border p-3 rounded-lg ${isDark ? 'bg-black/30 border-cyan-500/20' : 'bg-white border-gray-300 shadow-md'}`}>
                                        <h4 className={`font-bold text-xs uppercase mb-2 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`}>Hari Libur Nasional ({country})</h4>
                                        <div className="max-h-32 overflow-y-auto text-[10px] md:text-xs">
                                            {holidaysThisMonth.length > 0 ? holidaysThisMonth.map((h, i) => (
                                                <div key={i} className="flex gap-2 py-1 border-b border-gray-100 last:border-0">
                                                    <span className="text-red-600 font-bold">{h.date}</span>
                                                    <span className={isDark ? 'text-white' : 'text-gray-700'}>: {h.localName || h.name}</span>
                                                </div>
                                            )) : <p className="opacity-50 italic">Tidak ada hari libur di bulan ini.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl w-full no-print ${isDark ? 'glass-panel border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200 shadow-2xl'}`}>
                            <div className="flex flex-col gap-1">
                                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-cyan-400' : 'text-gray-500'}`}>Format & Period</label>
                                <select value={`${format}-${period}`} onChange={(e) => { const [f, p] = e.target.value.split('-'); setFormat(f as any); setPeriod(p as any); }}
                                    className={`w-full text-xs rounded-lg p-3 transition-all outline-none border ${isDark ? 'bg-black border-cyan-500/30 text-white focus:border-cyan-400' : 'bg-gray-100 border-gray-300 text-black font-bold focus:border-black'}`}>
                                    <optgroup label="Vertikal Layout"><option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.DAILY}`}>Daily Vertikal</option><option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.MONTHLY}`}>Monthly Vertikal</option><option value={`${CalendarViewFormat.VERTICAL}-${CalendarPeriod.YEARLY}`}>Yearly Vertikal</option></optgroup>
                                    <optgroup label="Horizontal Layout"><option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.DAILY}`}>Daily Horizontal</option><option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.MONTHLY}`}>Monthly Horizontal</option><option value={`${CalendarViewFormat.HORIZONTAL}-${CalendarPeriod.YEARLY}`}>Yearly Horizontal</option></optgroup>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-cyan-400' : 'text-gray-500'}`}>Target Region</label>
                                <select value={country} onChange={(e) => setCountry(e.target.value)}
                                    className={`w-full text-xs rounded-lg p-3 transition-all outline-none border ${isDark ? 'bg-black border-cyan-500/30 text-white focus:border-cyan-400' : 'bg-gray-100 border-gray-300 text-black font-bold focus:border-black'}`}>
                                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-cyan-400' : 'text-gray-500'}`}>Data Interface</label>
                                <select value={contentMode} onChange={(e) => setContentMode(e.target.value as any)}
                                    className={`w-full text-xs rounded-lg p-3 transition-all outline-none border ${isDark ? 'bg-black border-cyan-500/30 text-white focus:border-cyan-400' : 'bg-gray-100 border-gray-300 text-black font-bold focus:border-black'}`}>
                                    {selectedCalendar === CalendarType.GREGORIAN ? (
                                        <option value={CalendarContentMode.NATIVE_ONLY}>Gregorian (Masehi) Only</option>
                                    ) : (
                                        <><option value={CalendarContentMode.DUAL}>Gregorian + Native</option><option value={CalendarContentMode.NATIVE_ONLY}>Native Data Only</option></>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="w-full pt-10 pb-6 mt-10 border-t border-gray-700 flex flex-col items-center justify-center gap-4 bg-[#0f172a] text-white no-print relative z-10">
                <a href="https://sociabuzz.com/syukrankatsiron/tribe" target="_blank" rel="noreferrer" className="bg-[#FF5E5B] hover:bg-[#ff4542] text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 uppercase tracking-wider text-white no-underline">Support us</a>
                <div className="flex flex-col items-center gap-2">
                     <a href="mailto:hijr.time@gmail.com" className="text-white hover:text-cyan-400 font-bold text-sm flex items-center gap-2 transition-colors no-underline"><span>✉️</span> HUBUNGI KAMI</a>
                     <a href="https://ko-fi.com/syukran/tip" target="_blank" rel="noreferrer" className="mt-1">
                        <img src={ASSETS.BTN_KOFI} alt="Buy me a Ko-fi" className="h-10 hover:scale-105 transition-transform" />
                     </a>
                </div>
                <div className="text-center mt-4">
                     <p className="font-fredoka text-sm text-gray-500 font-bold uppercase tracking-[0.2em]">Te-eR Inovative @2025</p>
                </div>
            </footer>
        </div>
    );
}

export default App;