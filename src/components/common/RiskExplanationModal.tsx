import React from 'react';
import { X, AlertCircle, ShieldAlert, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { RiskSignal, Work } from '../../types';

interface RiskExplanationModalProps {
  work?: Work | null;
  workId?: string;
  workName?: string;
  riskScore?: number;
  riskBand?: 'Low' | 'Medium' | 'High' | 'Critical';
  signals?: RiskSignal[];
  isOpen: boolean;
  onClose: () => void;
  onTakeAction?: () => void;
  actionLabel?: string;
}

export const RiskExplanationModal: React.FC<RiskExplanationModalProps> = ({
  work,
  workId,
  workName,
  riskScore,
  riskBand,
  signals,
  isOpen,
  onClose,
  onTakeAction,
  actionLabel = 'Take Verification Action',
}) => {
  if (!isOpen) return null;

  const effectiveWorkId = work?.id || workId || 'WRK';
  const effectiveWorkName = work?.name || workName || 'Constituency Work';
  const effectiveRiskScore = work?.risk?.score ?? riskScore ?? 0;
  const effectiveRiskBand = work?.risk?.band || riskBand || 'Low';
  const effectiveSignals = work?.risk?.signals || signals || [];

  const bandStyles = {
    Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-800 border-amber-200',
    High: 'bg-orange-50 text-orange-800 border-orange-200',
    Critical: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">{effectiveWorkId}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium border ${bandStyles[effectiveRiskBand]}`}>
                  {effectiveRiskBand} Risk · {effectiveRiskScore}/100
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-900 truncate max-w-md">{effectiveWorkName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Guardrail Note */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>MARGA Operational Protocol:</strong> Risk scores are statistical signals to prioritize human verification. They do not constitute legal proof of misconduct.
          </span>
        </div>

        {/* Signals Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Why this work was flagged ({effectiveSignals.length} Active Signals)
          </h3>

          {effectiveSignals.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
              No critical risk signals flagged for this work. Operations are within standard statistical tolerances.
            </div>
          ) : (
            effectiveSignals.map((sig, idx) => (
              <div key={sig.id || idx} className="border border-slate-200 rounded-md p-4 bg-white space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Signal {idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">{sig.title}</h4>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded uppercase ${
                      sig.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : sig.severity === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sig.severity}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{sig.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-medium text-slate-900 block mb-0.5">Recorded Evidence:</span>
                    <span className="text-slate-600">{sig.evidence}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-medium text-slate-900 block mb-0.5">Peer Baseline Comparison:</span>
                    <span className="text-slate-600">{sig.comparison}</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 px-3 py-2 rounded text-xs text-slate-600 flex items-center gap-2 border border-slate-150">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Governing Rule:</strong> {sig.rule}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Audit trail logged under MARGA Oversight Rules</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {onTakeAction && (
              <button
                onClick={() => {
                  onClose();
                  onTakeAction();
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
