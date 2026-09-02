import { useState, useEffect } from 'react';
import { Settings, UserCog, ShieldCheck, LifeBuoy, LogOut, ArrowLeft, Moon, Sun, X, Check, Phone, Mail, CheckCircle2, Globe } from 'lucide-react';

import StatGrid from '../components/StatGrid';

import { Language, translations } from '../i18n';

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
  currentTheme: string;
  setTheme: (theme: string) => void;
  onUpdateUser?: (updated: any) => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
  geminiApiKey?: string;
  onSaveGeminiKey?: (key: string) => void;
}


const INDIC_LANGUAGES_CATALOG = [
  { code: 'hi', name: 'हिन्दी (Hindi)', script: 'Devanagari', ocrStatus: 'Active', accuracy: '98.5%' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', script: 'Kannada', ocrStatus: 'Active', accuracy: '97.8%' },
  { code: 'ta', name: 'தமிழ் (Tamil)', script: 'Tamil', ocrStatus: 'Active', accuracy: '97.2%' },
  { code: 'te', name: 'తెలుగు (Telugu)', script: 'Telugu', ocrStatus: 'Active', accuracy: '97.4%' },
  { code: 'mr', name: 'मराठी (Marathi)', script: 'Devanagari', ocrStatus: 'Active', accuracy: '98.1%' },
  { code: 'bn', name: 'বাংলা (Bengali)', script: 'Bengali', ocrStatus: 'Active', accuracy: '97.9%' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', script: 'Gujarati', ocrStatus: 'Active', accuracy: '96.8%' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', script: 'Malayalam', ocrStatus: 'Active', accuracy: '96.5%' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', script: 'Gurmukhi', ocrStatus: 'Active', accuracy: '96.2%' },
  { code: 'or', name: 'ଓଡ଼િଆ (Odia)', script: 'Odia', ocrStatus: 'Active', accuracy: '95.9%' },
  { code: 'as', name: 'অসমীয়া (Assamese)', script: 'Eastern Nagari', ocrStatus: 'Active', accuracy: '95.7%' },
  { code: 'en', name: 'English', script: 'Latin', ocrStatus: 'Active', accuracy: '99.4%' }
];

export default function ProfileScreen({ 
  user, onLogout, currentTheme, setTheme, onUpdateUser, language = 'en', setLanguage 
}: ProfileScreenProps) {
  const [view, setView] = useState<'profile' | 'theme' | 'language'>('profile');
  const [activeModal, setActiveModal] = useState<'edit' | 'permissions' | 'support' | null>(null);
  const t = translations[language] || translations.en;

  // Profile edit form state
  const [name, setName] = useState(user?.name || user?.username || 'Officer');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.jurisdiction || user?.region || 'Central Enforcement Zone');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      else if (user.username) setName(user.username);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.jurisdiction) setRegion(user.jurisdiction);
      else if (user.region) setRegion(user.region);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { 
      ...user, 
      name: name.trim(), 
      full_name: name.trim(),
      email: email.trim(), 
      phone: phone.trim(), 
      region: region.trim(),
      jurisdiction: region.trim() 
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal(null);
    }, 600);
  };


  if (view === 'theme') {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <section className="flex items-center gap-3">
          <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[28px] leading-[32px] font-bold m-0">App Theme</h1>
        </section>

        <section className="bg-surface rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden border border-divider">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Live Preview</span>
          <span className="font-display text-[32px] font-bold leading-none capitalize">
            {currentTheme === 'daylight-registry' ? 'Daylight (Crisp White)' : 'Dark Noir'}
          </span>
          <span className="text-[13px] text-fg-muted">
            {currentTheme === 'daylight-registry'
              ? 'Ultra-clean, modern crisp white workspace with high legibility and contrast.'
              : 'Deep obsidian dark mode with amber accents and vibrant high-visibility status indicators.'}
          </span>
          <div className="flex gap-2 mt-2">
            <span className="w-9 h-9 rounded-lg flex-shrink-0 bg-canvas border border-divider"></span>
            <span className="w-9 h-9 rounded-lg flex-shrink-0 bg-surface border border-divider"></span>
            <span className="w-9 h-9 rounded-lg flex-shrink-0 bg-fg"></span>
            <span className="w-9 h-9 rounded-lg flex-shrink-0 bg-accent"></span>
            <span className="w-9 h-9 rounded-lg flex-shrink-0 bg-fg-muted"></span>
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Pass
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-error font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Fail
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Review
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Available Themes</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'default-noir', label: 'Dark Noir', desc: 'Deep obsidian dark mode with amber metrology accents', Icon: Moon },
              { id: 'daylight-registry', label: 'Daylight (Clean White)', desc: 'Modern crisp white UI designed for maximum clarity', Icon: Sun },
            ].map(thm => (
              <button
                key={thm.id}
                onClick={() => { setTheme(thm.id); setView('profile'); }}
                className={`flex items-center gap-4 bg-surface rounded-2xl p-5 text-left transition-all hover:bg-surface-elevated active:scale-99 border cursor-pointer ${
                  currentTheme === thm.id ? 'border-accent bg-accent/5' : 'border-divider'
                }`}
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-surface-recessed text-accent">
                  <thm.Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[16px] font-semibold text-fg">{thm.label}</span>
                  <span className="text-[13px] text-fg-muted">{thm.desc}</span>
                </span>
                {currentTheme === thm.id && (
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === 'language') {
    const langOptions: Array<{ id: Language; symbol: string; label: string; desc: string }> = [
      { id: 'en', symbol: 'A', label: 'English', desc: 'Default system interface' },
      { id: 'hi', symbol: 'अ', label: 'हिन्दी (Hindi)', desc: 'विधिक मापविज्ञान एवं अनुपालन' },
      { id: 'kn', symbol: 'ಅ', label: 'ಕನ್ನಡ (Kannada)', desc: 'ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ಅನುಸರಣೆ' },
      { id: 'ta', symbol: 'அ', label: 'தமிழ் (Tamil)', desc: 'சட்ட எடையியல் அமலாக்கம்' },
      { id: 'te', symbol: 'అ', label: 'తెలుగు (Telugu)', desc: 'లీగల్ మెట్రాలజీ ప్యాకేజింగ్ నిబంధనలు' },
      { id: 'mr', symbol: 'म', label: 'मराठी (Marathi)', desc: 'कायदेशीर वजन व मापे अनुपालन' },
      { id: 'bn', symbol: 'অ', label: 'বাংলা (Bengali)', desc: 'আইনগত পরিমাপবিদ্যা প্রয়োগ' },
    ];

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <section className="flex items-center gap-3">
          <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[28px] leading-[32px] font-bold m-0">Interface Language</h1>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Select Application Language</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {langOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  if (setLanguage) setLanguage(opt.id);
                  setView('profile');
                }}
                className={`flex items-center gap-3 bg-surface rounded-2xl p-5 text-left w-full transition-all hover:bg-surface-elevated active:scale-99 border ${
                  language === opt.id ? 'border-accent bg-accent/5' : 'border-divider'
                }`}
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-surface-recessed text-accent font-bold text-lg font-display">
                  {opt.symbol}
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[16px] font-semibold text-fg">{opt.label}</span>
                  <span className="text-[13px] text-fg-muted">{opt.desc}</span>
                </span>
                {language === opt.id && (
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <section className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[30px] font-bold m-0 text-fg">{t.profile || "Profile & Settings"}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('language')} className="w-10 h-10 rounded-xl bg-surface border border-divider text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0" title="Language Settings">
            <Globe className="w-5 h-5 text-accent" />
          </button>
          <button onClick={() => setView('theme')} className="w-10 h-10 rounded-xl bg-surface border border-divider text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0" title="Theme Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Officer Identity, Status & StatGrid (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <section className="bg-surface rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-divider/60 shadow-sm">
            <div className="w-[88px] h-[88px] rounded-full bg-surface-recessed border-2 border-accent/40 flex items-center justify-center text-fg font-display text-[32px] font-bold shadow-inner">
              {(user?.name || name)?.substring(0,2)?.toUpperCase() || 'LM'}
            </div>
            <div>
              <p className="font-display text-[26px] font-bold leading-tight m-0 text-fg">{user?.name || name}</p>
              <p className="text-[13px] text-accent font-bold mt-1">
                {user?.designation || (user?.role === 'controller' ? 'District Collector & Controller' : user?.role === 'supervisor' ? 'Senior Inspector' : 'Legal Metrology Officer')}
              </p>
              <p className="text-[11px] text-fg-muted font-mono mt-0.5">
                Badge ID: {user?.badge_number || 'LM-001'}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-success/10 border border-success/30 text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>{t.sessionActive}
            </span>
          </section>

          <StatGrid 
            columns={2}
            items={[
              { id: 'region', label: t.assignedRegion, value: user?.jurisdiction || region },
              { id: 'version', label: t.appVersionLabel, value: 'v2.4 Live' }
            ]} 
          />


          <button 
            onClick={onLogout} 
            className="flex items-center justify-center gap-2 w-full bg-surface hover:bg-error/10 border border-divider hover:border-error/40 text-error rounded-2xl py-3.5 px-4 font-bold text-sm transition-colors active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOut}</span>
          </button>
        </div>

        {/* Right Column: Supported Indic Languages & Account Management (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* --- SUPPORTED INDIC LANGUAGES SECTION --- */}
          <section className="bg-surface rounded-2xl p-6 border border-divider/60 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-accent" />
                <h3 className="font-display text-lg font-bold text-fg m-0">
                  {language === 'hi' ? 'समर्थित भारतीय भाषाएं व लिपियां' : language === 'kn' ? 'ಬೆಂಬಲಿತ ಭಾರತೀಯ ಭಾಷೆಗಳು' : 'Supported Indic Languages & Multilingual OCR'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                12 Official Scripts
              </span>
            </div>

            <p className="text-xs text-fg-muted leading-relaxed">
              {language === 'hi' ? 'पारखमेट्रिक विधिक मापविज्ञान के लिए 12 भारतीय लिपियों में डीप-लर्निंग ओसीआर व विज़न एलएलएम का समर्थन करता है:' :
               language === 'kn' ? 'ಪಾರಖ್‌ಮೆಟ್ರಿಕ್ ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ಅನುಸರಣೆಗಾಗಿ 12 ಭಾರತೀಯ ಲಿಪಿಗಳಲ್ಲಿ OCR ಮತ್ತು AI ಪರಿಶೀಲನೆಯನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ:' :
               'PaarakhMetric embeds multilingual deep-learning OCR and Vision LLMs capable of recognizing packaging declarations across all major Indian scripts:'}
            </p>

            {/* Grid of Indic Languages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {INDIC_LANGUAGES_CATALOG.map((langItem) => (
                <div 
                  key={langItem.code}
                  className="bg-surface-elevated/70 border border-divider/60 rounded-xl p-3 flex flex-col gap-1 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg">{langItem.name}</span>
                    <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                      {langItem.ocrStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-fg-muted font-mono">
                    <span>{langItem.script}</span>
                    <span className="text-accent font-semibold">{langItem.accuracy}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setView('language')}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface border border-divider rounded-xl text-xs font-bold text-fg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 text-accent" />
                <span>{language === 'hi' ? 'इंटरफ़ेस भाषा बदलें' : language === 'kn' ? 'ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ' : 'Switch Interface Language'}</span>
              </button>
            </div>
          </section>

          {/* Account Operations & Preferences */}
          <section className="bg-surface rounded-2xl p-6 border border-divider/60 flex flex-col gap-3 shadow-sm">

            <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">{t.accountOperations}</span>
            <div className="flex flex-col divide-y divide-divider/60">
              <button 
                onClick={() => setActiveModal('edit')}
                className="flex items-center gap-3 w-full py-4 text-left transition-opacity hover:opacity-85"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated text-fg-muted">
                  <UserCog className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-fg">{t.editProfileDetails}</span>
                  <span className="text-[12px] text-fg-muted">{t.editProfileSub}</span>
                </span>
              </button>
              
              <button 
                onClick={() => setActiveModal('permissions')}
                className="flex items-center gap-3 w-full py-4 text-left transition-opacity hover:opacity-85"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated text-fg-muted">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-fg">{t.rolePermissions}</span>
                  <span className="text-[12px] text-fg-muted">{t.rolePermissionsSub}</span>
                </span>
              </button>
              
              <button 
                onClick={() => setActiveModal('support')}
                className="flex items-center gap-3 w-full py-4 text-left transition-opacity hover:opacity-85"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated text-fg-muted">
                  <LifeBuoy className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-fg">{t.contactSupport}</span>
                  <span className="text-[12px] text-fg-muted">{t.contactSupportSub}</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>


      {/* Edit Profile Modal */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-fg">Edit Profile</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-fg-muted hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-fg-muted">Officer Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-fg-muted">Official Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-fg-muted">Official Phone</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-fg-muted">Assigned Jurisdiction</label>
                <input 
                  type="text" 
                  value={region} 
                  onChange={e => setRegion(e.target.value)} 
                  required
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully!
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)} 
                  className="flex-1 py-3 rounded-full bg-surface-elevated text-fg font-semibold text-sm hover:bg-surface border border-divider"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-full bg-accent text-on-accent font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {activeModal === 'permissions' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-fg">Role & Statutory Authority</h3>
                <p className="text-xs text-accent font-semibold">{user?.designation || (user?.role === 'controller' ? 'Collector' : user?.role === 'supervisor' ? 'Senior Inspector' : 'Field Officer')}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-fg-muted hover:text-fg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-fg-muted leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {user?.role === 'controller' ? (
                <>
                  <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm text-accent">Apex Statutory Seizure & Notice Authority</span>
                    <span>Empowered under Section 39 of the Legal Metrology Act 2009 to issue Form-1 statutory seizure orders, approve compounding of packaging infractions, and sanction confiscation of non-compliant commodities.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">Statewide Jurisdiction & Appellate Control</span>
                    <span>Executive command across all zonal enforcement wings, standards laboratories, and senior inspection divisions. Full registry oversight and audit ledger sign-off.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">Officer Account Governance</span>
                    <span>Administrative authority to reassign field jurisdictions, modify supervisory assignments, and govern credential registries.</span>
                  </div>
                </>
              ) : user?.role === 'supervisor' ? (
                <>
                  <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm text-accent">Supervisory Field Verification & Audit</span>
                    <span>Authorized to review, verify, and endorse inspection ledgers from Legal Metrology Officers, conduct spot supervisory checks, and recommend compliance clearance.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">Standards Laboratory Referral Power</span>
                    <span>Authorized to order official physical sample dispatch to Regional Standards Laboratories under Rule 18 for high-precision density, tare, and volume validation.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">Direct Collectorate Escalation</span>
                    <span>Statutory channel to escalate persistent or major non-compliance violations directly to the District Collector for compounding or prosecution.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm text-accent">Field Inspection & Declaration Verification</span>
                    <span>Authorized under Section 15 & Rule 6 to enter premises, verify physical packaged goods against legal declarations (MRP, Net Qty, Dates, Address), and log infractions.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">AI Computer Vision & Multi-Panel Scanning</span>
                    <span>Authorized to operate automated OCR and deep-learning label validation across Principal Display Panels, inkjet batch stamps, and barcodes.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-recessed border border-divider flex flex-col gap-1">
                    <span className="text-fg font-bold text-sm">Flagging & Memo Issuance</span>
                    <span>Authorized to flag non-compliant goods and issue preliminary inspection memos for supervisory endorsement.</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-3 rounded-full bg-accent text-on-accent font-bold text-xs cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}


      {/* Support Modal */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-fg">Contact Compliance Desk</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-fg-muted hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-xs text-fg-muted leading-relaxed">
              <div className="flex items-center gap-3 p-3 bg-surface-recessed rounded-xl border border-divider">
                <Phone className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-fg font-semibold">Toll-Free Helpline</div>
                  <div>1800-11-4000 (Mon–Sat, 9am–6pm IST)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-recessed rounded-xl border border-divider">
                <Mail className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-fg font-semibold">Department Email Support</div>
                  <div>support.legalmetrology@delhi.gov.in</div>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-3 rounded-full bg-accent text-on-accent font-bold text-xs">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
