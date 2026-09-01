import { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, ShieldCheck, Tag, Layers, X } from 'lucide-react';
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
  commodityCategory, setCommodityCategory, language = 'en'
}: ScanScreenProps) {
  const t = translations[language] || translations.en;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const panels = [
    { name: 'front', label: t.frontPanelPdp },
    { name: 'back', label: t.backLabel },
    { name: 'left', label: t.leftSide },
    { name: 'right', label: t.rightSide },
    { name: 'top', label: t.topView },
    { name: 'bottom', label: t.bottomView },
  ];

  const handleProcessFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (cameraActive) stopCamera();
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCapturedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    if (!commodityName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setCommodityName(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight m-0 text-fg">
            {t.scanTitle || "Scan Product"}
          </h1>
          <span className="text-[14px] text-fg-muted">
            {t.scanSubtitle || "Capture or upload a package label for AI statutory verification"}
          </span>
        </div>
        <button onClick={onBack}
          className="text-xs font-bold text-accent hover:underline px-3.5 py-2 rounded-xl bg-surface border border-divider cursor-pointer">
          {t.cancel || "Cancel"}
        </button>
      </section>

      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Viewfinder / Upload Dropzone / Photo Preview (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <section className="bg-surface rounded-2xl overflow-hidden border border-divider/60 shadow-sm flex flex-col">
            
            {/* Viewfinder Canvas */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative w-full aspect-[4/3] bg-surface-recessed flex items-center justify-center overflow-hidden transition-all ${
                isDragging ? 'border-2 border-dashed border-accent bg-accent/5' : ''
              }`}
            >
              {/* 1. Camera Active */}
              {cameraActive && (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-8 border-2 border-dashed border-accent/70 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] font-bold text-on-accent bg-accent/90 px-3 py-1 rounded-full shadow-lg">
                      {t.alignPdp || "Align Principal Display Panel (PDP)"}
                    </span>
                  </div>
                </>
              )}

              {/* 2. Photo Uploaded / Captured */}
              {!cameraActive && capturedImage && (
                <div className="relative w-full h-full flex items-center justify-center bg-black/90 group">
                  <img src={capturedImage} alt="Uploaded Package Preview" className="w-full h-full object-contain" />
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-success text-[11px] font-bold px-3 py-1.5 rounded-xl border border-success/30 flex items-center gap-1.5 shadow-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Photo Ready for AI Verification</span>
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-black/80 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-accent" /> Change Photo
                    </button>
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="bg-black/80 hover:bg-black text-error text-xs font-bold px-3 py-1.5 rounded-xl border border-error/30 flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Clear
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Empty State (Clickable Drag-and-Drop Dropzone) */}
              {!cameraActive && !capturedImage && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 text-accent group-hover:scale-105 transition-transform">
                    <Upload className="w-8 h-8 stroke-[1.75]" />
                  </div>
                  <h3 className="font-display text-base font-bold text-fg mb-1">
                    Click to Upload Package Photo
                  </h3>
                  <p className="text-xs text-fg-muted max-w-xs leading-relaxed mb-3">
                    Drag & drop your package image here, or browse files from your computer (JPG, PNG, WEBP).
                  </p>
                  <span className="text-[11px] font-bold text-accent bg-accent/15 px-3 py-1.5 rounded-full border border-accent/30">
                    Supports high-resolution labels & LMPC declarations
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex gap-2.5 p-4 bg-surface-elevated/40 border-t border-divider/50 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-accent text-on-accent font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform shadow-md shadow-accent/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{capturedImage ? "Replace Uploaded Photo" : "Upload Package Photo"}</span>
              </button>

              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => { setCapturedImage(null); startCamera(); }}
                  className="bg-surface hover:bg-surface-elevated text-fg border border-divider font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-accent" />
                  <span>Use Camera</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 bg-success text-on-accent font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> {t.capturePhoto || "Capture"}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-surface text-fg font-semibold py-3 px-4 rounded-xl text-xs active:scale-95 transition-transform border border-divider hover:bg-surface-elevated cursor-pointer"
                  >
                    {t.cancel || "Cancel"}
                  </button>
                </>
              )}
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

          {/* Run OCR / Compliance Verification Button */}
          {capturedImage ? (
            <button onClick={processImage} disabled={isProcessing}
              className="w-full bg-accent text-on-accent font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-accent/20 cursor-pointer">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{processingStep || t.processingCompliance || "Executing Gemini Vision OCR..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t.runOcr || "Run OCR & Compliance Verification"}</span>
                </>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-surface-elevated text-fg border border-accent/40 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform hover:bg-surface cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4 text-accent" />
              <span>Select or Drop an Image to Verify</span>
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
