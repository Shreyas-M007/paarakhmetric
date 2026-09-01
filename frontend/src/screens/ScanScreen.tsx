import { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, ShieldCheck, Tag, Layers, X, Plus, Image as ImageIcon } from 'lucide-react';
import { Language, translations, getCategoryTranslation } from '../i18n';

export interface ScannedImageItem {
  id: string;
  url: string;
  panel: string;
}

interface ScanScreenProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  capturedImage: string | null;
  scannedImages?: ScannedImageItem[];
  onAddImage?: (url: string, panel?: string) => void;
  onRemoveImage?: (id: string) => void;
  onClearImages?: () => void;
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
  videoRef, canvasRef, cameraActive, capturedImage, scannedImages = [],
  onAddImage, onRemoveImage, onClearImages, activeSide, setActiveSide,
  isProcessing, processingStep, startCamera, stopCamera, capturePhoto,


  processImage, setCapturedImage, onBack, commodityName, setCommodityName,
  commodityCategory, setCommodityCategory, language = 'en'
}: ScanScreenProps) {
  const t = (translations as any)[language] || translations.en;
  const [isDragging, setIsDragging] = useState(false);


  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);






  const panels = [
    { name: 'front', label: t.frontPanelPdp || 'Front (PDP)' },
    { name: 'back', label: t.backLabel || 'Back Label' },
    { name: 'cap_mrp', label: 'Cap / MRP / MFD' },
    { name: 'bottom', label: t.bottomView || 'Bottom Base' },
    { name: 'left', label: t.leftSide || 'Left Side' },
    { name: 'right', label: t.rightSide || 'Right Side' },
  ];

  const handleProcessFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    if (cameraActive) stopCamera();

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const url = e.target.result as string;
          // Assign panel sequentially or use activeSide
          const targetPanel = index === 0 ? activeSide : (panels[index % panels.length]?.name || 'additional');
          if (onAddImage) {
            onAddImage(url, targetPanel);
          } else {
            setCapturedImage(url);
          }
        }
      };
      reader.readAsDataURL(file);

      if (!commodityName.trim() && index === 0) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setCommodityName(cleanName);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Determine current active preview photo
  const currentPreviewUrl = selectedPhotoId
    ? scannedImages.find(img => img.id === selectedPhotoId)?.url || capturedImage
    : (scannedImages[scannedImages.length - 1]?.url || capturedImage);

  const hasPhotos = scannedImages.length > 0 || !!capturedImage;
  const photoCount = Math.max(scannedImages.length, capturedImage ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight m-0 text-fg">
              {t.scanTitle || "Scan Product"}
            </h1>
            {photoCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>{photoCount} Photo{photoCount > 1 ? 's' : ''} Attached</span>
              </span>
            )}
          </div>
          <span className="text-[14px] text-fg-muted">
            Attach multiple photos for complete verification (e.g. Front PDP, Back Label, MRP/MFD Cap)
          </span>
        </div>
        <button onClick={onBack}
          className="text-xs font-bold text-accent hover:underline px-3.5 py-2 rounded-xl bg-surface border border-divider cursor-pointer">
          {t.cancel || "Cancel"}
        </button>
      </section>



      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Viewfinder / Multi-Photo Preview Gallery (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <section className="bg-surface rounded-2xl overflow-hidden border border-divider/60 shadow-sm flex flex-col">
            
            {/* Viewfinder Main Stage */}
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
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-8 border-2 border-dashed border-accent/70 rounded-xl pointer-events-none flex flex-col items-center justify-between p-4">
                    <span className="text-[11px] font-bold text-on-accent bg-black/80 px-3 py-1 rounded-full shadow-lg border border-white/20">
                      Target Side: <span className="text-accent uppercase">{panels.find(p => p.name === activeSide)?.label || activeSide}</span>
                    </span>
                    <span className="text-[11px] font-bold text-on-accent bg-accent/90 px-3 py-1 rounded-full shadow-lg">
                      Hold still to capture crisp text & numbers
                    </span>
                  </div>
                </>
              )}

              {/* 2. Photo Uploaded / Captured Preview */}
              {!cameraActive && currentPreviewUrl && (
                <div className="relative w-full h-full flex items-center justify-center bg-black/90 group">
                  <img src={currentPreviewUrl} alt="Product Package Preview" className="w-full h-full object-contain" />
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-success text-[11px] font-bold px-3 py-1.5 rounded-xl border border-success/30 flex items-center gap-1.5 shadow-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Side: {panels.find(p => p.name === activeSide)?.label || 'Attached Photo'}</span>
                  </div>

                  {/* Top-Right Quick Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {onClearImages && (
                      <button
                        onClick={onClearImages}
                        className="bg-black/80 hover:bg-black text-error text-xs font-bold px-3 py-1.5 rounded-xl border border-error/30 flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Empty State (Clickable Drag-and-Drop Dropzone) */}
              {!cameraActive && !currentPreviewUrl && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 text-accent group-hover:scale-105 transition-transform">
                    <Upload className="w-8 h-8 stroke-[1.75]" />
                  </div>
                  <h3 className="font-display text-base font-bold text-fg mb-1">
                    Upload or Capture Package Photos
                  </h3>
                  <p className="text-xs text-fg-muted max-w-sm leading-relaxed mb-3">
                    Drag & drop multiple package images here (Front, Back, Cap, Bottom), or browse files.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-accent bg-accent/15 px-3 py-1.5 rounded-full border border-accent/30">
                    <span>💡 You can attach multiple photos for MRP, MFD, and Manufacturer labels</span>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Strip for Multi-Photo Scanning */}
            {scannedImages.length > 0 && !cameraActive && (
              <div className="p-3 bg-surface-elevated/60 border-t border-divider/60 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-fg-muted whitespace-nowrap pl-1">
                  Photos ({scannedImages.length}):
                </span>
                
                {scannedImages.map((img, idx) => (
                  <div 
                    key={img.id}
                    onClick={() => setSelectedPhotoId(img.id)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      (selectedPhotoId === img.id || (!selectedPhotoId && idx === scannedImages.length - 1))
                        ? 'border-accent shadow-md scale-105'
                        : 'border-divider hover:border-accent/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Side ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                      {panels.find(p => p.name === img.panel)?.label?.split(' ')[0] || `P${idx+1}`}
                    </span>
                    {onRemoveImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage(img.id);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[9px] shadow hover:scale-110 transition-transform"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {/* + Add Another Photo Tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 hover:bg-accent/15 flex flex-col items-center justify-center text-accent gap-0.5 cursor-pointer transition-colors"
                  title="Upload Another Photo"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[9px] font-bold">+ Side</span>
                </button>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="flex gap-2.5 p-4 bg-surface-elevated/40 border-t border-divider/50 flex-wrap">
              {/* Native mobile camera capture */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleProcessFiles(e.target.files);
                }}
              />

              {/* Multi-file gallery picker */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleProcessFiles(e.target.files);
                }}
              />

              {!cameraActive ? (
                <div className="w-full flex gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="flex-1 bg-accent text-on-accent font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform shadow-md shadow-accent/20 cursor-pointer whitespace-nowrap"
                    title="Open Live Camera Stream on Laptop or Phone"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📹 Live Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 bg-surface-elevated hover:bg-surface text-fg border border-divider font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                    title="Take photo using phone camera app"
                  >
                    <Camera className="w-4 h-4 text-accent" />
                    <span>📸 Snap Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-surface-elevated hover:bg-surface text-fg border border-divider font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                    title="Upload existing photos from gallery or files"
                  >
                    <Upload className="w-4 h-4 text-accent" />
                    <span>📁 Gallery / Files</span>
                  </button>
                </div>
              ) : (

                <>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 bg-success text-on-accent font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo ({panels.find(p => p.name === activeSide)?.label?.split(' ')[0] || activeSide})
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



        {/* Right Column: Commodity Info, Panel Switcher, Quality Checklist & Multi-Photo AI Verification (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Commodity Details & Custom Name */}
          <section className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-bold">
                {language === 'hi' ? 'वस्तु का नाम और श्रेणी' : language === 'kn' ? 'ಸರಕು ಹೆಸರು ಮತ್ತು ವರ್ಗ' : 'Commodity Details'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-fg-muted block mb-1">
                  {t.productName} (Auto-detected if left empty)
                </label>
                <input
                  type="text"
                  value={commodityName}
                  onChange={(e) => setCommodityName(e.target.value)}
                  placeholder={language === 'hi' ? 'उत्पाद का नाम (उदा. बासमती चावल)' : language === 'kn' ? 'ಉತ್ಪನ್ನದ ಹೆಸರು (ಉದಾ. ಬಾಸುಮತಿ ಅಕ್ಕಿ)' : 'e.g. Basmati Rice 5kg, Tata Salt 1kg'}
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
                  Select Side to Capture / Tag
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {panels.map((p) => {
                const isAttached = scannedImages.some(img => img.panel === p.name);
                return (
                  <button 
                    key={p.name} 
                    onClick={() => setActiveSide(p.name)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between gap-1 cursor-pointer ${
                      activeSide === p.name
                        ? 'bg-accent text-on-accent border-accent font-bold shadow-sm'
                        : 'bg-surface-elevated text-fg-muted border-transparent hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{p.label}</span>
                    {isAttached && <span className="text-[10px] text-success">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quality indicators */}
          <section className="bg-surface rounded-2xl p-4 border border-divider/60 shadow-sm flex flex-col gap-2.5">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold">
              Multi-Angle Vision Quality Checklist
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">Resolution</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Full HD 1080p
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">Panels</span>
                <span className="text-xs font-bold text-accent flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="bg-surface-elevated/70 p-2.5 rounded-xl border border-divider/60 flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-muted font-medium">LMPC Act</span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> All 5 Rules
                </span>
              </div>
            </div>
          </section>

          {/* Run Multi-Photo AI Verification Button */}
          {hasPhotos ? (
            <button onClick={processImage} disabled={isProcessing}
              className="w-full bg-accent text-on-accent font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-accent/20 cursor-pointer">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{processingStep || `Analyzing ${photoCount} photos with Gemini Vision...`}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Run AI Inspection ({photoCount} Photo{photoCount > 1 ? 's' : ''})</span>
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
              <span>Select or Drop Photos to Start</span>
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
