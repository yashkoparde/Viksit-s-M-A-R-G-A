import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck,
  Building,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  Camera,
  ClipboardList,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Work, Role } from '../../types';

interface WorkDetailDrawerProps {
  work: Work | null;
  role?: Role;
  currentRole?: Role;
  isOpen?: boolean;
  onClose: () => void;
  onOpenRiskExplanation: (work: Work) => void;
  onOpenEscalation?: (work: Work) => void;
  onOpenSiteVisit?: (work: Work) => void;
  onActionComplete?: (actionTitle: string) => void;
}

export const WorkDetailDrawer: React.FC<WorkDetailDrawerProps> = ({
  work,
  role,
  currentRole,
  isOpen,
  onClose,
  onOpenRiskExplanation,
  onOpenEscalation,
  onOpenSiteVisit,
  onActionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'finance' | 'evidence' | 'timeline' | 'actions'>('finance');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const effectiveRole = role || currentRole || 'MP';
  const effectiveIsOpen = isOpen !== undefined ? isOpen : !!work;

  if (!effectiveIsOpen || !work) return null;

  const triggerActionFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    if (onActionComplete) onActionComplete(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const statusStyles: Record<string, string> = {
    Ongoing: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Delayed: 'bg-amber-50 text-amber-800 border-amber-200',
    'Attention Required': 'bg-rose-50 text-rose-800 border-rose-200',
    'Substantially Complete': 'bg-blue-50 text-blue-800 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Under Review': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const riskBandStyles = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {work.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                    statusStyles[work.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {work.status}
                </span>
                <button
                  onClick={() => onOpenRiskExplanation(work)}
                  className={`text-xs px-2.5 py-0.5 rounded border font-medium flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity ${
                    riskBandStyles[work.risk.band]
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    Risk: {work.risk.band} ({work.risk.score}/100)
                  </span>
                </button>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">{work.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{work.category}</span>
                <span>•</span>
                <span>{work.constituency}, {work.district} ({work.state})</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Identity Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500 block">Recommended By:</span>
              <span className="font-medium text-slate-800 truncate block">{work.mpName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Implementing Agency:</span>
              <span className="font-medium text-slate-800 truncate block">{work.implementingAgency}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Stage:</span>
              <span className="font-medium text-slate-800 block">{work.lifecycleStage}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Target Completion:</span>
              <span className="font-medium text-slate-800 block">{work.dates.expectedCompletion}</span>
            </div>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionSuccessMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Location & Digital Verification Banner */}
        <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{work.location}</span>
          </div>
          {work.locationVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Verified Geotag
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
              Location not digitally verified
            </span>
          )}
        </div>

        {/* Tabs Header */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'finance'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Finance & Progress
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'evidence'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Evidence Timeline ({work.evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Lifecycle Audit Log
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Permitted Actions ({role})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'finance' && (
            <div className="space-y-5">
              {/* Progress Gauges */}
              <div className="border border-slate-200 rounded-md p-4 bg-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Physical vs Financial Execution</span>
                  <span className="text-slate-500">Last updated: {work.progress.lastUpdated}</span>
                </div>

                {/* Progress bars */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Physical Progress (Certified MB):</span>
                      <span className="font-mono font-semibold text-slate-900">{work.progress.physical}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all"
                        style={{ width: `${work.progress.physical}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Financial Progress (Disbursed/Utilized):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {work.progress.financial.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          work.progress.financial > work.progress.physical + 20 ? 'bg-orange-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(work.progress.financial, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mismatch Warning */}
                {work.progress.financial > work.progress.physical + 15 && (
                  <div className="mt-3 p-2.5 rounded bg-orange-50 border border-orange-200 text-xs text-orange-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Physical / Financial Mismatch Detected:</strong>
                      Recorded expenditure ({work.progress.financial.toFixed(1)}%) exceeds certified physical progress (
                      {work.progress.physical}%) by {(work.progress.financial - work.progress.physical).toFixed(1)}{' '}
                      percentage points.
                    </div>
                  </div>
                )}
              </div>

              {/* Strict Multi-Stage Financial Breakdown (Never collapsed into one number!) */}
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-800">
                  Authoritative Financial Position (Amounts in ₹ Lakhs)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Recommended Amount:</span>
                    <span className="font-mono font-medium text-slate-900">₹{work.financial.recommended.toFixed(2)} L</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between bg-slate-50/40">
                    <span className="text-slate-600">Administrative Sanction (AS):</span>
                    <span className="font-mono font-semibold text-slate-900">₹{work.financial.sanctioned.toFixed(2)} L</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Disbursed to Agency:</span>
                    <span className="font-mono font-medium text-slate-900">₹{work.financial.disbursed.toFixed(2)} L</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between bg-slate-50/40">
                    <span className="text-slate-600">Actual Certified Expenditure:</span>
                    <span className="font-mono font-semibold text-slate-900">₹{work.financial.expenditure.toFixed(2)} L</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Unutilized Agency Balance:</span>
                    <span className="font-mono font-medium text-slate-900">₹{work.financial.unutilized.toFixed(2)} L</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between bg-slate-50/40">
                    <span className="text-slate-600">Accrued Bank Interest:</span>
                    <span className="font-mono font-medium text-slate-700">₹{work.financial.interest.toFixed(2)} L</span>
                  </div>
                </div>
              </div>

              {/* UC & Statutory Compliance status */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-md bg-white">
                  <span className="text-slate-500 block mb-1">Utilisation Certificate (UC):</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-medium ${
                    work.ucStatus === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : work.ucStatus === 'Drafted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {work.ucStatus}
                  </span>
                </div>
                <div className="p-3 border border-slate-200 rounded-md bg-white">
                  <span className="text-slate-500 block mb-1">Inspection Status:</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-medium ${
                    work.inspectionStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : work.inspectionStatus === 'Scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {work.inspectionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mandatory Evidence Trail (Before → During → Inspection → Completion)
                </h3>
                {role === 'IA' && onOpenSiteVisit && (
                  <button
                    onClick={() => onOpenSiteVisit(work)}
                    className="text-xs px-2.5 py-1 rounded bg-slate-900 text-white flex items-center gap-1 hover:bg-slate-800"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Evidence</span>
                  </button>
                )}
              </div>

              {work.evidence.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded">
                  No photographic or documentary evidence uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {work.evidence.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-md p-3.5 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {item.stage}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 mt-1">{item.title}</h4>
                        </div>
                        {item.locationVerified ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Geotag
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            Location not digitally verified
                          </span>
                        )}
                      </div>

                      {item.coordinates && (
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Coordinates: {item.coordinates}</span>
                        </div>
                      )}

                      {item.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{item.notes}</p>}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>Uploaded by: {item.uploader} ({item.uploaderRole})</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Authoritative Lifecycle Milestones
              </h3>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-1">
                {work.timeline.map((entry) => (
                  <div key={entry.id} className="relative pl-5">
                    <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-900" />
                    <div className="bg-white border border-slate-200 rounded p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-900">{entry.stage}</span>
                        <span>{entry.timestamp}</span>
                      </div>
                      <p className="text-slate-700">{entry.remarks}</p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Recorded by: <span className="font-medium text-slate-800">{entry.actor}</span> ({entry.role})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                You are operating under role <strong>{effectiveRole}</strong>. Only actions permitted by your statutory purview are enabled below.
              </div>

              {/* Role Actions */}
              <div className="space-y-3">
                {effectiveRole === 'MP' && (
                  <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900">Legislative Oversight Action</h4>
                    <p className="text-xs text-slate-600">
                      Issue a formal inquiry memo to the District Magistrate requesting inspection of payment mismatch and delay bottlenecks.
                    </p>
                    <button
                      onClick={() => {
                        if (onOpenEscalation) onOpenEscalation(work);
                      }}
                      className="mt-2 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask District Authority (Generate Formal Memo)</span>
                    </button>
                  </div>
                )}

                {effectiveRole === 'DA' && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Order Statutory 10% Field Inspection</h4>
                      <p className="text-xs text-slate-600">
                        Assign Sub-Divisional Officer (SDO) or Executive Engineer to conduct physical verification and audit Measurement Book entries.
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`Formal DA 10% Inspection ordered for ${work.id}. SDO notified.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Order Statutory DA Inspection</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Request Financial Justification Notice</h4>
                      <p className="text-xs text-slate-600">
                        Issue notice to Implementing Agency to reconcile Voucher PUN-8839 with physical superstructure status.
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`Clarification memo served to Implementing Agency for ${work.id}. 7-day deadline.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        Issue Clarification Notice to IA
                      </button>
                    </div>
                  </div>
                )}

                {effectiveRole === 'IA' && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Field Site Visit & Evidence Capture</h4>
                      <p className="text-xs text-slate-600">
                        Open mobile-friendly field logger to certify milestone progress and upload geotagged site photographs.
                      </p>
                      {onOpenSiteVisit && (
                        <button
                          onClick={() => onOpenSiteVisit(work)}
                          className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Launch Field Site Visit Mode</span>
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Record Measurement Book (MB) Entry</h4>
                      <p className="text-xs text-slate-600">
                        Update official engineering measurement records. (Cannot move progress backward without audit justification).
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`MB Book entry dialog triggered for ${work.id}.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        Update Measurement Book
                      </button>
                    </div>
                  </div>
                )}

                {effectiveRole === 'STATE' && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Enroll in State 1% Oversight Inspection</h4>
                      <p className="text-xs text-slate-600">
                        Direct the State Chief Engineer Quality Control Cell to include this asset in the annual 1% sample quota.
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`Work ${work.id} enrolled in State 1% Quality Inspection sample.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Schedule State Quality Inspection</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">Add to Chief Secretary Review Agenda</h4>
                      <p className="text-xs text-slate-600">
                        Flag Pune district for persistent payment/progress deviations in the upcoming bi-annual State Review Briefing.
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`Work ${work.id} appended to State Review Briefing Agenda.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        Append to Review Briefing
                      </button>
                    </div>
                  </div>
                )}

                {effectiveRole === 'MOSPI' && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">National Pre-Audit Triage Enrollment</h4>
                      <p className="text-xs text-slate-600">
                        Recommend work for prioritized sample audit during the upcoming Comptroller & Auditor General (CAG) compliance cycle.
                      </p>
                      <button
                        onClick={() => triggerActionFeedback(`Work ${work.id} verified in National Pre-Audit Triage queue.`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Enroll in CAG Pre-Audit Queue</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={() => onOpenRiskExplanation(work)}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Inspect Risk Signals ({work.risk.signals.length})</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
