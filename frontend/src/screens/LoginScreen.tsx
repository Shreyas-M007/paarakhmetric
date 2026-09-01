import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Globe, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../i18n';

interface LoginScreenProps {
  onLogin: (e: React.FormEvent) => void;
  loginUsername: string;
  setLoginUsername: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginError: string;
  language: Language;
  setLanguage: (l: Language) => void;
}

const languages = [
  { code: 'en' as Language, symbol: 'A', label: 'English', sub: 'English' },
  { code: 'hi' as Language, symbol: 'अ', label: 'हिन्दी', sub: 'Hindi' },
  { code: 'kn' as Language, symbol: 'ಅ', label: 'ಕನ್ನಡ', sub: 'Kannada' },
];

export default function LoginScreen({
  onLogin, loginUsername, setLoginUsername, loginPassword, setLoginPassword,
  loginError, language, setLanguage
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const t = translations[language];

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-5 py-12 relative">
      {/* Language switcher */}
      <div className="absolute top-6 right-6">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider bg-surface text-fg text-xs font-bold transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span className="w-5 h-5 rounded-md bg-accent text-on-accent flex items-center justify-center text-xs font-bold">
              {language === 'en' ? 'A' : language === 'hi' ? 'अ' : 'ಅ'}
            </span>
            <ChevronDown className="w-3 h-3 text-fg-muted" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-elevated rounded-xl border border-divider py-1.5 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                    language === lang.code ? 'bg-accent/10 text-accent font-bold' : 'text-fg-muted hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-surface flex items-center justify-center font-bold text-fg text-xs">
                      {lang.symbol}
                    </span>
                    <div>
                      <p className="leading-tight font-medium text-fg">{lang.label}</p>
                      <p className="text-[10px] text-fg-muted font-normal">{lang.sub}</p>
                    </div>
                  </div>
                  {language === lang.code && <Check className="w-4 h-4 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl border border-divider">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-on-accent">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-fg font-display">{t.appName}</h2>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider">{t.appSubtitle}</p>
          <p className="mt-2 text-xs text-fg-muted">{t.loginSubtitle}</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onLogin}>
          {loginError && (
            <div className="rounded-lg bg-error/10 p-3 border border-error/20 flex gap-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-fg-muted">{t.username}</label>
              <input
                type="text" required value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-divider px-3 py-2.5 text-fg placeholder-fg-muted bg-surface-recessed text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent font-body"
                placeholder="officer_shrey"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-fg-muted">{t.password}</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"} required value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="block w-full rounded-xl border border-divider pl-3 pr-10 py-2.5 text-fg placeholder-fg-muted bg-surface-recessed text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent font-body"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-on-accent hover:brightness-110 active:scale-98 transition-all">
            {t.signIn}
          </button>

          <div className="text-center text-[10px] text-fg-muted space-y-1 pt-2 border-t border-divider">
            <p>{t.defaultCredentials}</p>
            <p className="text-success font-medium">{t.offlineFallback}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
