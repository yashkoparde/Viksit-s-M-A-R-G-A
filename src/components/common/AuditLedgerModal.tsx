import React from 'react';
import { X, History, Shield, Filter, FileText } from 'lucide-react';
import { ActionLog } from '../../types';

interface AuditLedgerModalProps {
  logs: ActionLog[];
  isOpen: boolean;
  onClose: () => void;
  onSelectWork?: (workId: string) => void;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  logs,
  isOpen,
  onClose,
  onSelectWork,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Authoritative Evidence & Action Ledger</h2>
              <p className="text-xs text-slate-500">Immutable operational history recorded across all 5 tiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border border-slate-200 rounded p-3.5 bg-white text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  {log.workId && (
                    <button
                      onClick={() => onSelectWork && onSelectWork(log.workId!)}
                      className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      {log.workId}
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{log.details}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <span>
                  Actor: <strong className="text-slate-700">{log.actor}</strong> (Tier: {log.role})
                </span>
                <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {log.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>All entries cryptographically hashed and mirrored with MoSPI Central Ledger</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
