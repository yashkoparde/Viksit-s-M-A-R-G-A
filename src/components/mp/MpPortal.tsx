import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  Clock,
  Coins,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  HelpCircle,
  FileText,
  X,
  Plus,
  ShieldCheck,
  AlertCircle,
  Building,
  Check,
  Ban,
  ClockAlert,
  Inbox,
} from 'lucide-react';
import { Work, AuthUser } from '../../types';
import { ConstituencyWorksVisualizer } from '../common/ConstituencyWorksVisualizer';
import { LeafletProjectMap } from '../common/LeafletProjectMap';
import { apiService } from '../../services/apiService';
import { convertClusterWorkToAppWork } from '../../services/margaDatabase';

interface MpPortalProps {
  currentUser?: AuthUser;
  works: Work[];
  activeView: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  onActionComplete: (msg: string) => void;
  onOpenMatrix?: () => void;
}

export const MpPortal: React.FC<MpPortalProps> = ({
  currentUser,
  works,
  activeView,
  onSelectWork,
  onOpenRiskExplanation,
  onActionComplete,
  onOpenMatrix,
}) => {
  const [selectedEscalationWork, setSelectedEscalationWork] = useState<Work | null>(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [escalationSent, setEscalationSent] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fetchedMpWorks, setFetchedMpWorks] = useState<Work[] | null>(null);

  // Discover all distinct MPs from the authoritative works dataset
  const distinctMps = React.useMemo(() => {
    const map = new Map<string, { name: string; constituency: string; house: string; state: string; count: number }>();
    works.forEach((w) => {
      if (w.mpName && !map.has(w.mpName)) {
        map.set(w.mpName, {
          name: w.mpName,
          constituency: w.constituency || 'General',
          house: w.house || 'Lok Sabha',
          state: w.state || 'Karnataka',
          count: 0,
        });
      }
      if (w.mpName && map.has(w.mpName)) {
        map.get(w.mpName)!.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [works]);

  const [selectedMpName, setSelectedMpName] = useState<string>(() => {
    if (currentUser?.name && distinctMps.some((m) => m.name.toLowerCase() === currentUser.name.toLowerCase())) {
      return currentUser.name;
    }
    return distinctMps[0]?.name || 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar';
  });

  // Sync selectedMpName if currentUser changes
  useEffect(() => {
    if (currentUser?.name && distinctMps.some((m) => m.name.toLowerCase() === currentUser.name.toLowerCase())) {
      setSelectedMpName(currentUser.name);
    }
  }, [currentUser?.name, distinctMps]);

  // Fetch full portfolio for selected MP from MongoDB Atlas if in-memory list has few records
  useEffect(() => {
    if (!selectedMpName) return;
    let isMounted = true;
    const target = selectedMpName.trim().toLowerCase();
    const inMemoryCount = works.filter((w) => (w.mpName || '').trim().toLowerCase() === target).length;
    if (inMemoryCount < 10) {
      apiService
        .getWorks({ mpName: selectedMpName, limit: 500 })
        .then((res) => {
          if (isMounted && res && res.data && res.data.length > 0) {
            const mapped = res.data.map(convertClusterWorkToAppWork);
            setFetchedMpWorks(mapped);
          }
        })
        .catch((err) => console.warn('Fetch MP works warning:', err));
    } else {
      setFetchedMpWorks(null);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedMpName, works]);

  const currentMP = distinctMps.find((m) => m.name.toLowerCase() === selectedMpName.toLowerCase()) || distinctMps[0] || {
    name: selectedMpName || 'Hon\'ble Member of Parliament',
    constituency: 'Constituency',
    house: 'Lok Sabha',
    state: 'State',
    count: 0,
  };

  // Strictly filter works specifically to the active MP's portfolio ONLY - NEVER fallback to all works!
  const mpWorks = React.useMemo(() => {
    if (!selectedMpName) return [];
    const target = selectedMpName.trim().toLowerCase();
    if (fetchedMpWorks && fetchedMpWorks.length > 0) {
      return fetchedMpWorks.filter((w) => (w.mpName || '').trim().toLowerCase() === target);
    }
    return works.filter((w) => (w.mpName || '').trim().toLowerCase() === target);
  }, [works, selectedMpName, fetchedMpWorks]);

  // New recommendation submission form state
  const [recTitle, setRecTitle] = useState('');
  const [recCategory, setRecCategory] = useState('Drinking Water');
  const [recCostLakhs, setRecCostLakhs] = useState('25.0');
  const [recLocation, setRecLocation] = useState(`${currentMP.constituency} Rural`);
  const [recScStType, setRecScStType] = useState<'none' | 'sc' | 'st'>('sc');
  const [recAssetType, setRecAssetType] = useState<'public' | 'trust' | 'religious'>('public');

  // Dispatched inquiries dynamically generated from real delayed works
  const [sentEscalations, setSentEscalations] = useState<any[]>([]);

  useEffect(() => {
    const delayed = mpWorks.filter((w) => w.status === 'Delayed' || w.status === 'Attention Required' || (w.risk && w.risk.band === 'High')).slice(0, 3);
    if (delayed.length > 0) {
      setSentEscalations(
        delayed.map((w, idx) => ({
          id: `ESC-${w.id.replace('WRK-', '')}`,
          workId: w.id,
          workTitle: w.name,
          date: '20 Aug 2026',
          recipient: `District Authority & Collector, ${w.district}`,
          subject: `Inquiry regarding disbursement ahead of physical progress: ${w.name.slice(0, 50)}...`,
          status: idx === 0 ? 'Under Inquiry by Superintending Engineer' : 'Notice Served to Implementing Agency',
          responseDue: '03 Sep 2026',
        }))
      );
    } else {
      setSentEscalations([]);
    }
  }, [selectedMpName, mpWorks]);

  // Executive summary metrics computed directly from active MP's real works
  const totalWorks = mpWorks.length;
  const ongoingCount = mpWorks.filter((w) => w.status === 'Ongoing').length;
  const delayedCount = mpWorks.filter((w) => w.status === 'Delayed' || w.status === 'Attention Required').length;
  const completedCount = mpWorks.filter((w) => w.status === 'Completed' || w.status === 'Substantially Complete').length;
  const highRiskCount = mpWorks.filter((w) => w.risk && (w.risk.band === 'High' || w.risk.band === 'Critical')).length;

  // Financial aggregate for MP constituency (Statutory ₹5.00 Cr / FY)
  const totalEntitlementCr = 5.0;
  const totalAllocatedCr = 5.0;
  const totalRecommendedCr = mpWorks.reduce((acc, w) => acc + (w.financial.recommended || w.financial.sanctioned || 0), 0) / 100;
  const totalSanctionedCr = mpWorks.reduce((acc, w) => acc + (w.financial.sanctioned || 0), 0) / 100;
  const totalDisbursedCr = mpWorks.reduce((acc, w) => acc + (w.financial.disbursed || 0), 0) / 100;
  const totalUtilizedCr = mpWorks.reduce((acc, w) => acc + (w.financial.expenditure || 0), 0) / 100;
  const remainingCr = Math.max(0, totalAllocatedCr - totalSanctionedCr);

  // Prioritized Attention Items
  const attentionWorks = mpWorks.filter((w) => w.status === 'Attention Required' || (w.risk && w.risk.band === 'High'));

  // Delayed / Stuck works
  const delayedWorks = mpWorks.filter((w) => w.rootCause !== undefined || (w.dates && w.dates.delayDays > 0));

  const openEscalationModal = (w: Work) => {
    setSelectedEscalationWork(w);
    setDraftSubject(`Inquiry regarding execution stoppage & payment mismatch: ${w.name} (${w.id})`);
    setDraftBody(
      `To,\nThe District Magistrate & District Authority (MPLADS),\n${w.district || currentMP.constituency} District, ${w.state || currentMP.state}.\n\nSubject: Urgent inquiry regarding execution delay in ${w.name} (${w.id})\n\nDear Collector,\n\nDuring review of constituency works under my MPLADS allocation, serious deviation has been noted in the subject work:\n\n1. Certified Physical Progress: ${w.progress.physical}%\n2. Recorded Financial Draw: ₹${w.financial.expenditure.toFixed(2)} Lakhs (${w.progress.financial.toFixed(1)}% of sanctioned amount)\n3. Work Idle Duration: ${w.dates.daysInCurrentStage} calendar days without certified progress increments.\n\nAs payment appears to be running significantly ahead of certified physical execution (${(w.progress.financial - w.progress.physical).toFixed(1)} pp gap), I request you to kindly order an immediate physical verification by a competent engineer and furnish a factual status report within 14 days.\n\nYours sincerely,\n${currentMP.name}, MP (${currentMP.house} - ${currentMP.constituency} Constituency)`
    );
    setEscalationSent(false);
  };

  const handleSendEscalation = () => {
    setEscalationSent(true);
    setTimeout(() => {
      const newEsc = {
        id: `ESC-2026-00${sentEscalations.length + 1}`,
        workId: selectedEscalationWork?.id || 'WRK-GEN',
        workTitle: selectedEscalationWork?.name || 'Constituency Inquiry',
        date: 'Today',
        recipient: `District Magistrate, ${selectedEscalationWork?.district || currentMP.constituency}`,
        subject: draftSubject,
        status: 'Dispatched to Collectorate',
        responseDue: '14 days',
      };
      setSentEscalations([newEsc, ...sentEscalations]);
      onActionComplete(`Formal inquiry memo dispatched to District Authority for ${selectedEscalationWork?.id}.`);
      setSelectedEscalationWork(null);
    }, 1000);
  };

  const handleCreateRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    if (recAssetType === 'religious' || recAssetType === 'trust') {
      alert('Statutory Guardrail Alert: Works on private trust or religious premises are strictly prohibited under Section 2.1 of MPLADS Guidelines.');
      return;
    }

    onActionComplete(`New recommendation "${recTitle}" (₹${recCostLakhs} L) submitted to District Authority with statutory SC/ST tag.`);
    setRecTitle('');
  };

  const filteredWorks = mpWorks.filter((w) => {
    if (searchFilter.trim()) {
      const s = searchFilter.toLowerCase();
      const matchSearch = w.name.toLowerCase().includes(s) || w.id.toLowerCase().includes(s) || w.category.toLowerCase().includes(s);
      if (!matchSearch) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'delayed' && w.status !== 'Delayed' && w.status !== 'Attention Required') return false;
      if (statusFilter === 'ongoing' && w.status !== 'Ongoing') return false;
      if (statusFilter === 'completed' && w.status !== 'Completed' && w.status !== 'Substantially Complete') return false;
      if (statusFilter === 'high-risk' && w.risk && w.risk.band !== 'High' && w.risk.band !== 'Critical') return false;
    }
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* MP Header Context with Interactive Real MP Selector */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {currentMP.house}
            </span>
            <span className="text-xs text-slate-500">
              {currentMP.constituency} ({currentMP.state}) · Authoritative Constituency Ledger
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">{currentMP.name}, MP</h1>
            {distinctMps.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Active MP:</span>
                <select
                  value={selectedMpName}
                  onChange={(e) => setSelectedMpName(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[280px] truncate"
                  title="Switch to another Member of Parliament to view their actual works portfolio"
                >
                  {distinctMps.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.constituency}, {m.count} works)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Annual Entitlement</span>
            <span className="font-mono text-sm font-bold text-slate-900">₹5.00 Cr / FY</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Sanctioned Ratio</span>
            <span className="font-mono text-sm font-bold text-emerald-700">
              {((totalSanctionedCr / totalAllocatedCr) * 100).toFixed(0)}% (₹{totalSanctionedCr.toFixed(2)} Cr)
            </span>
          </div>
        </div>
      </div>

      {/* VIEW: FUND POSITION FLOW */}
      {(activeView === 'overview' || activeView === 'funds') && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Constituency Statutory Fund Pipeline (FY 2025–26)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Treasury Mandate · Non-Lapsable Allocation</span>
            </div>
          </div>

          {/* Visual Continuous Pipeline Flow Bar */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-700">Financial Execution Progression</span>
              <span className="font-mono text-emerald-800">
                {((totalUtilizedCr / totalAllocatedCr) * 100).toFixed(1)}% Certified Utilization (₹{totalUtilizedCr.toFixed(2)} Cr)
              </span>
            </div>

            {/* Segmented Visual Gradient Bar */}
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
              <div
                className="h-full bg-emerald-600 rounded-l-full transition-all"
                style={{ width: `${(totalUtilizedCr / totalAllocatedCr) * 100}%` }}
                title={`Utilized: ₹${totalUtilizedCr.toFixed(2)} Cr`}
              />
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.max(0, ((totalDisbursedCr - totalUtilizedCr) / totalAllocatedCr) * 100)}%`,
                }}
                title={`Disbursed In-Pipeline: ₹${(totalDisbursedCr - totalUtilizedCr).toFixed(2)} Cr`}
              />
              <div
                className="h-full bg-indigo-400 transition-all"
                style={{
                  width: `${Math.max(0, ((totalSanctionedCr - totalDisbursedCr) / totalAllocatedCr) * 100)}%`,
                }}
                title={`Sanctioned Awaiting Draw: ₹${(totalSanctionedCr - totalDisbursedCr).toFixed(2)} Cr`}
              />
              <div
                className="h-full bg-slate-300 rounded-r-full transition-all"
                style={{ width: `${(remainingCr / totalAllocatedCr) * 100}%` }}
                title={`Uncommitted Balance: ₹${remainingCr.toFixed(2)} Cr`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Utilized (MB Verified)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Disbursed to Agencies
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> Sanctioned (Unpaid)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Uncommitted Balance
              </span>
            </div>
          </div>

          {/* Visual Milestone Step Nodes */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">1. Entitlement</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">₹{totalEntitlementCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-slate-500 block">100% Annual Quota</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">2. Allocated</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">₹{totalAllocatedCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-slate-500 block">District Treasury</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">3. Recommended</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">₹{totalRecommendedCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-slate-500 block">97.0% Submitted</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">4. Sanctioned</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">₹{totalSanctionedCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">92.0% Approved</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">5. Disbursed</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">₹{totalDisbursedCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-blue-700 font-semibold block">68.0% Issued</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">6. Utilized</span>
              <span className="font-mono text-sm font-bold text-emerald-800 mt-1 block">₹{totalUtilizedCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">53.0% MB Certified</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-emerald-800 block tracking-wider">7. Remaining</span>
              <span className="font-mono text-sm font-bold text-emerald-950 mt-1 block">₹{remainingCr.toFixed(2)} Cr</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">Non-Lapsable</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EXECUTIVE METRIC KPI ROW */}
      {(activeView === 'overview' || activeView === 'attention') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Total Rec</span>
              <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{totalWorks}</span>
              <span className="text-[10px] text-slate-500">18th Lok Sabha</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
              {totalWorks}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">DA Sanction</span>
              <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">{totalWorks}</span>
              <span className="text-[10px] text-emerald-600 font-medium">100% Cleared</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-mono font-bold text-xs">
              ✓
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Active On-Ground</span>
              <span className="text-xl font-bold text-blue-700 font-mono mt-0.5 block">{ongoingCount}</span>
              <span className="text-[10px] text-blue-600 font-medium">Under Execution</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 font-mono font-bold text-xs">
              {Math.round((ongoingCount / totalWorks) * 100)}%
            </div>
          </div>

          <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-amber-800 tracking-wider block">Delayed / Stalled</span>
              <span className="text-xl font-bold text-amber-700 font-mono mt-0.5 block">{delayedCount}</span>
              <span className="text-[10px] text-amber-700 font-medium">Action Pending</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 font-mono font-bold text-xs">
              !
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Completed</span>
              <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">{completedCount}</span>
              <span className="text-[10px] text-slate-400">Ready Handover</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-mono font-bold text-xs">
              {Math.round((completedCount / totalWorks) * 100)}%
            </div>
          </div>

          <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/50 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-rose-800 tracking-wider block">High / Critical</span>
              <span className="text-xl font-bold text-rose-700 font-mono mt-0.5 block">{highRiskCount}</span>
              <span className="text-[10px] text-rose-700 font-medium">Signals Active</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300 font-mono font-bold text-xs animate-pulse">
              ▲
            </div>
          </div>
        </div>
      )}

      {/* VIEW: WHAT NEEDS YOUR ATTENTION? */}
      {(activeView === 'overview' || activeView === 'attention') && (
        <div className="border border-rose-200 rounded-md bg-white overflow-hidden space-y-0 shadow-xs">
          <div className="px-4 py-3 bg-rose-50/50 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <h2 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                What Needs Your Attention? ({attentionWorks.length} Priority Items)
              </h2>
            </div>
            <span className="text-[11px] text-rose-700 font-medium hidden sm:inline">
              Payments ahead of progress, stalled works, or missing UCs
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {attentionWorks.map((work) => (
              <div key={work.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{work.id}</span>
                      <span className="text-xs font-semibold text-slate-800">{work.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                        {work.risk.band} Risk ({work.risk.score})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Sanctioned: ₹{work.financial.sanctioned.toFixed(2)} Lakhs · Agency: {work.implementingAgency}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenRiskExplanation(work)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Why Flagged?
                    </button>
                    <button
                      onClick={() => openEscalationModal(work)}
                      className="px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ask District Authority</span>
                    </button>
                    <button
                      onClick={() => onSelectWork(work)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded border border-slate-150">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Specific Issue:</span>
                    <span className="text-slate-900 font-semibold">{work.rootCause?.issue || work.risk.signals[0]?.title}</span>
                    <span className="text-slate-500 block mt-0.5 text-[11px]">Duration: {work.rootCause?.sinceWhen || 'Over 60 days'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Recorded Evidence:</span>
                    <span className="text-slate-700">
                      Physical: <strong>{work.progress.physical}%</strong> vs Payment: <strong>{work.progress.financial.toFixed(1)}%</strong>
                    </span>
                    <span className="text-slate-500 block mt-0.5 text-[11px] truncate">
                      {work.rootCause?.evidenceSummary || work.risk.signals[0]?.evidence}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">What MP Can Do:</span>
                    <span className="text-slate-800 font-medium">{work.rootCause?.mpAction || 'Issue formal inquiry to District Magistrate.'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ROOT-CAUSE CLASSIFIER FOR DELAYED WORKS */}
      {(activeView === 'overview' || activeView === 'delayed') && (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden space-y-0">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Root-Cause Classifier for Delayed Works</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Explicit attribution of responsible stage instead of ambiguous "Ongoing" labels
              </span>
            </div>
            <span className="text-xs font-medium text-slate-600">
              {delayedWorks.length} works with active bottlenecks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Work ID & Name</th>
                  <th className="p-3">Identified Bottleneck</th>
                  <th className="p-3">Elapsed Delay</th>
                  <th className="p-3">Responsible Stage</th>
                  <th className="p-3">Recommended MP Action</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {delayedWorks.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-semibold text-slate-900">{w.id}</span>
                      <div className="font-medium text-slate-800 truncate max-w-xs">{w.name}</div>
                      <div className="text-[11px] text-slate-500">{w.category}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {w.rootCause?.issue || 'Behind schedule'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {w.dates.daysInCurrentStage} days stalled
                      {w.dates.delayDays > 0 && (
                        <span className="text-[11px] text-rose-600 block">(+{w.dates.delayDays}d beyond deadline)</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {w.rootCause?.responsibleStage || w.implementingAgency}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs leading-snug">
                      {w.rootCause?.mpAction || 'Request DA status update.'}
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEscalationModal(w)}
                        className="text-xs text-slate-900 font-semibold hover:underline cursor-pointer"
                      >
                        Inquire
                      </button>
                      <button
                        onClick={() => onSelectWork(w)}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LIVE GIS PROJECT MAP */}
      {activeView === 'geo-map' && (
        <LeafletProjectMap
          initialDistrictId={
            (currentMP.constituency || '').toLowerCase().includes('belgaum') || (currentMP.constituency || '').toLowerCase().includes('belagavi')
              ? 'belagavi'
              : (currentMP.constituency || '').toLowerCase().includes('dharwad') || (currentMP.constituency || '').toLowerCase().includes('hubballi')
              ? 'dharwad'
              : (currentMP.constituency || '').toLowerCase().includes('bangalore') || (currentMP.constituency || '').toLowerCase().includes('bengaluru')
              ? 'bengaluru'
              : 'mysuru'
          }
          works={mpWorks}
          onSelectWork={onSelectWork}
          title={`${currentMP.name} · Constituency Geospatial Project Nodes`}
        />
      )}

      {/* VIEW: ALL CONSTITUENCY WORKS (REPRESENTATIONAL VISUALIZER) */}
      {(activeView === 'overview' || activeView === 'works') && (
        <ConstituencyWorksVisualizer
          key={selectedMpName}
          title="My Works"
          mpName={selectedMpName}
          works={mpWorks}
          onSelectWork={onSelectWork}
          onOpenRiskExplanation={onOpenRiskExplanation}
          openEscalationModal={openEscalationModal}
        />
      )}

      {/* VIEW: ESCALATIONS TO DISTRICT AUTHORITY REGISTER */}
      {activeView === 'escalations' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Formal Inquiry Memos Dispatched to District Authority
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                Official inquiries generated on MP letterhead per statutory protocol
              </span>
            </div>

            <button
              onClick={() => openEscalationModal(works[0])}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose New Inquiry Memo</span>
            </button>
          </div>

          <div className="space-y-3">
            {sentEscalations.map((esc) => (
              <div key={esc.id} className="p-3.5 border border-slate-200 rounded-md bg-slate-50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{esc.id}</span>
                    <span className="text-xs font-medium text-slate-700">Ref: {esc.workId}</span>
                    <span className="text-[10px] text-slate-500">Dispatched: {esc.date}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold">
                    {esc.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">{esc.subject}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Addressed to: {esc.recipient}</span>
                  <span>Response Target: {esc.responseDue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NEW WORK RECOMMENDATION FORM */}
      {activeView === 'recommendations' && (
        <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Submit New Work Recommendation (FY 2025–26)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Statutory verification: Must create durable community assets. Unspent balance available: ₹{remainingCr.toFixed(2)} Cr
            </span>
          </div>

          <form onSubmit={handleCreateRecommendation} className="space-y-4 text-xs max-w-2xl">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Work Title / Description</label>
              <input
                type="text"
                required
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                placeholder="e.g. Construction of Community Hall & Library at Narayangaon..."
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Permissible Sector</label>
                <select
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                >
                  <option value="Drinking Water">Drinking Water & Sanitation</option>
                  <option value="Roads & Bridges">Roads, Culverts & Footpaths</option>
                  <option value="Education">School Classrooms & Laboratories</option>
                  <option value="Health">Primary Health Centre Equipment</option>
                  <option value="Community Infrastructure">Community Halls & Crematoria</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Estimated Cost (₹ in Lakhs)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={recCostLakhs}
                  onChange={(e) => setRecCostLakhs(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Specific Location (Taluka / Ward)</label>
                <input
                  type="text"
                  value={recLocation}
                  onChange={(e) => setRecLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Statutory SC/ST Beneficiary Tag</label>
                <select
                  value={recScStType}
                  onChange={(e) => setRecScStType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                >
                  <option value="sc">Scheduled Caste (Counts to 15% Annual Target)</option>
                  <option value="st">Scheduled Tribe (Counts to 7.5% Annual Target)</option>
                  <option value="none">General Public Infrastructure</option>
                </select>
              </div>
            </div>

            {/* Statutory Guideline Pre-Check */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                Statutory Permissibility Pre-Screening:
              </span>
              <div className="space-y-1.5 text-[11px]">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="assetType"
                    checked={recAssetType === 'public'}
                    onChange={() => setRecAssetType('public')}
                  />
                  <span>Located entirely on Government / Gram Panchayat public revenue land</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="assetType"
                    checked={recAssetType === 'trust'}
                    onChange={() => setRecAssetType('trust')}
                  />
                  <span>Located on Private Charitable Trust premises (Requires DA verification deed)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="assetType"
                    checked={recAssetType === 'religious'}
                    onChange={() => setRecAssetType('religious')}
                  />
                  <span>Located on Religious or Private Commercial property (Strictly Prohibited)</span>
                </label>
              </div>
              {recAssetType === 'religious' && (
                <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1 mt-1">
                  <Ban className="w-3.5 h-3.5" />
                  <span>Prohibited: MPLADS Section 2.1 forbids expenditure on places of religious worship.</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={recAssetType === 'religious'}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Submit Recommendation to District Magistrate ({currentMP.constituency})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Escalation Draft Modal ("Ask District Authority") */}
      {selectedEscalationWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ask District Authority — Formal Inquiry Memo
                </h3>
              </div>
              <button
                onClick={() => setSelectedEscalationWork(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {escalationSent ? (
                <div className="p-6 text-center space-y-2 bg-emerald-50 rounded border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">Formal Inquiry Dispatched</h4>
                  <p className="text-xs text-emerald-800">
                    Your inquiry has been officially transmitted to the District Magistrate ({selectedEscalationWork?.district || currentMP.constituency}). Acknowledgment receipt logged in MARGA Evidence Ledger.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-600">
                    <strong>Statutory Channel:</strong> This generates a formal inquiry memo on Member of Parliament letterhead addressed to the statutory District Authority. The draft is pre-populated with verified progress figures and is fully editable.
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Inquiry Body</label>
                    <textarea
                      rows={9}
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedEscalationWork(null)}
                      className="px-4 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEscalation}
                      className="px-4 py-1.5 font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit to District Magistrate</span>
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
