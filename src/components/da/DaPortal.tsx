import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  Ban,
  Clock,
  FileCheck2,
  Building,
  ShieldCheck,
  Search,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  FileText,
  UserCheck,
  XCircle,
  Plus,
  SlidersHorizontal,
  FolderCheck,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  Inbox,
  LayoutDashboard,
  Map,
} from 'lucide-react';
import { Work, Recommendation } from '../../types';
import { ConstituencyWorksVisualizer } from '../common/ConstituencyWorksVisualizer';
import { LeafletProjectMap } from '../common/LeafletProjectMap';

interface DaPortalProps {
  works: Work[];
  recommendations?: Recommendation[];
  activeView: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  onActionComplete: (msg: string) => void;
  onOpenMatrix?: () => void;
}

export const DaPortal: React.FC<DaPortalProps> = ({
  works,
  recommendations: propRecommendations,
  activeView,
  onSelectWork,
  onOpenRiskExplanation,
  onActionComplete,
  onOpenMatrix,
}) => {
  // Synchronize with activeView from sidebar
  const [currentTab, setCurrentTab] = useState<string>(activeView || 'overview');

  useEffect(() => {
    if (activeView) {
      if (activeView === 'recommendations') {
        setCurrentTab('inbox');
      } else {
        setCurrentTab(activeView);
      }
    }
  }, [activeView]);

  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Discover all distinct Districts from authoritative works
  const distinctDistricts = React.useMemo(() => {
    const map = new Map<string, { name: string; state: string; count: number; ida: string }>();
    works.forEach((w) => {
      const rawDist = w.district || 'General District';
      if (!map.has(rawDist)) {
        map.set(rawDist, {
          name: rawDist,
          state: w.state || 'Karnataka',
          count: 0,
          ida: w.implementingAgency || `${rawDist} District Administration`,
        });
      }
      map.get(rawDist)!.count += 1;
    });
    return Array.from(map.values()).sort((a: { count: number }, b: { count: number }) => b.count - a.count);
  }, [works]);

  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(
    distinctDistricts[0]?.name || 'Chittoor'
  );

  const currentDistrict = distinctDistricts.find((d) => d.name === selectedDistrictName) || distinctDistricts[0] || {
    name: 'District Administration',
    state: 'State',
    count: works.length,
    ida: 'District Collectorate',
  };

  // Filter works specifically to the active District jurisdiction
  const districtWorks = React.useMemo(() => {
    if (!selectedDistrictName || selectedDistrictName === 'all') return works;
    const filtered = works.filter((w) => w.district === selectedDistrictName);
    return filtered.length > 0 ? filtered : works;
  }, [works, selectedDistrictName]);

  // Real Recommendation Inbox Data
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (propRecommendations && propRecommendations.length > 0) {
      const filtered = propRecommendations.filter((r) => r.district === selectedDistrictName);
      setRecommendations(filtered.length > 0 ? filtered : propRecommendations.slice(0, 5));
    } else {
      const recs = districtWorks
        .filter((w) => w.status === 'Sanctioned' || w.lifecycleStage === 'Sanction' || (w.progress && w.progress.physical < 35))
        .slice(0, 5)
        .map((w, idx) => ({
          id: `REC-${w.id.replace('WRK-', '')}`,
          mpId: w.mpId,
          mpName: w.mpName,
          workName: w.name,
          category: w.category,
          recommendedAmount: w.financial.recommended || w.financial.sanctioned || 25.0,
          dateReceived: w.dates?.recommended || '15 Aug 2026',
          daysPending: 10 + idx * 2,
          eligibilityStatus: idx === 1 ? 'Needs Review' : 'Eligible',
          margaEstimate: {
            costRange: `₹${((w.financial.sanctioned || 25) * 0.9).toFixed(1)} L – ₹${(w.financial.sanctioned || 25).toFixed(1)} L`,
            estimatedDurationMonths: 6,
            categoryBaseline: `Schedule of Rates (${currentDistrict.name} 2025-26)`,
          },
          prohibitedCheck: {
            status: idx === 1 ? 'Needs Review' : 'Clear',
            explanation: idx === 1
              ? 'Work requires verification of Gram Panchayat land ownership before administrative sanction.'
              : 'Work adheres to Permissible Works Schedule (Section 2.1). Public revenue land verified.',
          },
          location: w.location || `${currentDistrict.name} Rural`,
        }));
      setRecommendations(recs);
    }
  }, [selectedDistrictName, districtWorks, propRecommendations]);

  // Priority Action Items dynamically generated from district works
  const actionNowItems = React.useMemo(() => {
    const items: any[] = [];
    const mismatch = districtWorks.find((w) => (w.progress?.financial || 0) - (w.progress?.physical || 0) > 20);
    if (mismatch) {
      items.push({
        id: 'ACT-01',
        priority: 'CRITICAL STATUTORY DEADLINE',
        title: `Discrepancy in ${mismatch.id}: Payment running ahead of verified site progress`,
        workId: mismatch.id,
        work: mismatch,
        recommendedAction: `Issue Immediate Show-Cause to ${mismatch.implementingAgency} and withhold milestone release.`,
        actionType: 'inspect',
        daysPending: 4,
        responsibleStage: 'District Planning & Disbursing Branch',
      });
    }

    if (recommendations.length > 0) {
      items.push({
        id: 'ACT-02',
        priority: 'RECOMMENDATION SCREENING',
        title: `${recommendations[0].id}: Pending administrative feasibility examination`,
        recId: recommendations[0].id,
        rec: recommendations[0],
        recommendedAction: 'Issue administrative sanction order or formal guideline justification.',
        actionType: 'review',
        daysPending: recommendations[0].daysPending || 8,
        responsibleStage: 'District Planning Officer (DPO)',
      });
    }

    const delayed = districtWorks.find((w) => w.status === 'Delayed' || w.status === 'Attention Required');
    if (delayed) {
      items.push({
        id: 'ACT-03',
        priority: '10% INSPECTION QUOTA',
        title: `${delayed.id}: Milestone stationary without field engineer inspection`,
        workId: delayed.id,
        work: delayed,
        recommendedAction: `Assign Sub-Divisional Officer to inspect and log geotagged evidence within 7 days.`,
        actionType: 'inspect',
        daysPending: delayed.dates?.delayDays || 21,
        responsibleStage: 'Sub-Divisional Magistrate / SDO',
      });
    }

    const completed = districtWorks.find((w) => w.status === 'Completed' || w.lifecycleStage === 'Completion');
    if (completed) {
      items.push({
        id: 'ACT-04',
        priority: 'COMPLIANCE & UC AGING',
        title: `${completed.id}: Asset completed, final UC Form 12-C due`,
        workId: completed.id,
        work: completed,
        recommendedAction: 'Issue final demand notice for UC Form 12-C and unspent balance refund.',
        actionType: 'compliance',
        daysPending: 45,
        responsibleStage: `${completed.implementingAgency}`,
      });
    }

    return items;
  }, [districtWorks, recommendations]);

  // Implementing Agency breakdown dynamically computed from real works in this district
  const agencyData = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      activeWorks: number;
      totalSanctionedCr: number;
      delayedWorks: number;
      avgDelayDays: number;
      riskScore: number;
      advanceExposureLakhs: number;
    }>();

    districtWorks.forEach((w) => {
      const agencyName = w.implementingAgency || `${currentDistrict.name} Engineering Wing`;
      if (!map.has(agencyName)) {
        map.set(agencyName, {
          name: agencyName,
          activeWorks: 0,
          totalSanctionedCr: 0,
          delayedWorks: 0,
          avgDelayDays: 0,
          riskScore: 0,
          advanceExposureLakhs: 0,
        });
      }
      const item = map.get(agencyName)!;
      item.activeWorks += 1;
      item.totalSanctionedCr += (w.financial.sanctioned || 0) / 100;
      if (w.status === 'Delayed' || w.status === 'Attention Required') {
        item.delayedWorks += 1;
      }
      item.avgDelayDays = Math.max(item.avgDelayDays, w.dates?.delayDays || 0);
      item.riskScore = Math.max(item.riskScore, w.risk?.score || 35);
      item.advanceExposureLakhs += Math.max(0, (w.financial.disbursed || 0) - (w.financial.expenditure || 0));
    });

    return Array.from(map.values()).slice(0, 6);
  }, [districtWorks, currentDistrict.name]);

  // Statutory 10% Inspection calculation computed from district works
  const totalActiveWorks = districtWorks.length;
  const target10PctCount = Math.max(1, Math.ceil(totalActiveWorks * 0.1));
  const completedInspections = districtWorks.filter((w) => w.inspectionStatus === 'Completed').length;
  const highRiskAwaitingInspection = districtWorks.filter(
    (w) => w.risk && (w.risk.band === 'Critical' || w.risk.band === 'High') && w.inspectionStatus !== 'Completed'
  );

  const handleApproveSanction = (rec: any) => {
    onActionComplete(`Administrative Sanction Order issued for ${rec.id}: ${rec.workName} (₹${rec.recommendedAmount}L). Implementing Agency notified.`);
    setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    setSelectedRec(null);
  };

  const handleRejectRecommendation = () => {
    if (!selectedRec) return;
    onActionComplete(
      `Recommendation ${selectedRec.id} formally rejected with statutory justification: "${rejectionReason}". Notice dispatched to MP Office.`
    );
    setRecommendations((prev) => prev.filter((r) => r.id !== selectedRec.id));
    setShowRejectModal(false);
    setSelectedRec(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* District Authority Header Context with Interactive District Selector */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
              Statutory District Authority
            </span>
            <span className="text-xs text-slate-500">
              Office of Deputy Commissioner & District Magistrate, {currentDistrict.name} ({currentDistrict.state})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">
              {currentDistrict.name} District Operational Control Layer
            </h1>
            {distinctDistricts.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Jurisdiction:</span>
                <select
                  value={selectedDistrictName}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[280px] truncate"
                  title="Switch to another District Authority jurisdiction"
                >
                  {distinctDistricts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.state}, {d.count} works)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Annual 10% Inspection</span>
            <span className="font-mono text-sm font-bold text-emerald-700">
              {completedInspections} / {target10PctCount} ({( (completedInspections / target10PctCount) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Active Inbox</span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {recommendations.length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Section Sub-Navigation Tabs */}
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
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setCurrentTab('map')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'map'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="w-3.5 h-3.5 text-emerald-600" />
          <span>District Geo-Nodes Map</span>
        </button>

        <button
          onClick={() => setCurrentTab('action-now')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'action-now'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Requires Action Now ({actionNowItems.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('inbox')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'inbox'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-blue-600" />
          <span>Recommendation Inbox ({recommendations.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('works')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'works'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
          <span>District Works Ledger ({districtWorks.length})</span>
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
          <span>10% Inspection Tracker</span>
        </button>

        <button
          onClick={() => setCurrentTab('compliance')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'compliance'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
          <span>Compliance & UCs</span>
        </button>

        <button
          onClick={() => setCurrentTab('agencies')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'agencies'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-slate-700" />
          <span>Implementing Agencies</span>
        </button>
      </div>

      {/* VIEW: DISTRICT GEO-NODES MAP */}
      {currentTab === 'map' && (
        <LeafletProjectMap
          initialDistrictId={
            selectedDistrictName.toLowerCase().includes('belgaum') || selectedDistrictName.toLowerCase().includes('belagavi')
              ? 'belagavi'
              : selectedDistrictName.toLowerCase().includes('dharwad') || selectedDistrictName.toLowerCase().includes('hubballi')
              ? 'dharwad'
              : selectedDistrictName.toLowerCase().includes('bangalore') || selectedDistrictName.toLowerCase().includes('bengaluru')
              ? 'bengaluru'
              : 'mysuru'
          }
          works={districtWorks}
          onSelectWork={onSelectWork}
          title={`${selectedDistrictName} · District Geospatial Project Nodes Map`}
        />
      )}

      {/* VIEW: EXECUTIVE OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-slate-200 rounded p-3 bg-white">
              <span className="text-[11px] text-slate-500 font-medium block">Total District Works</span>
              <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{totalActiveWorks}</span>
              <span className="text-[10px] text-slate-400">Under administration</span>
            </div>
            <div className="border border-rose-200 rounded p-3 bg-rose-50/40">
              <span className="text-[11px] text-rose-800 font-medium block">Action Required Queue</span>
              <span className="text-xl font-bold text-rose-700 font-mono mt-1 block">{actionNowItems.length}</span>
              <span className="text-[10px] text-rose-600">Pending statutory orders</span>
            </div>
            <div className="border border-emerald-200 rounded p-3 bg-emerald-50/40">
              <span className="text-[11px] text-emerald-800 font-medium block">10% Inspection Target</span>
              <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">
                {completedInspections} / {target10PctCount}
              </span>
              <span className="text-[10px] text-emerald-700">Quota Achieved (+5 works)</span>
            </div>
            <div className="border border-blue-200 rounded p-3 bg-blue-50/40">
              <span className="text-[11px] text-blue-800 font-medium block">Pending Sanctions</span>
              <span className="text-xl font-bold text-blue-700 font-mono mt-1 block">{recommendations.length}</span>
              <span className="text-[10px] text-blue-700">Within 45-day window</span>
            </div>
          </div>

          {/* Quick Action Preview */}
          <div className="border border-slate-200 rounded-md bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Urgent Matters Pending Collector Order</span>
              </h3>
              <button
                onClick={() => setCurrentTab('action-now')}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({actionNowItems.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {actionNowItems.slice(0, 2).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{item.title}</span>
                    <span className="text-slate-500 block text-[11px]">Action: {item.recommendedAction}</span>
                  </div>
                  <button
                    onClick={() => setCurrentTab('action-now')}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium shrink-0 cursor-pointer"
                  >
                    Act
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Representational District Works Visualizer */}
          <ConstituencyWorksVisualizer
            key={selectedDistrictName}
            works={districtWorks}
            onSelectWork={onSelectWork}
            onOpenRiskExplanation={onOpenRiskExplanation}
          />
        </div>
      )}

      {/* VIEW: REQUIRES ACTION NOW */}
      {currentTab === 'action-now' && (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden space-y-0 shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Priority Action Queue — Statutory Operational Mandates
              </h3>
              <span className="text-[11px] text-slate-500">
                Prioritized by legal deadline, risk band, and financial exposure. AI estimates serve as peer-benchmarks only.
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Zero AI Black-Box Decisions</span>
          </div>

          <div className="divide-y divide-slate-200">
            {actionNowItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {item.workId || item.recId}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Pending: <strong className="text-slate-700">{item.daysPending} days</strong></span>
                      <span>•</span>
                      <span>Responsible Unit: <strong className="text-slate-700">{item.responsibleStage}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    {item.work && (
                      <button
                        onClick={() => onSelectWork(item.work!)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        Inspect Work
                      </button>
                    )}
                    {item.rec && (
                      <button
                        onClick={() => setSelectedRec(item.rec!)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        Review Rec
                      </button>
                    )}
                    <button
                      onClick={() => onActionComplete(`Statutory order issued for ${item.workId || item.recId}: ${item.recommendedAction}`)}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Issue Order
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 text-xs text-slate-700 flex items-center justify-between border border-slate-150">
                  <span>
                    <strong>Statutory Directive:</strong> {item.recommendedAction}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Logged to Collector Order Book</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: RECOMMENDATION INBOX */}
      {currentTab === 'inbox' && (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden space-y-0">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                MP Recommendation Inbox & Pre-Sanction Intelligence
              </h3>
              <span className="text-[11px] text-slate-500">
                Layered Check: Guideline Match + Semantic Prohibition + Baseline Cost Comparison
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">45-day statutory sanction window</span>
          </div>

          <div className="divide-y divide-slate-200">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{rec.id}</span>
                      <h4 className="text-xs font-bold text-slate-900">{rec.workName}</h4>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          rec.eligibilityStatus === 'Eligible'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.eligibilityStatus === 'Needs Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.eligibilityStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>MP: <strong>{rec.mpName}</strong></span>
                      <span>•</span>
                      <span>Category: {rec.category}</span>
                      <span>•</span>
                      <span>Location: {rec.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <button
                      onClick={() => setSelectedRec(rec)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Inspect Details
                    </button>
                    <button
                      onClick={() => handleApproveSanction(rec)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Proceed to Sanction</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1">
                    <span className="text-slate-500 font-medium block text-[11px]">MP Recommendation:</span>
                    <div className="text-base font-bold font-mono text-slate-900">
                      ₹{rec.recommendedAmount.toFixed(2)} Lakhs
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Received on {rec.dateReceived} ({rec.daysPending} days elapsed)
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1">
                    <span className="text-slate-500 font-medium block text-[11px]">MARGA Regional Benchmark Estimate:</span>
                    <div className="text-base font-bold font-mono text-slate-900">{rec.margaEstimate.costRange}</div>
                    <div className="text-[11px] text-slate-500">
                      Basis: {rec.margaEstimate.categoryBaseline} (Est. Duration: {rec.margaEstimate.estimatedDurationMonths} mo)
                    </div>
                  </div>
                </div>

                {rec.prohibitedCheck.status !== 'Clear' && (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Prohibited-Work Screen Flag: {rec.prohibitedCheck.matchedClause}</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">{rec.prohibitedCheck.explanation}</p>
                    <div className="text-[11px] text-amber-700 italic pt-1">
                      Statutory Rule: Final decision belongs exclusively to District Authority. AI model does not reject works automatically.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: RISK-RANKED WORKS (REPRESENTATIONAL VISUALIZER) */}
      {currentTab === 'works' && (
        <ConstituencyWorksVisualizer
          key={selectedDistrictName}
          works={districtWorks}
          onSelectWork={onSelectWork}
          onOpenRiskExplanation={onOpenRiskExplanation}
        />
      )}

      {/* VIEW: STATUTORY 10% INSPECTION TRACKER */}
      {currentTab === 'inspections' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory 10% DA Inspection Tracker (MPLADS Guidelines Clause 5.1)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory requirement: District Authority must physically inspect at least 10% of works under implementation annually.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 self-start sm:self-auto">
              Coverage: {completedInspections} / {target10PctCount} (Quota Met)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Active District Works:</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">{totalActiveWorks}</span>
              <span className="text-[10px] text-slate-400">Works in execution</span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Statutory 10% Minimum Target:</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">{target10PctCount}</span>
              <span className="text-[10px] text-slate-400">Required annual quota</span>
            </div>
            <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-medium">Completed Inspections:</span>
              <span className="text-lg font-bold font-mono text-emerald-900 mt-1 block">{completedInspections}</span>
              <span className="text-[10px] text-emerald-700">Target surpassed</span>
            </div>
            <div className="p-3 rounded bg-orange-50/70 border border-orange-200">
              <span className="text-orange-800 block text-[11px] font-medium">High-Risk Awaiting Visit:</span>
              <span className="text-lg font-bold font-mono text-orange-900 mt-1 block">{highRiskAwaitingInspection.length}</span>
              <span className="text-[10px] text-orange-700">Priority inspection candidates</span>
            </div>
          </div>

          {/* High-Risk Works Recommended for Inspection */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Priority High-Risk Queue for DA Sub-Divisional Officer (SDO) Inspection
            </h4>

            <div className="space-y-2">
              {highRiskAwaitingInspection.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{w.id}</span>
                      <span className="font-semibold text-slate-800">{w.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-medium">
                        Risk: {w.risk.score}/100
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Physical: {w.progress.physical}% vs Financial: {w.progress.financial.toFixed(1)}% · Stalled {w.dates.daysInCurrentStage} days
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onActionComplete(`SDO Field Inspection ordered for ${w.id} under DA 10% statutory quota.`);
                    }}
                    className="px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Schedule SDO Inspection
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: COMPLIANCE & UC AGING */}
      {currentTab === 'compliance' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                GFR Rule 238(1) Utilization Certificate (UC) & Audit Status
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Verification of Form 12-C UCs required before project closure or subsequent installment releases
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Final UCs Received</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                {districtWorks.filter((w) => w.ucStatus === 'Submitted' || w.status === 'Completed').length} / {districtWorks.length} Works
              </span>
              <span className="text-[10px] text-slate-400">Verified by District Accounts</span>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
              <span className="text-[11px] text-amber-800">Pending UCs &gt; 90 Days</span>
              <span className="text-base font-bold font-mono text-amber-900 mt-1 block">
                {districtWorks.filter((w) => w.ucStatus === 'Pending').length} Works
              </span>
              <span className="text-[10px] text-amber-700">Notice issued to executing agency</span>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded">
              <span className="text-[11px] text-emerald-800">Unspent Savings Recovered</span>
              <span className="text-base font-bold font-mono text-emerald-900 mt-1 block">
                ₹{(districtWorks.reduce((acc, w) => acc + Math.max(0, (w.financial.disbursed || 0) - (w.financial.expenditure || 0)), 0)).toFixed(2)} Lakhs
              </span>
              <span className="text-[10px] text-emerald-700">Refunded to District MPLADS Account</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-2.5">Work ID</th>
                  <th className="p-2.5">Project Name</th>
                  <th className="p-2.5">Agency</th>
                  <th className="p-2.5">Sanctioned</th>
                  <th className="p-2.5">Form 12-C Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {districtWorks.slice(0, 8).map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{w.id}</td>
                    <td className="p-2.5 font-medium text-slate-800 max-w-xs truncate">{w.name}</td>
                    <td className="p-2.5 text-slate-600 truncate max-w-[150px]">{w.implementingAgency || 'Engineering Wing'}</td>
                    <td className="p-2.5 font-mono">₹{(w.financial.sanctioned || 0).toFixed(2)} L</td>
                    <td className="p-2.5">
                      <span className={`text-[11px] font-semibold ${
                        w.ucStatus === 'Submitted' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {w.ucStatus === 'Submitted' ? 'Certified & Submitted' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {w.ucStatus === 'Submitted' ? (
                        <span className="text-[11px] text-slate-400">Reconciled</span>
                      ) : (
                        <button
                          onClick={() => onActionComplete(`Final Form 12-C Demand Notice dispatched for ${w.id}.`)}
                          className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 cursor-pointer"
                        >
                          Demand UC
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: IMPLEMENTING AGENCIES PERFORMANCE */}
      {currentTab === 'agencies' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Implementing Agency Concentration & Risk Benchmark
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Evaluates agency capacity, backlog concentration, and advance payment exposures across {currentDistrict.name} District
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyData.map((agency) => (
              <div key={agency.name} className="p-4 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">{agency.name}</h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      agency.riskScore > 70
                        ? 'bg-rose-100 text-rose-800'
                        : agency.riskScore > 40
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Risk: {agency.riskScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Active Works:</span>
                    <span className="font-bold text-slate-900 block">{agency.activeWorks} (₹{agency.totalSanctionedCr} Cr)</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Delayed Works:</span>
                    <span className="font-bold text-rose-700 block">{agency.delayedWorks} (Avg {agency.avgDelayDays}d)</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Advance Exposure:</span>
                    <span className="font-bold text-slate-900 block font-mono">₹{agency.advanceExposureLakhs} L</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">DA Action:</span>
                    <span className="text-slate-700 block font-medium">
                      {agency.delayedWorks > 3 ? 'Halt new work assignment' : 'Standard monitoring'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => onActionComplete(`Capacity review notice issued to ${agency.name}.`)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    Audit Agency Ledger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Recommendation Review & Sanction: {selectedRec.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Recommended Work:</span>
                <div className="font-bold text-slate-900 text-sm">{selectedRec.workName}</div>
                <div className="text-slate-600 mt-0.5">
                  Proposed by {selectedRec.mpName} · {selectedRec.category} · {selectedRec.location}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Recommended Cost:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">₹{selectedRec.recommendedAmount} Lakhs</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">MARGA Estimate:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{selectedRec.margaEstimate.costRange}</span>
                </div>
              </div>

              {selectedRec.prohibitedCheck.status !== 'Clear' && (
                <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    <span>Potential Guideline Ineligibility Detected:</span>
                  </div>
                  <p className="text-rose-800 text-[11px] leading-relaxed">
                    {selectedRec.prohibitedCheck.explanation}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block">District Authority Actions:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApproveSanction(selectedRec)}
                    className="p-2.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Issue Administrative Sanction</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="p-2.5 bg-white text-rose-700 border border-rose-300 rounded font-medium hover:bg-rose-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject with Statutory Reason</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject with Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Formal Rejection with Statutory Citation
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                MPLADS guidelines require the District Authority to provide explicit guideline clauses and factual reasons for recommendation rejection.
              </p>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Statutory Clause & Justification</label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Ineligible under MPLADS Guidelines Annexure II Clause 3.2 (Private Trust ownership)."
                  className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-3.5 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectRecommendation}
                  disabled={!rejectionReason.trim()}
                  className="px-3.5 py-1.5 font-medium text-white bg-rose-600 rounded hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
                >
                  Confirm Formal Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
