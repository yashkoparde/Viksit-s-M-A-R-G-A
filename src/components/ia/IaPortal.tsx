import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck2,
  Calendar,
  MapPin,
  Upload,
  RefreshCw,
  ArrowRight,
  ClipboardCheck,
  Activity,
  X,
  FileText,
  BookOpen,
  FileSpreadsheet,
  HardHat,
  CheckSquare,
  LayoutDashboard,
  Send,
  Map,
} from 'lucide-react';
import { Work } from '../../types';
import { LeafletProjectMap } from '../common/LeafletProjectMap';

interface IaPortalProps {
  works: Work[];
  activeView: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  onActionComplete: (msg: string) => void;
  onOpenMatrix?: () => void;
}

export const IaPortal: React.FC<IaPortalProps> = ({
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
      if (activeView === 'site-visits') {
        setCurrentTab('site-visit-mode');
      } else {
        setCurrentTab(activeView);
      }
    }
  }, [activeView]);

  // Discover all distinct Implementing Agencies from authoritative works
  const distinctAgencies = React.useMemo(() => {
    const map = new Map<string, { name: string; district: string; state: string; count: number }>();
    works.forEach((w) => {
      const rawAgency = w.implementingAgency || 'Executive Engineer, District Engineering Division';
      if (!map.has(rawAgency)) {
        map.set(rawAgency, {
          name: rawAgency,
          district: w.district || 'District',
          state: w.state || 'Karnataka',
          count: 0,
        });
      }
      map.get(rawAgency)!.count += 1;
    });
    return Array.from(map.values()).sort((a: { count: number }, b: { count: number }) => b.count - a.count);
  }, [works]);

  const [selectedAgencyName, setSelectedAgencyName] = useState<string>(
    distinctAgencies[0]?.name || ''
  );

  const currentAgency = distinctAgencies.find((a) => a.name === selectedAgencyName) || distinctAgencies[0] || {
    name: 'Executive Engineer, District Engineering Division',
    district: 'District',
    state: 'State',
    count: works.length,
  };

  // Filter works specifically assigned to this Implementing Agency
  const agencyWorks = React.useMemo(() => {
    if (!selectedAgencyName || selectedAgencyName === 'all') return works;
    const filtered = works.filter((w) => w.implementingAgency === selectedAgencyName);
    return filtered.length > 0 ? filtered : works;
  }, [works, selectedAgencyName]);

  const [selectedSiteWork, setSelectedSiteWork] = useState<Work>(agencyWorks[0] || works[0] || ({} as Work));
  const [siteProgress, setSiteProgress] = useState(selectedSiteWork?.progress ? selectedSiteWork.progress.physical : 38);
  const [siteObservation, setSiteObservation] = useState('');
  const [workmanshipRating, setWorkmanshipRating] = useState('Good');
  const [materialsCheck, setMaterialsCheck] = useState('Certified (Test report on file)');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Waiting to Sync' | 'Draft'>('Synced');
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);

  // 100% Inspection Tracker for IA
  const totalAssignedWorks = agencyWorks.length;
  const inspectedWorksCount = agencyWorks.filter((w) => w.inspectionStatus === 'Completed').length;
  const inspectionCoveragePct = totalAssignedWorks > 0 ? Math.round((inspectedWorksCount / totalAssignedWorks) * 100) : 100;
  const pendingInspectionCount = Math.max(0, totalAssignedWorks - inspectedWorksCount);
  const activeExecutionCount = agencyWorks.filter((w) => w.status === 'Ongoing' || w.lifecycleStage === 'Execution').length;
  const ucBacklogCount = agencyWorks.filter((w) => w.ucStatus === 'Pending' || w.ucStatus === 'Drafted').length;
  const handoverReadyCount = agencyWorks.filter((w) => w.status === 'Completed' || w.status === 'Substantially Complete').length;

  // Pre-execution checklist state
  const [preExecChecklist, setPreExecChecklist] = useState({
    adminAssigned: true,
    siteDemarcation: true,
    techEstimateApproved: true,
    advanceAccountVerified: true,
    beforeWorkPhoto: true,
  });

  const handleOpenSiteMode = (w: Work) => {
    setSelectedSiteWork(w);
    setSiteProgress(w.progress.physical);
    setCurrentTab('site-visit-mode');
    setInspectionSubmitted(false);
    setPhotoUploaded(false);
  };

  const handleSubmitSiteVisit = () => {
    setSyncStatus('Waiting to Sync');
    setTimeout(() => {
      setSyncStatus('Synced');
      setInspectionSubmitted(true);
      onActionComplete(`Field site visit recorded for ${selectedSiteWork.id}. Certified Progress: ${siteProgress}%. Geotagged evidence added.`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* IA Header Context with Interactive Agency Selector */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              Implementing Agency
            </span>
            <span className="text-xs text-slate-500">
              {currentAgency.district} ({currentAgency.state}) · Field Implementation Division
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">
              {currentAgency.name}
            </h1>
            {distinctAgencies.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Agency:</span>
                <select
                  value={selectedAgencyName}
                  onChange={(e) => setSelectedAgencyName(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[280px] truncate"
                  title="Switch to another Implementing Agency division"
                >
                  {distinctAgencies.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} ({a.district}, {a.count} works)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Assigned Works</span>
            <span className="font-mono text-sm font-bold text-slate-900">{totalAssignedWorks} Works</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">100% IA Inspection Quota</span>
            <span className="font-mono text-sm font-bold text-emerald-700">
              {inspectedWorksCount}/{totalAssignedWorks} ({inspectionCoveragePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Total Assigned</span>
          <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">{totalAssignedWorks}</span>
          <span className="text-[10px] text-slate-400">Current work orders</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Active Execution</span>
          <span className="text-lg font-bold text-blue-700 font-mono mt-1 block">{activeExecutionCount}</span>
          <span className="text-[10px] text-slate-400">Under construction</span>
        </div>
        <div className="border border-rose-200 rounded p-3 bg-rose-50/40">
          <span className="text-[11px] text-rose-800 font-medium block">Site Visits Due</span>
          <span className="text-lg font-bold text-rose-700 font-mono mt-1 block">{pendingInspectionCount}</span>
          <span className="text-[10px] text-rose-600">60-day cycle due</span>
        </div>
        <div className="border border-emerald-200 rounded p-3 bg-emerald-50/40">
          <span className="text-[11px] text-emerald-800 font-medium block">100% IA Quota</span>
          <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block">{inspectionCoveragePct}%</span>
          <span className="text-[10px] text-emerald-600">{pendingInspectionCount} pending</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">UC Backlog</span>
          <span className="text-lg font-bold text-amber-700 font-mono mt-1 block">{ucBacklogCount}</span>
          <span className="text-[10px] text-amber-600">Drafted, awaiting sign</span>
        </div>
        <div className="border border-slate-200 rounded p-3 bg-white">
          <span className="text-[11px] text-slate-500 font-medium block">Handover Ready</span>
          <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block">{handoverReadyCount}</span>
          <span className="text-[10px] text-slate-400">NOC collected</span>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
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
          <span>Execution Overview</span>
        </button>

        <button
          onClick={() => setCurrentTab('works')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'works'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5 text-slate-600" />
          <span>My Assigned Works ({agencyWorks.length})</span>
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
          <span>Project GIS Map</span>
        </button>

        <button
          onClick={() => setCurrentTab('site-visit-mode')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'site-visit-mode'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <span>Field Site Visit Mode (Mobile-Optimized)</span>
        </button>

        <button
          onClick={() => setCurrentTab('action-now')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'action-now'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          <span>Requires Action Checklist (3)</span>
        </button>

        <button
          onClick={() => setCurrentTab('completion')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'completion'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completion, UC & Handover Pipeline</span>
        </button>

        <button
          onClick={() => setCurrentTab('mpr')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'mpr'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
          <span>Monthly Progress Report (MPR)</span>
        </button>

        <button
          onClick={() => setCurrentTab('register')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'register'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
          <span>Measurement Book (MB) & Asset Register</span>
        </button>
      </div>

      {/* VIEW: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-md">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Field Execution Overview & Active Milestones
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              All assigned works must maintain updated physical progress records backed by Measurement Book (MB) entries and timestamped site photos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[11px] text-slate-500">Active Works On Track</span>
                <span className="text-lg font-bold font-mono text-slate-900 block mt-1">9 Works</span>
                <span className="text-[10px] text-emerald-600">Physical progress ahead of schedule</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
                <span className="text-[11px] text-amber-800">Delayed / Material Bottlenecks</span>
                <span className="text-lg font-bold font-mono text-amber-900 block mt-1">3 Works</span>
                <span className="text-[10px] text-amber-700">Contractor notices issued</span>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded">
                <span className="text-[11px] text-emerald-800">UCs Submitted This Quarter</span>
                <span className="text-lg font-bold font-mono text-emerald-900 block mt-1">6 Works (₹1.84 Cr)</span>
                <span className="text-[10px] text-emerald-700">Sent to DA for final closure</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MY ASSIGNED WORKS */}
      {currentTab === 'works' && (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden space-y-0">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Assigned Works Execution Lifecycle
              </h3>
              <span className="text-[11px] text-slate-500">
                11-Stage Pipeline: Assigned → Pre-Execution → Started → Ongoing → Substantial Completion → Completed → Accounts → UC → Refund → Handover → Closed
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Sorted by Overdue & Blocker</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Work ID & Name</th>
                  <th className="p-3">Lifecycle Stage</th>
                  <th className="p-3">Physical %</th>
                  <th className="p-3">Financial Draw %</th>
                  <th className="p-3">Progress Gap</th>
                  <th className="p-3">Risk Band</th>
                  <th className="p-3 text-right">Execution Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {agencyWorks.map((w) => {
                  const gap = w.progress.physical - w.progress.financial;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-semibold text-slate-900">{w.id}</span>
                        <div className="font-medium text-slate-800 truncate max-w-xs">{w.name}</div>
                        <div className="text-[11px] text-slate-500">{w.location}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {w.lifecycleStage}
                        </span>
                        {w.dates.delayDays > 0 && (
                          <span className="text-[10px] text-rose-600 block mt-0.5 font-medium">
                            +{w.dates.delayDays}d overdue
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-medium">{w.progress.physical}%</td>
                      <td className="p-3 font-mono font-medium">{w.progress.financial.toFixed(1)}%</td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-semibold text-[11px] ${
                            gap < -15 ? 'text-rose-700' : 'text-slate-600'
                          }`}
                        >
                          {gap > 0 ? `+${gap.toFixed(1)} pp` : `${gap.toFixed(1)} pp`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            w.risk.band === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : w.risk.band === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {w.risk.band}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenSiteMode(w)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
                        >
                          Log Visit
                        </button>
                        <button
                          onClick={() => onSelectWork(w)}
                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PROJECT NODES GIS MAP */}
      {currentTab === 'map' && (
        <LeafletProjectMap
          initialDistrictId="mysuru"
          works={agencyWorks}
          onSelectWork={(w) => {
            setSelectedSiteWork(w);
            setSiteProgress(w.progress.physical);
            setCurrentTab('site-visit-mode');
          }}
          title={`${currentAgency.name} · Field Project Nodes Map`}
        />
      )}

      {/* VIEW: FIELD SITE VISIT MODE */}
      {currentTab === 'site-visit-mode' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Field Site Visit Mode — Mobile Optimized Site Logger</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Works offline with local draft sync. Requires GPS fix and timestamped site photos before milestone sign-off.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                  syncStatus === 'Synced'
                    ? 'bg-emerald-100 text-emerald-800'
                    : syncStatus === 'Waiting to Sync'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {syncStatus}
              </span>
            </div>
          </div>

          {inspectionSubmitted ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 rounded border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-950">Field Site Visit Certified & Synced</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Physical progress milestone certified at {siteProgress}%. Geotagged photographic proof and workmanship rating successfully transmitted to District Authority.
              </p>
              <button
                onClick={() => setInspectionSubmitted(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Record Another Inspection
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Geotag Verification Banner */}
              <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Digital GPS Coordinate Stamp:</span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      {selectedSiteWork.locationVerified
                        ? `Lat 18.5314° N, Long 73.8446° E (Accuracy ±4m · Verified On-Site)`
                        : 'Location not digitally verified'}
                    </span>
                  </div>
                </div>
                {selectedSiteWork.locationVerified ? (
                  <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-medium shrink-0">
                    GPS Fix Acquired
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-medium shrink-0">
                    Satellite Sync Pending
                  </span>
                )}
              </div>

              {/* Physical Progress Slider */}
              <div className="border border-slate-200 rounded p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">
                    Certified Physical Progress Milestone:
                  </label>
                  <span className="text-base font-bold font-mono text-slate-900">{siteProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={siteProgress}
                  onChange={(e) => setSiteProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Previous MB Record: {selectedSiteWork.progress?.physical || 38}%</span>
                  <span>Financial Draw: {selectedSiteWork.progress?.financial?.toFixed(1) || 80.8}%</span>
                  <span>Target: 100%</span>
                </div>
              </div>

              {/* Quality & Materials Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded p-3 bg-white">
                  <label className="font-semibold text-slate-800 block mb-1">Workmanship Quality Assessment</label>
                  <select
                    value={workmanshipRating}
                    onChange={(e) => setWorkmanshipRating(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="Satisfactory">Satisfactory (As per CPWD / State PWD specs)</option>
                    <option value="Needs Rectification">Deficiencies noted — Rectification memo required</option>
                    <option value="Substandard">Substandard — Work suspended pending testing</option>
                  </select>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-white">
                  <label className="font-semibold text-slate-800 block mb-1">Materials Testing Certification</label>
                  <select
                    value={materialsCheck}
                    onChange={(e) => setMaterialsCheck(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="Certified">Cube test / Soil compaction reports attached</option>
                    <option value="Pending Lab">Samples collected, lab results awaited</option>
                    <option value="Exempt">Non-structural minor item</option>
                  </select>
                </div>
              </div>

              {/* Camera Evidence Capture Simulator */}
              <div className="border border-dashed border-slate-300 rounded-md p-4 text-center bg-slate-50/50 space-y-2">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">Geotagged Photographic Proof</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Take camera capture or upload high-resolution site photo showing active milestone progress.
                </p>
                {photoUploaded ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Photo IMG_20260902_1042.jpg Attached (Geotagged)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setPhotoUploaded(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    Simulate Camera Capture
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setCurrentTab('works')}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSiteVisit}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Certified Site Inspection to DA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: ACTION CHECKLIST */}
      {currentTab === 'action-now' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pre-Execution Gatekeeper & Priority Blockers
            </h3>
            <span className="text-[11px] text-slate-500">
              No ground excavation or financial draw permitted until all statutory checkpoints are satisfied.
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Site Demarcation & Physical Handover (WRK-1043)</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                  Pending Gram Panchayat Demarcation
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Encroachment on northern boundary must be cleared by Circle Officer before contractor mobilization.
              </p>
              <button
                onClick={() => onActionComplete('Demarcation notice sent to Taluka Tehsildar.')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium cursor-pointer"
              >
                Send Request to Tehsildar
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Technical Sanction Estimate Verification (WRK-1046)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  Verified & Approved
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Detailed engineering drawing and structural design vetted by Superintending Engineer.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Baseline "Before-Work" Photographic Proof (WRK-1047)</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">
                  Missing Geotagged Photo
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Mandatory before-work photograph showing untouched ground required prior to 1st installment draw.
              </p>
              <button
                onClick={() => onActionComplete('Camera upload opened for WRK-1047 before-work photo.')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium cursor-pointer"
              >
                Upload Before Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: COMPLETION & HANDOVER */}
      {currentTab === 'completion' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Project Completion, GFR Form 12-C UC & Handover Protocol
            </h3>
            <span className="text-[11px] text-slate-500">
              Statutory mandate: 100% inspection must be logged and unspent balance returned before closure.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Works Ready for Handover</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-1">3 Projects</span>
              <span className="text-[10px] text-slate-400">Physical execution 100% certified</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">Unspent Savings to Refund</span>
              <span className="text-lg font-bold font-mono text-emerald-800 block mt-1">₹4.20 Lakhs</span>
              <span className="text-[10px] text-slate-400">Will return to DA treasury account</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500">NOC Collected</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-1">2 / 3 Bodies</span>
              <span className="text-[10px] text-slate-400">From beneficiary Panchayat / Dept</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-slate-900">WRK-1048</span>
                <span className="font-semibold text-slate-800 ml-2">Construction of Crematorium Shed, Velhe</span>
              </div>
              <button
                onClick={() => onActionComplete('GFR Form 12-C Utilisation Certificate submitted to District Authority for WRK-1048.')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Transmit Final UC (Form 12-C)
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 border-t border-slate-200 pt-2">
              <span>Sanctioned: ₹25.00 L</span>
              <span>Final Actual Expenditure: ₹23.80 L</span>
              <span className="text-emerald-700 font-semibold">Refund Due: ₹1.20 L</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MONTHLY PROGRESS REPORT (MPR) */}
      {currentTab === 'mpr' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Monthly Progress Report (MPR) — August 2026
              </h3>
              <span className="text-[11px] text-slate-500">
                Monthly statutory submission to District Authority and State Nodal Department
              </span>
            </div>
            <button
              onClick={() => onActionComplete('Certified Monthly Progress Report (MPR) dispatched to District Collector Pune.')}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Certified MPR to DA</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
            <div className="font-bold text-slate-900">MPR Summary (Month of August 2026):</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-500 text-[11px]">Total Active Works:</span>
                <span className="font-mono font-bold text-slate-900 block">18</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Monthly Expenditure:</span>
                <span className="font-mono font-bold text-slate-900 block">₹42.60 Lakhs</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Milestone Inspections:</span>
                <span className="font-mono font-bold text-slate-900 block">15 Recorded</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Works Completed:</span>
                <span className="font-mono font-bold text-slate-900 block">2 Works</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MEASUREMENT BOOK & ASSET REGISTER */}
      {currentTab === 'register' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Measurement Book (MB) Digital Register
            </h3>
            <span className="text-[11px] text-slate-500">
              Primary evidentiary record of contractor work volumes and interim bill certifications
            </span>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-2.5">MB No. / Page</th>
                  <th className="p-2.5">Work Reference</th>
                  <th className="p-2.5">Item Measured</th>
                  <th className="p-2.5">Certified Quantity</th>
                  <th className="p-2.5">Certified Amount</th>
                  <th className="p-2.5 text-right">Officer Sign-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold">MB-PWD-104/p.42</td>
                  <td className="p-2.5">WRK-1042 (Shivajinagar Road)</td>
                  <td className="p-2.5">M-25 Grade RMC Pavement</td>
                  <td className="p-2.5 font-mono">420 cu.m</td>
                  <td className="p-2.5 font-mono">₹24.80 L</td>
                  <td className="p-2.5 text-right text-emerald-700 font-semibold">Signed (EE PWD)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold">MB-PWD-105/p.18</td>
                  <td className="p-2.5">WRK-1044 (Daund RO Plant)</td>
                  <td className="p-2.5">Sub-surface Bore & Pipeline</td>
                  <td className="p-2.5 font-mono">180 Rmt</td>
                  <td className="p-2.5 font-mono">₹8.40 L</td>
                  <td className="p-2.5 text-right text-emerald-700 font-semibold">Signed (AE PWD)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
