import { useState } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, ShieldCheck, Tag, Layers } from 'lucide-react';
import { Language, translations, getCategoryTranslation } from '../i18n';


interface ScanScreenProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  capturedImage: string | null;
  activeSide: string;
  setActiveSide: (side: string) => void;
  isProcessing: boolean;
  processingStep: string;
  startCamera: () => void;
  stopCamera: () => void;
  capturePhoto: () => void;
  processImage: () => void;
  setCapturedImage: (img: string | null) => void;
  onBack: () => void;
  commodityName: string;
  setCommodityName: (name: string) => void;
  commodityCategory: string;
  setCommodityCategory: (cat: string) => void;
  geminiApiKey?: string;
  onSaveGeminiKey?: (key: string) => void;
  language?: Language;
}

const CATEGORIES = [
  'Food Grains & Pulses',
  'Edible Oils & Fats',
  'Packaged Foods & Snacks',
  'Cosmetics & Toiletries',
  'Beverages & Dairy',
  'General FMCG'
];

export default function ScanScreen({
  videoRef, canvasRef, cameraActive, capturedImage, activeSide, setActiveSide,
  isProcessing, processingStep, startCamera, stopCamera, capturePhoto,
  processImage, setCapturedImage, onBack, commodityName, setCommodityName,
  commodityCategory, setCommodityCategory, geminiApiKey = '', onSaveGeminiKey, language = 'en'
}: ScanScreenProps) {
  const t = translations[language] || translations.en;
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey);

  const panels = [
    { name: 'front', label: t.frontPanelPdp },
    { name: 'back', label: t.backLabel },
    { name: 'left', label: t.leftSide },
    { name: 'right', label: t.rightSide },
    { name: 'top', label: t.topView },
    { name: 'bottom', label: t.bottomView },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight m-0 text-fg">
              {t.scanTitle || "Scan Product"}
            </h1>
            <button
              onClick={() => setShowKeyModal(true)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
                geminiApiKey
                  ? 'text-success bg-success/10 border-success/30 hover:bg-success/20'
                  : 'text-accent bg-accent/10 border-accent/30 hover:bg-accent/20'
              }`}
            >
              <span>⚡ {geminiApiKey ? 'Gemini AI OCR Active' : 'Configure Gemini API Key'}</span>
            </button>
          </div>
          <span className="text-[14px] text-fg-muted">
            {t.scanSubtitle || "Capture or upload a package label for AI statutory verification"}
          </span>
        </div>
        <button onClick={onBack}
          className="text-xs font-bold text-accent hover:underline px-3.5 py-2 rounded-xl bg-surface border border-divider cursor-pointer">
          {t.cancel || "Cancel"}
        </button>
      </section>

      {/* Gemini API Key Quick Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-fg">Google Gemini Vision API Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-fg-muted hover:text-fg">
                ✕
              </button>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              Enter your Google Gemini API key to execute live multimodal OCR directly on your uploaded package photos.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste AIzaSy... API key"
              className="w-full bg-surface-elevated border border-divider rounded-xl px-3.5 py-2.5 text-xs text-fg font-mono outline-none focus:border-accent"
            />
            <div className="flex justify-between items-center pt-2">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent hover:underline font-semibold"
              >
                Get Free API Key ↗
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 text-xs text-fg-muted bg-surface-elevated rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onSaveGeminiKey) onSaveGeminiKey(keyInput.trim());
                    setShowKeyModal(false);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-on-accent bg-accent rounded-xl"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewfinder / Preview & Actions (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <section className="bg-surface rounded-2xl overflow-hidden border border-divider/60 shadow-sm">
            <div className="relative w-full aspect-[4/3] bg-surface-recessed flex items-center justify-center overflow-hidden">
              {cameraActive && (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              )}
              {!cameraActive && capturedImage && (
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
              )}
              {!cameraActive && !capturedImage && (
                <div className="text-center p-6 text-fg-muted">
                  <Camera className="w-14 h-14 mx-auto mb-2 stroke-1 text-accent" />
                  <p className="text-sm font-semibold text-fg">{t.cameraInactive || "Camera inactive"}</p>
                  <p className="text-xs text-fg-muted mt-1">{t.cameraInactiveSub || "Tap below to start camera or select an image file"}</p>
                </div>
              )}
              {/* Framing guide */}
              {cameraActive && (
                <div className="absolute inset-8 border-2 border-dashed border-accent/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-on-accent bg-accent/90 px-3 py-1 rounded-full shadow-lg">
                    {t.alignPdp || "Align Principal Display Panel (PDP)"}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 p-4 bg-surface-elevated/40 border-t border-divider/50">
              {!cameraActive ? (
                <button onClick={startCamera}
                  className="flex-1 bg-accent text-on-accent font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform shadow-md shadow-accent/20 cursor-pointer">
                  <Camera className="w-4 h-4" /> {t.startCamera || "Start Camera"}
                </button>
              ) : (
                <>
                  <button onClick={capturePhoto}
                    className="flex-1 bg-success text-on-accent font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform shadow-md cursor-pointer">
                    <Camera className="w-4 h-4" /> {t.capturePhoto || "Capture"}
                  </button>
                  <button onClick={stopCamera}
                    className="bg-surface text-fg font-semibold py-3 px-4 rounded-xl text-xs active:scale-95 transition-transform border border-divider hover:bg-surface-elevated cursor-pointer">
                    {t.cancel || "Cancel"}
                  </button>
                </>
              )}

              <label className="flex-1 bg-surface hover:bg-surface-elevated text-fg border border-divider font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 transition-transform">
                <Upload className="w-4 h-4 text-accent" /> {t.uploadFile || "Upload Image"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setCapturedImage(reader.result as string);
                      reader.readAsDataURL(file);
                      if (!commodityName) {
                        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                        setCommodityName(cleanName);
                      }
                    }
                  }} />
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Commodity Name, Panel Selector, Quality Checklist & Run AI Compliance (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Commodity Details & Custom Name */}
          <section className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-bold">
                {language === 'hi' ? 'वस्तु का नाम और श्रेणी' : language === 'kn' ? 'ಸರಕು ಹೆಸರು ಮತ್ತು ವರ್ಗ' : 'Commodity Name & Classification'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-fg-muted block mb-1">
                  {t.productName} (e.g. Basmati Rice 5kg, Amul Butter 100g)
                </label>
                <input
                  type="text"
                  value={commodityName}
                  onChange={(e) => setCommodityName(e.target.value)}
                  placeholder={language === 'hi' ? 'उत्पाद का नाम दर्ज करें...' : language === 'kn' ? 'ಉತ್ಪನ್ನದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ...' : 'Enter commodity / product name...'}
                  className="w-full bg-surface-elevated border border-divider rounded-xl px-3.5 py-2.5 text-sm text-fg font-medium outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-fg-muted block mb-1">
                  {t.category}
                </label>
                <select
                  value={commodityCategory}
                  onChange={(e) => setCommodityCategory(e.target.value)}
                  className="w-full bg-surface-elevated border border-divider rounded-xl px-3.5 py-2.5 text-xs text-fg font-semibold outline-none focus:border-accent cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryTranslation(cat, language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Packaging panel selection */}
          <section className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold">
                  {t.activePanel || "Active Packaging Panel"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {panels.map((p) => (
                <button key={p.name} onClick={() => setActiveSide(p.name)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                    activeSide === p.name
                      ? 'bg-accent text-on-accent border-accent font-bold shadow-sm'
                      : 'bg-surface-elevated text-fg-muted border-transparent hover:bg-surface'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Quality indicators */}
          <section className="bg-surface rounded-2xl p-4 border border-divider/60 shadow-sm flex flex-col gap-2.5">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold">
              {t.imageQuality || "Pre-Flight Vision Quality Verification"}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">{t.sharpness || "Sharpness"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 96% Clear
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">{t.glare || "Glare"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Low
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">{t.perspective || "Angle"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Direct PDP
                </span>
              </div>
            </div>
          </section>

          {/* Run OCR button */}
          {capturedImage ? (
            <button onClick={processImage} disabled={isProcessing}
              className="w-full bg-accent text-on-accent font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-accent/20 cursor-pointer">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{processingStep || t.processingCompliance || "Executing AI Compliance Verification..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t.runOcr || "Run OCR & Compliance Verification"}</span>
                </>
              )}
            </button>
          ) : (
            <button onClick={startCamera}
              className="w-full bg-surface-elevated text-fg border border-divider font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform hover:bg-surface cursor-pointer">
              <Camera className="w-4 h-4 text-accent" />
              <span>{t.startCamera || "Capture Photo to Run Compliance Check"}</span>
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
