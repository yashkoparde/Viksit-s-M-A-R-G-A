import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2, FileText } from 'lucide-react';
import { Role } from '../../types';

interface ReportGeneratorModalProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  role,
  isOpen,
  onClose,
}) => {
  const [reportType, setReportType] = useState('mpr');
  const [period, setPeriod] = useState('aug-2026');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!isOpen) return null;

  const reportOptions: Record<Role, { id: string; label: string; desc: string }[]> = {
    MP: [
      { id: 'constituency-progress', label: 'Constituency Progress Report', desc: 'Summary of sanctioned vs completed works & funds' },
      { id: 'delayed-works', label: 'Delayed Works Dossier', desc: 'Itemized breakdown of bottlenecks & days stalled' },
      { id: 'utilization-summary', label: 'MPLADS Entitlement & Fund Utilization', desc: 'Audit-ready financial release status' },
    ],
    DA: [
      { id: 'mpr', label: 'Monthly Progress Report (MPR)', desc: 'Official statutory MPR format for State & MoSPI transmission' },
      { id: 'inspection-register', label: 'Statutory 10% Inspection Register', desc: 'Log of physical inspections, findings, and compliance' },
      { id: 'uc-clearance', label: 'Utilisation Certificate (UC) Clearance Ledger', desc: 'Pending vs submitted UCs with financial reconciliation' },
    ],
    IA: [
      { id: 'monthly-execution', label: 'Monthly Execution Statement (Form II)', desc: 'Measurement Book progress updates & expenditure' },
      { id: 'site-inspection-log', label: '100% Agency Site Inspection Log', desc: 'Geotagged site visits with engineer observations' },
      { id: 'completion-dossier', label: 'Work Completion & Final Accounts Dossier', desc: 'Includes draft UC, refund challans, and handover NOC' },
    ],
    STATE: [
      { id: 'state-briefing', label: 'State Review Briefing (11-Point Docket)', desc: 'Pre-assembled briefing document for Chief Secretary meeting' },
      { id: 'district-comparison', label: 'Inter-District Performance Scorecard', desc: 'Ranking by completion, risk signals, and inspection compliance' },
      { id: 'sc-st-monitoring', label: 'SC/ST Mandatory Earmarking Compliance Report', desc: 'District-wise tracking of 15% SC and 7.5% ST mandates' },
    ],
    MOSPI: [
      { id: 'national-annual', label: 'Annual Union MPLADS Implementation Report', desc: 'Macro release, absorption, and asset creation overview' },
      { id: 'pre-audit-summary', label: 'National Pre-Audit Triage & Anomaly Summary', desc: 'High-exposure works recommended for priority CAG scrutiny' },
      { id: 'data-integrity-audit', label: 'District Data Integrity & Reconciliation Audit', desc: 'Reconciliation variances between treasury and portal ledgers' },
    ],
  };

  const options = reportOptions[role];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Generate Authoritative Report</h2>
              <span className="text-[11px] text-slate-500 font-mono">Role: {role} Portal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {generated ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50/60 rounded border border-emerald-200">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-emerald-900">Report Generated Successfully</h3>
              <p className="text-xs text-emerald-800 max-w-xs mx-auto">
                Official document digitally compiled with timestamp and cryptographic authenticity seal.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setGenerated(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">Select Report Type</label>
                <div className="space-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${
                        reportType === opt.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={opt.id}
                        checked={reportType === opt.id}
                        onChange={(e) => setReportType(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Reporting Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="aug-2026">August 2026 (Current Month)</option>
                    <option value="q1-2026">Q1 FY 2025-26 (Apr - Jun)</option>
                    <option value="fy-2025-26">FY 2025-26 Year-to-Date</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Export Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="pdf">Official PDF (Signed)</option>
                    <option value="csv">Data CSV (Audit Tables)</option>
                    <option value="xlsx">Excel Workbook</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <span>Compiling Authoritative Records...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Official Document</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
