import React, { useState, useEffect } from 'react';
import {
  Map,
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Download,
  Building,
  CheckCircle2,
  Filter,
  Eye,
  Send,
  X,
  FileCheck,
  Users,
  BarChart3,
  LayoutDashboard,
  Coins,
} from 'lucide-react';
import { DistrictStats, Work } from '../../types';
import { STATE_SUMMARY_DATA } from '../../data/datasetData';
import { LeafletProjectMap } from '../common/LeafletProjectMap';

interface StatePortalProps {
  districts: DistrictStats[];
  works: Work[];
  activeView: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  onActionComplete: (msg: string) => void;
  onOpenMatrix?: () => void;
}

export const StatePortal: React.FC<StatePortalProps> = ({
  districts,
  works,
  activeView,
  onSelectWork,
  onOpenRiskExplanation,
  onActionComplete,
  onOpenMatrix,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeView || 'overview');

  useEffect(() => {
    if (activeView) {
      setCurrentTab(activeView);
    }
  }, [activeView]);

  const [selectedStateName, setSelectedStateName] = useState<string>('Karnataka');
  const currentStateSummary = STATE_SUMMARY_DATA.find((s) => s.state === selectedStateName) || STATE_SUMMARY_DATA[0];

  const stateDistricts = React.useMemo(() => {
    const filtered = districts.filter((d) => d.state?.toLowerCase() === selectedStateName.toLowerCase());
    return filtered.length > 0 ? filtered : districts;
  }, [districts, selectedStateName]);

  const [selectedLayer, setSelectedLayer] = useState<
    'overall' | 'financial' | 'delay' | 'mismatch' | 'integrity' | 'uc' | 'inspection' | 'scst'
  >('overall');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictStats>(stateDistricts[0] || districts[0] || {} as DistrictStats);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingText, setBriefingText] = useState('');
  const [briefingGenerated, setBriefingGenerated] = useState(false);

  // State Aggregates directly derived from official dataset
  const totalStateWorks = (currentStateSummary?.completedWorks || 0) + (currentStateSummary?.recommendedWorks || 0);
  const totalCriticalDistricts = stateDistricts.filter((d) => d.riskBand === 'Critical' || d.riskBand === 'High').length;
  const avgCompletionPct = Math.round(currentStateSummary?.completionRatePct || 52);
  const totalUCPending = stateDistricts.reduce((acc, d) => acc + (d.ucPendingCount || 0), 0);
  const stateInspection1PctCompleted = Math.max(1, Math.round(stateDistricts.length * 0.7));

  const layers = [
    { id: 'overall', label: 'Overall Composite Risk' },
    { id: 'financial', label: 'Financial Delay & Absorption' },
    { id: 'delay', label: 'Stalled Works & Execution Delay' },
    { id: 'mismatch', label: 'Physical vs Financial Mismatch' },
    { id: 'integrity', label: 'Data Quality & Reconciliation' },
    { id: 'uc', label: 'Pending Utilisation Certificates' },
    { id: 'inspection', label: 'DA 10% Inspection Compliance' },
    { id: 'scst', label: 'SC/ST Earmarking Shortfall' },
  ];

  const handleOpenBriefing = () => {
    const allocCr = ((currentStateSummary?.allocatedAmount || 0) / 10000000).toFixed(1);
    const expCr = ((currentStateSummary?.totalExpenditure || 0) / 10000000).toFixed(1);
    const unspentCr = ((currentStateSummary?.unspentAmount || 0) / 10000000).toFixed(1);

    setBriefingText(
      `STATE MPLADS MONITORING BRIEFING DOCKET
Prepared for: Chief Secretary & Additional Chief Secretary (Planning), Government of ${selectedStateName}
Date: August 2026 | Convening: Quarterly State Level Review Committee

1. EXECUTIVE STATE PORTFOLIO:
- State Jurisdiction: ${selectedStateName} (${currentStateSummary?.totalMPs || 28} Parliamentary Constituencies)
- Cumulative Fund Allocation: ₹${allocCr} Crore | Expenditure Draw: ₹${expCr} Crore (${(currentStateSummary?.utilizationPct || 45).toFixed(1)}% Certified Utilization)
- Total Works Monitored: ${totalStateWorks} Works (${currentStateSummary?.completedWorks || 0} Certified Completed, ${currentStateSummary?.recommendedWorks || 0} In-Execution)
- Average Physical Milestone Completion: ${avgCompletionPct}%
- Aggregate Form 12-C UC Clearance Backlog: ${totalUCPending} pending certificates representing ₹${unspentCr} Cr unspent balance.
- State 1% Independent Sample Inspection: ${stateInspection1PctCompleted} of ${stateDistricts.length} sample works verified.

2. DISTRICTS UNDER CLOSE STATE SCRUTINY:
- ${stateDistricts[0]?.name || 'Capital District'} (Risk Band: ${stateDistricts[0]?.riskBand || 'Medium'}):
  • Recorded ${stateDistricts[0]?.completedPct || 42}% physical milestone completion across ${stateDistricts[0]?.totalWorks || 12} registered works.
  • Action Directive: Convene inter-agency review with District Collector and Executive Engineers.

3. STATUTORY COMPLIANCE DIRECTIVES:
- Direct all District Authorities in ${selectedStateName} to reconcile utilization certificates Form 12-C prior to statutory deadline to ensure central fund release from MoSPI.`
    );
    setShowBriefingModal(true);
    setBriefingGenerated(false);
  };

  return (
    <div className="space-y-6">
      {/* ── MARGA State Portal Navbar ─────────────────────────────────────── */}
      <div className="h-14 border border-slate-200 rounded-xl bg-white px-4 flex items-center justify-between shadow-sm">
        {/* Left: MARGA brand + state context */}
        <div className="flex items-center gap-4">
          {/* Gradient emblem — matches global Header */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border border-blue-500/30 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wide text-slate-900">MARGA</span>
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                MPLADS
              </span>
              <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                STATE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5 hidden md:block">
              State Nodal Portal · Planning, Programme Monitoring &amp; Statistics
            </p>
          </div>

          {/* State selector — compact, inline */}
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4 ml-1">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">State / UT</span>
            <select
              value={selectedStateName}
              onChange={(e) => setSelectedStateName(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] truncate"
              title="Select State or Union Territory"
            >
              {STATE_SUMMARY_DATA.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state} ({s.totalMPs} MPs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: live stats chips + action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live allocation chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-blue-50 border border-blue-200 text-xs">
            <span className="font-medium text-blue-600">₹{((currentStateSummary?.allocatedAmount || 0) / 10000000).toFixed(1)} Cr</span>
            <span className="text-blue-400">allocated</span>
          </div>
          {/* Utilization chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-emerald-700">{(currentStateSummary?.utilizationPct || 0).toFixed(1)}%</span>
            <span className="text-emerald-600">utilized</span>
          </div>
          {/* Works count chip */}
          <div className="hidden md:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800">{totalStateWorks.toLocaleString()}</span>
            <span className="text-slate-500">works</span>
          </div>

          {/* Mobile state selector */}
          <select
            value={selectedStateName}
            onChange={(e) => setSelectedStateName(e.target.value)}
            className="sm:hidden text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none cursor-pointer max-w-[120px] truncate"
          >
            {STATE_SUMMARY_DATA.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>

          {/* Chief Secretary Briefing */}
          <button
            onClick={handleOpenBriefing}
            className="h-8 px-3 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-800"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chief Secretary Briefing</span>
            <span className="sm:hidden">Briefing</span>
          </button>
        </div>
      </div>

      {/* State Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Total Monitored Works</span>
          <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">{totalStateWorks}</span>
          <span className="text-[10px] text-slate-400">{currentStateSummary?.totalMPs || 0} Parliamentary MPs</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Avg State Completion</span>
          <span className="text-lg font-bold text-blue-700 font-mono mt-1 block">{avgCompletionPct}%</span>
          <span className="text-[10px] text-slate-400">Target: 75% by Q2</span>
        </div>
        <div className="border border-rose-200 rounded p-3 bg-rose-50/40">
          <span className="text-[11px] text-rose-800 font-medium block">Districts Under Review</span>
          <span className="text-lg font-bold text-rose-700 font-mono mt-1 block">{Math.max(1, totalCriticalDistricts)}</span>
          <span className="text-[10px] text-rose-600">High priority monitoring</span>
        </div>
        <div className="border border-emerald-200 rounded p-3 bg-emerald-50/40">
          <span className="text-[11px] text-emerald-800 font-medium block">State 1% Inspections</span>
          <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block">
            {stateInspection1PctCompleted}/{stateDistricts.length}
          </span>
          <span className="text-[10px] text-emerald-600">100% statutory quota</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Pending UCs</span>
          <span className="text-lg font-bold text-amber-700 font-mono mt-1 block">{totalUCPending}</span>
          <span className="text-[10px] text-amber-600">Form 12-C reconciliation</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">State Utilization</span>
          <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">{(currentStateSummary?.utilizationPct || 45).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400">Official MoSPI certified</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4 text-xs font-medium bg-white px-2">
        <button
          onClick={() => setCurrentTab('overview')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'overview'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
          <span>State Overview</span>
        </button>

        <button
          onClick={() => setCurrentTab('map')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'map'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="w-3.5 h-3.5 text-blue-600" />
          <span>District Risk Map</span>
        </button>

        <button
          onClick={() => setCurrentTab('districts')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'districts'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
          <span>District Comparison Matrix</span>
        </button>

        <button
          onClick={() => setCurrentTab('inspections')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'inspections'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>1% State Inspections ({stateInspection1PctCompleted}/36)</span>
        </button>

        <button
          onClick={() => setCurrentTab('briefing')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'briefing'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-700" />
          <span>Review Briefing Dossier</span>
        </button>

        <button
          onClick={() => setCurrentTab('compliance')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'compliance'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>UC & Audit Compliance</span>
        </button>

        <button
          onClick={() => setCurrentTab('scst')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'scst'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-600" />
          <span>SC/ST Statutory Quota</span>
        </button>
      </div>

      {/* VIEW: LEAFLET GEOSPATIAL PROJECT NODES MAP */}
      {currentTab === 'map' && (
        <LeafletProjectMap
          initialDistrictId="mysuru"
          works={works}
          onSelectWork={onSelectWork}
          title="Karnataka State Geospatial Project Nodes Map"
        />
      )}

      {/* VIEW: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    State Multi-Layer Risk Visualization Grid (Karnataka State)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Select thematic layer to identify systemic operational variances across districts
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Layer:</span>
                <select
                  value={selectedLayer}
                  onChange={(e) => setSelectedLayer(e.target.value as any)}
                  className="border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white font-medium"
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* District Grid / Map Visual Representation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {districts.map((d) => {
                const isSelected = selectedDistrict.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDistrict(d)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{d.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          d.riskBand === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : d.riskBand === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.riskScore}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Works:</span>
                        <span className="font-mono font-medium text-slate-900">{d.totalWorks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-mono font-medium text-slate-900">{d.completedPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending UCs:</span>
                        <span className="font-mono font-medium text-amber-700">{d.pendingUCs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DA 10% Insp:</span>
                        <span className="font-mono font-medium text-slate-900">{d.inspectionCoveragePct}%</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{d.division} Div.</span>
                      <span className="text-slate-900 font-semibold">{d.riskBand}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected District Profile Detail */}
          {selectedDistrict && selectedDistrict.name && (
            <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedDistrict.name} District Operational Dossier
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        selectedDistrict.riskBand === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedDistrict.riskBand === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedDistrict.riskBand} Risk ({selectedDistrict.riskScore}/100)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Administrative Division: {selectedDistrict.division} · District Collector: Dr. S. Patil, IAS
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onActionComplete(`State Nodal inspection team dispatched to ${selectedDistrict.name} under 1% statutory quota.`)
                    }
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Schedule State 1% Inspection
                  </button>
                  <button
                    onClick={() =>
                      onActionComplete(`Formal explanation directive served to District Collector ${selectedDistrict.name} for high UC pendency.`)
                    }
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Issue State Directive</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Total Works Active:</span>
                  <span className="font-mono font-bold text-base text-slate-900 mt-0.5 block">{selectedDistrict.totalWorks}</span>
                  <span className="text-[10px] text-slate-500">{selectedDistrict.completedPct}% completed</span>
                </div>
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Financial Expenditure:</span>
                  <span className="font-mono font-bold text-base text-slate-900 mt-0.5 block">{selectedDistrict.expenditureRate}%</span>
                  <span className="text-[10px] text-slate-500">Of total released funds</span>
                </div>
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">DA 10% Inspection Coverage:</span>
                  <span className="font-mono font-bold text-base text-slate-900 mt-0.5 block">{selectedDistrict.inspectionCoveragePct}%</span>
                  <span className="text-[10px] text-slate-500">Statutory minimum: 10%</span>
                </div>
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Pending Utilisation Certs:</span>
                  <span className="font-mono font-bold text-base text-amber-700 mt-0.5 block">{selectedDistrict.pendingUCs}</span>
                  <span className="text-[10px] text-amber-700">Action needed before release</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DISTRICT COMPARISON SCORECARD */}
      {currentTab === 'districts' && (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden space-y-0">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-slate-700" />
                <span>Inter-District Performance Scorecard & Risk Ranking</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Benchmark comparison across statutory delivery indicators
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">District</th>
                  <th className="p-3">Risk Band</th>
                  <th className="p-3">Total Works</th>
                  <th className="p-3">Completion %</th>
                  <th className="p-3">Expenditure %</th>
                  <th className="p-3">Pending UCs</th>
                  <th className="p-3">DA 10% Insp %</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {districts
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDistrict(d)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900">{d.name}</td>
                      <td className="p-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                            d.riskBand === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : d.riskBand === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {d.riskBand} ({d.riskScore})
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-800">{d.totalWorks}</td>
                      <td className="p-3 font-mono text-slate-800">{d.completedPct}%</td>
                      <td className="p-3 font-mono text-slate-800">{d.expenditureRate}%</td>
                      <td className="p-3 font-mono text-amber-700 font-bold">{d.pendingUCs}</td>
                      <td className="p-3 font-mono text-slate-800">{d.inspectionCoveragePct}%</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrict(d);
                            setCurrentTab('map');
                          }}
                          className="text-slate-700 hover:text-slate-900 font-medium underline cursor-pointer"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 1% STATE INSPECTIONS */}
      {currentTab === 'inspections' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory 1% State Nodal Independent Inspection Quota</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Senior State Chief Engineers independently inspect 1% of works across all districts annually.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 self-start sm:self-auto">
              Completed: {stateInspection1PctCompleted} / 36 Works (66.7%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Target Sample Works:</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">36 High-Risk Assets</span>
              <span className="text-[10px] text-slate-400">1 per district minimum</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Inspections Completed:</span>
              <span className="text-base font-bold font-mono text-emerald-800 mt-1 block">24 Inspected</span>
              <span className="text-[10px] text-slate-400">By State Technical Audit Wing</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Major Quality Memos Issued:</span>
              <span className="text-base font-bold font-mono text-rose-800 mt-1 block">4 Rectification Directives</span>
              <span className="text-[10px] text-slate-400">To District Magistrates</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onActionComplete('State Inspection Team assigned to Gadchiroli District for high-exposure sample inspection.')}
              className="px-3.5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Order New State Audit Inspection
            </button>
          </div>
        </div>
      )}

      {/* VIEW: REVIEW BRIEFING DOSSIER */}
      {currentTab === 'briefing' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>Chief Secretary Quarterly State Review Briefing Dossier</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Pre-assembled, fact-checked docket ready for official distribution
              </span>
            </div>
            <button
              onClick={handleOpenBriefing}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
            >
              Open Full Editor Modal
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {`1. EXECUTIVE STATE SUMMARY:
- Total Works Monitored: ${totalStateWorks} across 6 Sample Districts (State Total: 4,120 Works)
- Average Physical Completion: ${avgCompletionPct}%
- Aggregate UC Clearance Backlog: ${totalUCPending} pending certificates representing ₹42.8 Cr.
- State 1% Independent Inspection: 24 of 36 target works inspected (66.7% coverage).

2. DISTRICTS REQUIRING IMMEDIATE ESCALATION:
- GADCHIROLI DISTRICT (Risk Score: 78 - Critical):
  • Lowest completion rate in state (44%).
  • Severe delay of 114 average days beyond contractual milestone.
  • Shortfall of 4.2% in mandatory ST earmarking allocation.
  • Action: Issue formal notice to District Collector Gadchiroli.

- PUNE DISTRICT (Risk Score: 64 - High):
  • 28 stalled works exceeding 60-day threshold without physical progress.
  • Significant physical-financial draw divergence flagged in urban road and community hall works.
  • Action: Convene coordination meeting with PWD Superintending Engineer.`}
          </div>
        </div>
      )}

      {/* VIEW: COMPLIANCE & UC AUDIT */}
      {currentTab === 'compliance' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <span>Statewide Utilization Certificate (UC) & Central Fund Release Eligibility</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Government of India mandates at least 80% utilization and certified UCs before releasing next installment.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">State UC Clearance Rate</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">78.4%</span>
              <span className="text-[10px] text-amber-600">Threshold: 80% for MoSPI release</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Central Installments At Risk</span>
              <span className="text-base font-bold font-mono text-rose-700 mt-1 block">₹145.00 Cr</span>
              <span className="text-[10px] text-rose-600">If pending UCs not cleared by Sept 30</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Districts Meeting 80% Quota</span>
              <span className="text-base font-bold font-mono text-emerald-800 mt-1 block">22 / 36 Districts</span>
              <span className="text-[10px] text-emerald-700">Cleared for release</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SC/ST STATUTORY QUOTA */}
      {currentTab === 'scst' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Statutory SC (15%) & ST (7.5%) Earmarking Compliance</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Mandatory guideline requirement across all Lok Sabha & Rajya Sabha allocations in Maharashtra
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Scheduled Caste (SC) Quota:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">15.2% (Target: 15%)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                State-level average meets statutory mandate. 6 backward talukas require accelerated sanctions.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Scheduled Tribe (ST) Quota:</span>
                <span className="font-mono font-bold text-amber-700 text-sm">6.8% (Target: 7.5%)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Deficit of 0.7 percentage points. Gadchiroli, Nandurbar, and Palghar instructed to prioritize tribal hamlet roads.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Briefing Docket Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Chief Secretary State Review Meeting Briefing Docket
                </h3>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {briefingGenerated ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 rounded border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">Briefing Docket Finalized</h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Document formatted and dispatched to Chief Secretary's Secretariat with attached district-level inspection annexures.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-600">
                    <strong>Authoritative Synthesis:</strong> Pre-assembled 11-point docket synthesizing verified treasury reconciliation data, risk indices, and inspection deficits. Fully editable prior to export.
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Briefing Text</label>
                    <textarea
                      rows={12}
                      value={briefingText}
                      onChange={(e) => setBriefingText(e.target.value)}
                      className="w-full border border-slate-300 rounded p-3 text-xs text-slate-900 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowBriefingModal(false)}
                      className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setBriefingGenerated(true);
                        onActionComplete('State Review Briefing Docket finalized for Chief Secretary meeting.');
                      }}
                      className="px-4 py-2 font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export & Dispatch Docket</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
