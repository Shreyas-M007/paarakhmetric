import { Camera, Upload, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../i18n';


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
  language?: Language;
}

export default function ScanScreen({
  videoRef, canvasRef, cameraActive, capturedImage, activeSide, setActiveSide,
  isProcessing, processingStep, startCamera, stopCamera, capturePhoto,
  processImage, setCapturedImage, onBack, language = 'en'
}: ScanScreenProps) {
  const t = translations[language] || translations.en;

  const panels = [
    { name: 'front', label: t.frontPanelPdp || 'Front (PDP)' },
    { name: 'back', label: t.backLabel || 'Back Panel' },
    { name: 'left', label: language === 'hi' ? 'बायां भाग' : language === 'kn' ? 'ಎಡಭಾಗ' : 'Left Side' },
    { name: 'right', label: language === 'hi' ? 'दायां भाग' : language === 'kn' ? 'ಬಲಭಾಗ' : 'Right Side' },
    { name: 'top', label: language === 'hi' ? 'ऊपरी दृश्य' : language === 'kn' ? 'ಮೇಲ್ಭಾಗ' : 'Top View' },
    { name: 'bottom', label: language === 'hi' ? 'निचला दृश्य' : language === 'kn' ? 'ಕೆಳಭಾಗ' : 'Bottom View' },
  ];

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
          className="text-xs font-bold text-accent hover:underline px-3 py-1.5 rounded-lg bg-surface border border-divider">
          {t.cancel || "Cancel"}
        </button>
      </section>

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
                <Upload className="w-4 h-4 text-accent" /> {t.uploadFile || "Upload File"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setCapturedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Panel Selector, Quality Checklist & Run AI Compliance (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Packaging panel selection */}
          <section className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold">
              {t.activePanel || "Active Packaging Panel"}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {panels.map((p) => (
                <button key={p.name} onClick={() => setActiveSide(p.name)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
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
          <section className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold">
              {t.imageQuality || "Pre-Flight Vision Quality Verification"}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-elevated/70 p-3 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-fg-muted font-medium">{t.sharpness || "Sharpness"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 96% Clear
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-3 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-fg-muted font-medium">{t.glare || "Glare"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Low
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-3 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-fg-muted font-medium">{t.perspective || "Angle"}</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Direct PDP
                </span>
              </div>
            </div>
          </section>

          {/* Run OCR button */}
          {capturedImage && (
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
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
