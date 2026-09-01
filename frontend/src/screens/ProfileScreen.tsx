import { useState, useEffect } from 'react';
import { Settings, UserCog, ShieldCheck, LifeBuoy, LogOut, ArrowLeft, Landmark, Moon, Sun, Contrast, X, Check, Phone, Mail, Award, CheckCircle2, Globe } from 'lucide-react';
import StatGrid from '../components/StatGrid';
import { Language } from '../i18n';

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
  currentTheme: string;
  setTheme: (theme: string) => void;
  onUpdateUser?: (updated: any) => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
}

export default function ProfileScreen({ user, onLogout, currentTheme, setTheme, onUpdateUser, language = 'en', setLanguage }: ProfileScreenProps) {
  const [view, setView] = useState<'profile' | 'theme' | 'language'>('profile');
  const [activeModal, setActiveModal] = useState<'edit' | 'permissions' | 'support' | null>(null);

  
  // Profile edit form state
  const [name, setName] = useState(user?.name || user?.username || 'Officer Shrey');
  const [email, setEmail] = useState(user?.email || 'shrey.legalmetrology@delhi.gov.in');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [region, setRegion] = useState(user?.region || 'New Delhi NCR');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state whenever user prop updates or mounts
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      else if (user.username) setName(user.username);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.region) setRegion(user.region);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { 
      ...user, 
      name: name.trim(), 
      email: email.trim(), 
      phone: phone.trim(), 
      region: region.trim() 
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
      <div className="flex flex-col gap-6">
        <section className="flex items-center gap-3">
          <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[28px] leading-[32px] font-bold m-0">App theme</h1>
        </section>

        <section className="bg-surface rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Live preview</span>
          <span className="font-display text-[32px] font-bold leading-none capitalize">{currentTheme.replace('-', ' ')}</span>
          <span className="text-[13px] text-fg-muted">Compliance status rows rendered on flat charcoal tiles, outline-only status badges, single warm accent.</span>
          <div className="flex gap-2 mt-2">
            <span className="w-9 h-9 rounded-sm flex-shrink-0 bg-canvas border border-divider"></span>
            <span className="w-9 h-9 rounded-sm flex-shrink-0 bg-surface"></span>
            <span className="w-9 h-9 rounded-sm flex-shrink-0 bg-fg"></span>
            <span className="w-9 h-9 rounded-sm flex-shrink-0 bg-accent"></span>
            <span className="w-9 h-9 rounded-sm flex-shrink-0 bg-fg-muted"></span>
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Pass
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-error">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Fail
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Review
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Available themes</span>
          <div className="flex flex-col">
            {[
              { id: 'civic-ledger', label: 'Civic Ledger', desc: 'Pure black canvas · outline status badges', Icon: Landmark },
              { id: 'default-noir', label: 'Default Noir', desc: 'Original PaarakhMetric charcoal build', Icon: Moon },
              { id: 'daylight-registry', label: 'Daylight Registry', desc: 'Light-surface variant for field-office desks', Icon: Sun },
              { id: 'high-contrast', label: 'High Contrast', desc: 'Accessibility mode · larger status glyphs', Icon: Contrast },
            ].map(theme => (
              <button 
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className="flex items-center gap-3 bg-surface rounded-2xl p-5 text-left w-full transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-fg mb-3 active:scale-99"
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-surface-recessed text-fg-muted">
                  <theme.Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[16px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis">{theme.label}</span>
                  <span className="text-[13px] text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">{theme.desc}</span>
                </span>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border-[1.5px] border-divider flex items-center justify-center ${currentTheme === theme.id ? 'after:content-[\'\'] after:w-2.5 after:h-2.5 after:rounded-full after:bg-accent' : ''}`}></span>
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
      <div className="flex flex-col gap-6">
        <section className="flex items-center gap-3">
          <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[28px] leading-[32px] font-bold m-0">Language / भाषा</h1>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Select language</span>
          <div className="flex flex-col gap-3">
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
                <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-surface-recessed text-accent font-bold text-lg">
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
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[32px] leading-[32px] font-bold m-0">Profile</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('language')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0" title="Language Settings">
            <Globe className="w-5 h-5" />
          </button>
          <button onClick={() => setView('theme')} className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0" title="Theme Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </section>


      <section className="bg-surface rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-[88px] h-[88px] rounded-full bg-surface-recessed flex items-center justify-center text-fg font-display text-[32px] font-bold">
          {name?.substring(0,2)?.toUpperCase() || 'OF'}
        </div>
        <div>
          <p className="font-display text-[32px] font-bold leading-none m-0">{name}</p>
          <p className="text-[13px] text-fg-muted font-medium mt-1">Field Officer · Officer ID OF-2291</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider text-success mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>Session active
        </span>
      </section>

      <StatGrid 
        columns={2}
        items={[
          { id: 'region', label: 'Assigned region', value: region },
          { id: 'version', label: 'App version', value: 'v1.0.0' }
        ]} 
      />

      <section className="flex flex-col gap-3">
        <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Account & Operations</span>
        <div className="flex flex-col">
          <button 
            onClick={() => setActiveModal('edit')}
            className="flex items-center gap-3 w-full bg-transparent border-b border-divider py-5 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-fg focus-visible:rounded-lg"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface text-fg-muted">
              <UserCog className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[16px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis">Edit profile details</span>
              <span className="text-[13px] text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">Name, contact, assigned district</span>
            </span>
          </button>
          
          <button 
            onClick={() => setActiveModal('permissions')}
            className="flex items-center gap-3 w-full bg-transparent border-b border-divider py-5 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-fg focus-visible:rounded-lg"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface text-fg-muted">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[16px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis">Role &amp; permissions</span>
              <span className="text-[13px] text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">Field Officer · L2 inspection rights</span>
            </span>
          </button>
          
          <button 
            onClick={() => setActiveModal('support')}
            className="flex items-center gap-3 w-full bg-transparent border-b border-divider py-5 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-fg focus-visible:rounded-lg"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface text-fg-muted">
              <LifeBuoy className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[16px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis">Contact support</span>
              <span className="text-[13px] text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">Compliance desk · Mon–Sat, 9am–6pm</span>
            </span>
          </button>
          
          <button onClick={onLogout} className="flex items-center gap-3 w-full bg-transparent py-5 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-fg focus-visible:rounded-lg">
            <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface text-error">
              <LogOut className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[16px] font-semibold text-error whitespace-nowrap overflow-hidden text-ellipsis">Log out</span>
              <span className="text-[13px] text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">Ends this session on this device</span>
            </span>
          </button>
        </div>
        <p className="text-center text-[12px] text-fg-muted pt-2 tracking-[0.02em]">PaarakhMetric v1.0.0 · Build 1001</p>
      </section>

      {/* Edit Profile Modal */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-canvas/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl p-6 border border-divider flex flex-col gap-5">
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
                <label className="text-xs font-semibold text-fg-muted">Mobile Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-fg-muted">Assigned Jurisdiction</label>
                <input 
                  type="text" 
                  value={region} 
                  onChange={e => setRegion(e.target.value)} 
                  className="mt-1 w-full bg-surface-recessed border border-divider rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-accent font-body"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 rounded-full bg-surface-elevated text-fg font-semibold text-sm active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-full bg-accent text-on-accent font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {savedSuccess ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role & Permissions Modal */}
      {activeModal === 'permissions' && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-canvas/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl p-6 border border-divider flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-accent" />
                <h3 className="font-display text-xl font-bold text-fg">Role & Permissions</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-fg-muted hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-surface-elevated p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-fg text-sm">Designation Tier</div>
                  <div className="text-xs text-fg-muted">Level 2 Field Metrology Inspector</div>
                </div>
                <Award className="w-5 h-5 text-accent" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-fg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>On-site Legal Metrology Package Seizure &amp; Tagging</span>
                </div>
                <div className="flex items-center gap-2 text-fg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Statutory Rule 6/7 OCR Declaration Overrides</span>
                </div>
                <div className="flex items-center gap-2 text-fg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Direct Export to National Metrology Registry</span>
                </div>
                <div className="flex items-center gap-2 text-fg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Instant PDF Violation Notice Dispatch</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-full bg-accent text-on-accent font-semibold text-sm active:scale-95 transition-transform"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-canvas/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl p-6 border border-divider flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-6 h-6 text-accent" />
                <h3 className="font-display text-xl font-bold text-fg">Compliance Support</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-fg-muted hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-fg-muted">For field assistance, rule clarifications, or offline sync issues, reach out to the dedicated desk:</p>

            <div className="flex flex-col gap-3">
              <a href="tel:1800114000" className="flex items-center gap-3 bg-surface-elevated p-3.5 rounded-xl text-fg hover:bg-surface-recessed transition-colors">
                <Phone className="w-5 h-5 text-accent" />
                <div>
                  <div className="font-semibold text-sm">1800-11-4000 (Toll Free)</div>
                  <div className="text-[11px] text-fg-muted">Metrology Field Helpdesk (Mon-Sat, 9AM-6PM)</div>
                </div>
              </a>

              <a href="mailto:support@paarakhmetric.gov.in" className="flex items-center gap-3 bg-surface-elevated p-3.5 rounded-xl text-fg hover:bg-surface-recessed transition-colors">
                <Mail className="w-5 h-5 text-accent" />
                <div>
                  <div className="font-semibold text-sm">support@paarakhmetric.gov.in</div>
                  <div className="text-[11px] text-fg-muted">Official Help &amp; Technical Support</div>
                </div>
              </a>
            </div>

            <button 
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-full bg-surface-elevated text-fg font-semibold text-sm active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
