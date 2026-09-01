import { Camera, Upload, RefreshCw, CheckCircle } from 'lucide-react';

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
}

const panels = [
  { name: 'front', label: 'Front (PDP)' },
  { name: 'back', label: 'Back Panel' },
  { name: 'left', label: 'Left Side' },
  { name: 'right', label: 'Right Side' },
  { name: 'top', label: 'Top View' },
  { name: 'bottom', label: 'Bottom View' },
];

export default function ScanScreen({
  videoRef, canvasRef, cameraActive, capturedImage, activeSide, setActiveSide,
  isProcessing, processingStep, startCamera, stopCamera, capturePhoto,
  processImage, setCapturedImage, onBack
}: ScanScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">Scan Product</h1>
          <span className="text-[15px] font-medium text-fg-muted">Capture or upload a package label</span>
        </div>
        <button onClick={onBack}
          className="text-[13px] font-semibold text-accent hover:underline">
          Cancel
        </button>
      </section>

      {/* Viewfinder */}
      <section className="bg-surface rounded-2xl overflow-hidden">
        <div className="relative w-full aspect-[4/3] bg-surface-recessed flex items-center justify-center">
          {cameraActive && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          {!cameraActive && capturedImage && (
            <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
          )}
          {!cameraActive && !capturedImage && (
            <div className="text-center p-6 text-fg-muted">
              <Camera className="w-12 h-12 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-medium">Camera inactive</p>
              <p className="text-xs text-fg-muted">Tap below to start or upload an image</p>
            </div>
          )}
          {/* Framing guide */}
          {cameraActive && (
            <div className="absolute inset-8 border-2 border-dashed border-fg/30 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-fg/80 bg-canvas/40 px-2 py-0.5 rounded">Align PDP within frame</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-4">
          {!cameraActive ? (
            <button onClick={startCamera}
              className="flex-1 bg-accent text-on-accent font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform">
              <Camera className="w-4 h-4" /> Start Camera
            </button>
          ) : (
            <>
              <button onClick={capturePhoto}
                className="flex-1 bg-success text-on-accent font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform">
                <Camera className="w-4 h-4" /> Capture
              </button>
              <button onClick={stopCamera}
                className="bg-surface-elevated text-fg font-semibold py-3 px-4 rounded-full text-sm active:scale-95 transition-transform">
                Cancel
              </button>
            </>
          )}

          <label className="flex-1 bg-surface-elevated text-fg font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-95 transition-transform">
            <Upload className="w-4 h-4" /> Upload
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => { setCapturedImage(reader.result as string); stopCamera(); };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      </section>

      {/* Panel selector */}
      <section className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">Active panel side</span>
        <div className="grid grid-cols-3 gap-2">
          {panels.map((panel) => (
            <button key={panel.name} onClick={() => setActiveSide(panel.name)}
              className={`p-3 rounded-lg border text-[13px] font-medium text-left transition-colors ${
                activeSide === panel.name
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-divider text-fg-muted hover:bg-surface'
              }`}>
              {panel.label}
              {capturedImage && activeSide === panel.name && (
                <span className="ml-2 w-2 h-2 rounded-full bg-accent inline-block" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Process button */}
      <section className="bg-surface rounded-2xl p-5">
        <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body block mb-3">Compliance Processing</span>
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
            <p className="text-xs text-fg-muted font-semibold text-center">{processingStep}</p>
          </div>
        ) : (
          <button disabled={!capturedImage} onClick={processImage}
            className={`w-full py-3.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              capturedImage
                ? 'bg-accent text-on-accent active:scale-95'
                : 'bg-surface-elevated text-fg-muted cursor-not-allowed'
            }`}>
            <CheckCircle className="w-5 h-5" />
            Run OCR & Compliance Check
          </button>
        )}
      </section>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
