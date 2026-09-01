import { X, Check, ArrowRight, RefreshCw, CheckCircle2, Package } from 'lucide-react';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchQueue: Array<{ file: File; name: string; previewUrl: string }>;
  batchCurrentIndex: number;
  batchActiveAnalysis: any;
  isBatchProcessing: boolean;
  isBatchComplete: boolean;
  onApprove: () => void;
}

export default function BatchModal({
  isOpen, onClose, batchQueue, batchCurrentIndex,
  batchActiveAnalysis, isBatchProcessing, isBatchComplete, onApprove
}: BatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-canvas/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-divider">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-divider sticky top-0 bg-surface z-10">
          <div>
            <h2 className="font-display text-[20px] font-bold text-fg">Batch Review</h2>
            <span className="text-[13px] text-fg-muted">
              {isBatchComplete
                ? `All ${batchQueue.length} items processed`
                : `Item ${batchCurrentIndex + 1} of ${batchQueue.length}`
              }
            </span>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-elevated text-fg-muted flex items-center justify-center hover:text-fg active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-elevated">
          <div className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((batchCurrentIndex + (isBatchComplete ? 1 : 0)) / batchQueue.length) * 100}%` }} />
        </div>

        <div className="p-5">
          {/* Complete state */}
          {isBatchComplete && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-success" />
              <div>
                <p className="font-display text-[24px] font-bold text-fg">Batch Complete</p>
                <p className="text-[13px] text-fg-muted mt-1">{batchQueue.length} items reviewed and logged</p>
              </div>
              <button onClick={onClose}
                className="bg-accent text-on-accent font-semibold py-3 px-8 rounded-full text-sm active:scale-95 transition-transform">
                Done
              </button>
            </div>
          )}

          {/* Processing state */}
          {!isBatchComplete && isBatchProcessing && (
            <div className="flex flex-col items-center gap-4 py-8">
              <RefreshCw className="w-10 h-10 text-accent animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-fg">{batchQueue[batchCurrentIndex]?.name}</p>
                <p className="text-xs text-fg-muted mt-1">Running OCR & compliance checks...</p>
              </div>
            </div>
          )}

          {/* Review state */}
          {!isBatchComplete && !isBatchProcessing && batchActiveAnalysis && (
            <div className="flex flex-col gap-5">
              {/* Image preview */}
              <div className="relative aspect-square bg-surface-recessed rounded-xl overflow-hidden">
                <img src={batchActiveAnalysis.imageUrl} alt="Batch item"
                  className="w-full h-full object-contain" />
              </div>

              {/* Product info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-fg-muted" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[15px] font-semibold text-fg block truncate">{batchActiveAnalysis.product?.name}</span>
                    <span className="text-[12px] text-fg-muted">{batchActiveAnalysis.product?.category || 'General'}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold border border-divider ${
                  batchActiveAnalysis.analysis?.status === 'COMPLIANT' ? 'text-success' :
                  batchActiveAnalysis.analysis?.status === 'NON_COMPLIANT' ? 'text-error' : 'text-warning'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {batchActiveAnalysis.analysis?.status || 'COMPLIANT'}
                </span>
              </div>

              {/* Declarations */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Declarations</span>
                <div className="bg-surface-elevated rounded-xl p-3 space-y-2">
                  {Object.entries(batchActiveAnalysis.declarations || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between text-[13px] border-b border-divider pb-1.5 last:border-0 last:pb-0">
                      <span className="text-fg-muted capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-fg font-mono">{val?.value || val || 'Detected'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              {batchActiveAnalysis.rules?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold">Rule Checks</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {batchActiveAnalysis.rules.map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated text-[13px]">
                        <span className="text-fg truncate max-w-[200px]">{rule.details}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          rule.status === 'PASS' ? 'text-success' : 'text-error'
                        }`}>{rule.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approve button */}
              <div className="flex items-center justify-between pt-3 border-t border-divider">
                <span className="text-[13px] text-fg-muted">
                  {batchQueue.length - batchCurrentIndex - 1} remaining
                </span>
                <button onClick={onApprove}
                  className="bg-accent text-on-accent font-semibold py-3 px-6 rounded-full text-sm flex items-center gap-2 active:scale-95 transition-transform">
                  <Check className="w-4 h-4" /> Approve
                  {batchCurrentIndex < batchQueue.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
