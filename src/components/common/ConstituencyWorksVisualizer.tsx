import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid,
  Kanban,
  BarChart3,
  Table as TableIcon,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Droplets,
  GraduationCap,
  HeartPulse,
  HardHat,
  Camera,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Check,
} from 'lucide-react';
import { Work } from '../../types';

interface ConstituencyWorksVisualizerProps {
  works: Work[];
  title?: string;
  mpName?: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  openEscalationModal?: (work: Work) => void;
}

export const ConstituencyWorksVisualizer: React.FC<ConstituencyWorksVisualizerProps> = ({
  works,
  title,
  mpName,
  onSelectWork,
  onOpenRiskExplanation,
  openEscalationModal,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'pipeline' | 'analytics' | 'table'>('cards');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'cost' | 'risk' | 'recent'>('progress');

  // Strict isolation: strictly enforce showing only works belonging to the selected MP
  const mpSpecificWorks = useMemo(() => {
    if (!mpName || mpName === 'all') return works;
    const target = mpName.trim().toLowerCase();
    return works.filter((w) => (w.mpName || '').trim().toLowerCase() === target);
  }, [works, mpName]);

  // Dynamically extract categories available in the active MP's works
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    mpSpecificWorks.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set).sort();
  }, [mpSpecificWorks]);

  // Reset category filter if previous category doesn't exist in current works
  useEffect(() => {
    if (categoryFilter !== 'all') {
      const exists = mpSpecificWorks.some((w) => w.category === categoryFilter);
      if (!exists) setCategoryFilter('all');
    }
  }, [mpSpecificWorks, categoryFilter]);

  // Sector icon helper
  const getSectorIcon = (cat?: string) => {
    switch ((cat || '').toLowerCase()) {
      case 'drinking water':
      case 'water supply':
        return <Droplets className="w-3.5 h-3.5 text-sky-600" />;
      case 'education':
      case 'schools':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />;
      case 'health':
      case 'healthcare':
      case 'hospital':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'roads & bridges':
      case 'roads':
      case 'transport':
        return <HardHat className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  // Filtered & Sorted works with safe fallbacks
  const filteredWorks = useMemo(() => {
    return mpSpecificWorks.filter((w) => {
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const match =
          (w.name || '').toLowerCase().includes(q) ||
          (w.id || '').toLowerCase().includes(q) ||
          (w.category || '').toLowerCase().includes(q) ||
          (w.location || '').toLowerCase().includes(q) ||
          (w.district || '').toLowerCase().includes(q) ||
          (w.mpName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'delayed' && w.status !== 'Delayed' && w.status !== 'Attention Required')
          return false;
        if (statusFilter === 'ongoing' && w.status !== 'Ongoing') return false;
        if (statusFilter === 'completed' && w.status !== 'Completed' && w.status !== 'Substantially Complete')
          return false;
        if (statusFilter === 'high-risk' && w.risk?.band !== 'High' && w.risk?.band !== 'Critical')
          return false;
      }
      if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
      return true;
    }).sort((a, b) => {
      const aPhy = a.progress?.physical ?? 0;
      const bPhy = b.progress?.physical ?? 0;
      const aCost = a.financial?.sanctioned ?? 0;
      const bCost = b.financial?.sanctioned ?? 0;
      const aRisk = a.risk?.score ?? 0;
      const bRisk = b.risk?.score ?? 0;
      const aDays = a.dates?.daysInCurrentStage ?? 0;
      const bDays = b.dates?.daysInCurrentStage ?? 0;

      if (sortBy === 'progress') return bPhy - aPhy;
      if (sortBy === 'cost') return bCost - aCost;
      if (sortBy === 'risk') return bRisk - aRisk;
      return aDays - bDays;
    });
  }, [mpSpecificWorks, searchFilter, statusFilter, categoryFilter, sortBy]);

  // Aggregate stats for visual ribbon
  const totalSanctioned = mpSpecificWorks.reduce((sum, w) => sum + (w.financial?.sanctioned || 0), 0) || 1;
  const totalExpended = mpSpecificWorks.reduce((sum, w) => sum + (w.financial?.expenditure || 0), 0);
  const avgPhysical = Math.round(
    mpSpecificWorks.reduce((sum, w) => sum + (w.progress?.physical || 0), 0) / (mpSpecificWorks.length || 1)
  );
  const avgFinancial = Math.round(
    mpSpecificWorks.reduce((sum, w) => sum + (w.progress?.financial || 0), 0) / (mpSpecificWorks.length || 1)
  );

  // Sector distribution breakdown
  const sectorGroups = useMemo(() => {
    const groups: Record<string, { count: number; totalCost: number; avgProg: number }> = {};
    mpSpecificWorks.forEach((w) => {
      const cat = w.category || 'General Infrastructure';
      if (!groups[cat]) {
        groups[cat] = { count: 0, totalCost: 0, avgProg: 0 };
      }
      groups[cat].count += 1;
      groups[cat].totalCost += w.financial?.sanctioned || 0;
      groups[cat].avgProg += w.progress?.physical || 0;
    });
    return Object.entries(groups).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalCost: data.totalCost,
      avgProg: Math.round(data.avgProg / (data.count || 1)),
    }));
  }, [mpSpecificWorks]);

  // Pipeline stages
  const pipelineStages = [
    {
      id: 'sanctioned',
      label: 'Sanctioned & Pre-Work',
      sub: '0% – 20% Execution',
      color: 'border-slate-300 bg-slate-50/70',
      items: filteredWorks.filter((w) => w.progress.physical <= 20),
    },
    {
      id: 'ongoing',
      label: 'Active MB Execution',
      sub: '21% – 60% Execution',
      color: 'border-blue-200 bg-blue-50/30',
      items: filteredWorks.filter((w) => w.progress.physical > 20 && w.progress.physical <= 60),
    },
    {
      id: 'advanced',
      label: 'Finishing & Inspection',
      sub: '61% – 99% Execution',
      color: 'border-purple-200 bg-purple-50/30',
      items: filteredWorks.filter((w) => w.progress.physical > 60 && w.progress.physical < 100),
    },
    {
      id: 'completed',
      label: 'Completed & Certified',
      sub: '100% Final Handover',
      color: 'border-emerald-200 bg-emerald-50/30',
      items: filteredWorks.filter((w) => w.progress.physical >= 100),
    },
  ];

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
      {/* Visual Header & Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {title ? `${title} — Constituency Works Visualizer (${filteredWorks.length} Works)` : `Constituency Works Visualizer (${filteredWorks.length} Works)`}
            </h3>
            {mpName ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold">
                MP: {mpName}
              </span>
            ) : (
              filteredWorks.length > 0 && (filteredWorks[0].mpName || filteredWorks[0].district) && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold">
                  {filteredWorks[0].mpName ? `${filteredWorks[0].mpName}` : ''}
                  {filteredWorks[0].mpName && filteredWorks[0].district ? ' · ' : ''}
                  {filteredWorks[0].district ? `${filteredWorks[0].district}` : ''}
                </span>
              )
            )}
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              My Works · Live Physical &amp; Financial State
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Interactive representational views of regular constituency works with graphical progress gauges, sector footprints, and execution milestones.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Visual Card Gallery"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Visual Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'pipeline'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Stage Pipeline Kanban"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Graphical Sector & Spending Visualizer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sector Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Visual Data Matrix"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Visual Matrix</span>
          </button>
        </div>
      </div>

      {/* Visual Infographic Progress Bar / Summary Ribbon */}
      <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Physical Completion Gauge */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-600"
                strokeDasharray={`${avgPhysical}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black font-mono text-slate-900">
              {avgPhysical}%
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
              Avg Physical Progress
            </span>
            <span className="text-xs font-bold text-slate-900">
              {works.filter((w) => w.progress.physical >= 80).length} of {works.length} Near Complete
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">Certified on-ground MB</div>
          </div>
        </div>

        {/* Financial Expenditure Meter */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600"
                strokeDasharray={`${avgFinancial}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black font-mono text-slate-900">
              {avgFinancial}%
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
              Fund Utilization Pace
            </span>
            <span className="text-xs font-bold font-mono text-slate-900">
              ₹{(totalExpended / 100).toFixed(2)} / ₹{(totalSanctioned / 100).toFixed(2)} Cr
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">Disbursed to agencies</div>
          </div>
        </div>

        {/* Sectoral Footprint Mini Bar */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            <span>Sector Footprint</span>
            <span className="text-slate-400 font-mono">{sectorGroups.length} Sectors</span>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5 my-1.5">
            {sectorGroups.map((s, idx) => {
              const pct = (s.totalCost / totalSanctioned) * 100;
              const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500'];
              return (
                <div
                  key={s.category}
                  className={`${colors[idx % colors.length]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${s.category}: ${pct.toFixed(0)}% (₹${s.totalCost.toFixed(1)}L)`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Water & Roads Priority</span>
            <span className="font-semibold text-slate-700">100% Sanctioned</span>
          </div>
        </div>

        {/* Statutory SC/ST Mandate Visualizer */}
        <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-900 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              SC/ST Statutory Quota
            </span>
            <span className="text-emerald-700 font-mono font-bold">22.5% Target</span>
          </div>
          <div className="space-y-1 my-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-950">
              <span>SC Allocation (15% req.)</span>
              <span className="font-mono font-bold">16.8% (Met)</span>
            </div>
            <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">Clause 2.3 MPLADS Compliant</div>
        </div>
      </div>

      {/* Visual Filter Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by title, ID, area..."
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white w-48 sm:w-56"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {title ? `${title} (${filteredWorks.length})` : `All (${filteredWorks.length})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ongoing')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'ongoing'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ongoing
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('delayed')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'delayed'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delayed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 font-medium"
          >
            <option value="all">All Sectors ({works.length})</option>
            {availableCategories.map((cat) => {
              const count = works.filter((w) => w.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2 py-1 border border-slate-300 rounded bg-white text-slate-800 font-medium"
          >
            <option value="progress">Physical Progress % (High to Low)</option>
            <option value="cost">Sanction Amount (₹ Lakhs)</option>
            <option value="risk">Risk Score</option>
            <option value="recent">Stage Duration</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL CARDS (REPRESENTATIONAL GALLERY) */}
      {viewMode === 'cards' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-100/60">
          {filteredWorks.map((work) => {
            const isCriticalMismatch = work.progress.financial > work.progress.physical + 20;
            const progressColor =
              work.progress.physical >= 80
                ? 'text-emerald-600'
                : work.progress.physical >= 40
                ? 'text-blue-600'
                : 'text-amber-600';

            return (
              <div
                key={work.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Sector & Identity */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded-md bg-slate-100 border border-slate-200">
                        {getSectorIcon(work.category)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[150px]">
                        {work.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {work.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenRiskExplanation(work)}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                          work.risk.band === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : work.risk.band === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                        title="Click to view risk explanation"
                      >
                        {work.risk.band}
                      </button>
                    </div>
                  </div>

                  {/* Work Title */}
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-2 leading-snug">
                    {work.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>{work.location}</span>
                    <span>•</span>
                    <span className="truncate max-w-[130px]">{work.implementingAgency}</span>
                  </div>

                  {/* Visual Progress Dial & Comparison Gauge */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    {/* SVG Radial Gauge */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={progressColor}
                            strokeDasharray={`${work.progress.physical}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-black font-mono text-slate-900">
                          {work.progress.physical}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                          Physical Exec
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {work.progress.physical >= 100
                            ? 'Complete'
                            : work.progress.physical > 60
                            ? 'Finishing Stage'
                            : 'In Progress'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Draw Gauge */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                        Financial Draw
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCriticalMismatch ? 'text-amber-700' : 'text-slate-900'
                        }`}
                      >
                        {work.progress.financial.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        ₹{work.financial.expenditure.toFixed(1)} L of ₹{work.financial.sanctioned.toFixed(1)} L
                      </span>
                    </div>
                  </div>

                  {/* Visual Divergence Bar: Physical vs Financial */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="w-2 h-2 rounded-full bg-slate-900" /> Physical: {work.progress.physical}%
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCriticalMismatch ? 'bg-amber-600 animate-pulse' : 'bg-blue-600'
                          }`}
                        />
                        Payment: {work.progress.financial.toFixed(1)}%
                      </span>
                    </div>

                    {/* Dual Layer Progress Bar */}
                    <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      {/* Financial draw background bar */}
                      <div
                        className={`absolute top-0 left-0 h-full ${
                          isCriticalMismatch ? 'bg-amber-400' : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(work.progress.financial, 100)}%` }}
                      />
                      {/* Certified physical execution foreground bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-slate-900"
                        style={{ width: `${work.progress.physical}%` }}
                      />
                    </div>
                  </div>

                  {/* 5-Stage Visual Lifecycle Step Pipeline */}
                  <div className="mt-4 pt-3 border-t border-slate-150">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider">
                        Stage: {work.lifecycleStage}
                      </span>
                      <span className="font-mono text-slate-400">{work.dates.daysInCurrentStage}d in stage</span>
                    </div>

                    {/* Step Visualizer Dots */}
                    <div className="flex items-center justify-between relative px-1">
                      <div className="absolute top-1.5 left-2 right-2 h-0.5 bg-slate-200 -z-0" />
                      {[
                        { label: 'Sanct', done: true },
                        { label: 'Tender', done: work.progress.physical > 0 },
                        { label: 'MB Active', done: work.progress.physical > 25 },
                        { label: 'Inspect', done: work.progress.physical >= 80 },
                        { label: 'Handover', done: work.progress.physical >= 100 },
                      ].map((step, sidx) => (
                        <div key={sidx} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${
                              step.done
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}
                          >
                            {step.done ? <Check className="w-2 h-2" /> : sidx + 1}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 font-mono">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {work.evidence && work.evidence.length > 0 && (
                      <span className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        <Camera className="w-3 h-3 text-slate-500" />
                        {work.evidence.length} photos
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {openEscalationModal && (
                      <button
                        type="button"
                        onClick={() => openEscalationModal(work)}
                        className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                        title="Draft official statutory inquiry memo"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectWork(work)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: PIPELINE KANBAN FLOW */}
      {viewMode === 'pipeline' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-slate-100/70 overflow-x-auto min-h-[500px]">
          {pipelineStages.map((stage) => (
            <div
              key={stage.id}
              className={`rounded-xl border p-3 flex flex-col justify-between ${stage.color}`}
            >
              <div>
                {/* Stage Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {stage.label}
                    </h4>
                    <span className="text-[10px] text-slate-500">{stage.sub}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-900">
                    {stage.items.length}
                  </span>
                </div>

                {/* Stage Work Cards */}
                <div className="space-y-2.5">
                  {stage.items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-white/50 rounded-lg border border-dashed border-slate-200">
                      No works currently in this phase
                    </div>
                  ) : (
                    stage.items.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => onSelectWork(w)}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-400 cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-slate-500">{w.id}</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{w.financial.sanctioned.toFixed(1)} L
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {w.name}
                        </h5>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Physical:</span>
                            <span className="font-mono font-bold text-slate-900">{w.progress.physical}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${w.progress.physical}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span className="truncate max-w-[120px]">{w.category}</span>
                          <span className="font-mono">{w.dates.daysInCurrentStage}d in stage</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Total Value:</span>
                <span className="font-bold text-slate-800">
                  ₹{stage.items.reduce((s, x) => s + x.financial.sanctioned, 0).toFixed(1)} Lakhs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 3: GRAPHICAL SECTOR & SPENDING ANALYTICS */}
      {viewMode === 'analytics' && (
        <div className="p-5 space-y-6 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sectoral Breakdown Visual Bars */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <span>Sector-Wise Fund Allocation & Physical Progress</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-4">
                Comparison of sanctioned investments across priority public works domains.
              </p>

              <div className="space-y-4">
                {sectorGroups.map((sec) => {
                  const pctCost = (sec.totalCost / totalSanctioned) * 100;
                  return (
                    <div key={sec.category} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getSectorIcon(sec.category)}
                          <span className="font-bold text-slate-900">{sec.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({sec.count} works)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">
                            ₹{sec.totalCost.toFixed(1)} Lakhs
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5">({pctCost.toFixed(1)}%)</span>
                        </div>
                      </div>

                      {/* Visual Bars for Progress vs Expenditure */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Average Execution: <strong>{sec.avgProg}%</strong></span>
                          <span>Sanctioned Share: <strong>{pctCost.toFixed(1)}%</strong></span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-slate-900 rounded-full"
                            style={{ width: `${sec.avgProg}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Divergence & Risk Distribution Chart */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-700" />
                  <span>Physical Execution vs Financial Draw Divergence</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-4">
                  Visual representation of payment lead/lag against certified measurement book entries.
                </p>

                <div className="space-y-3">
                  {filteredWorks.slice(0, 5).map((w) => {
                    const diff = w.progress.financial - w.progress.physical;
                    const isAhead = diff > 10;
                    return (
                      <div key={w.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">{w.name}</span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isAhead ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {diff > 0 ? `+${diff.toFixed(1)} pp Payment Lead` : `${diff.toFixed(1)} pp Balanced`}
                          </span>
                        </div>

                        {/* Dual Bar */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-400 block">Physical: {w.progress.physical}%</span>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                              <div className="h-full bg-slate-900" style={{ width: `${w.progress.physical}%` }} />
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Disbursed: {w.progress.financial.toFixed(1)}%</span>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                              <div
                                className={`h-full ${isAhead ? 'bg-amber-500' : 'bg-blue-600'}`}
                                style={{ width: `${Math.min(w.progress.financial, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Statutory Rule: Payment must not run {'>'}15% ahead of physical certification.</span>
                <span className="font-bold text-slate-900">Clause 4.4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: VISUAL MATRIX (COMPACT GRAPHIC TABLE) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3">Work Identity & Sector</th>
                <th className="p-3">Sanction Amount</th>
                <th className="p-3">Physical Progress Gauge</th>
                <th className="p-3">Financial Draw Gauge</th>
                <th className="p-3">Lifecycle Stage</th>
                <th className="p-3">Risk Assessment</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorks.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-100 border border-slate-200">
                        {getSectorIcon(w.category)}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900">{w.id}</span>
                        <div className="font-medium text-slate-800 truncate max-w-sm">{w.name}</div>
                        <div className="text-[11px] text-slate-500">{w.category} · {w.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    ₹{w.financial.sanctioned.toFixed(2)} L
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 w-10">
                        {w.progress.physical}%
                      </span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${w.progress.physical}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 w-12">
                        {w.progress.financial.toFixed(1)}%
                      </span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.progress.financial > w.progress.physical + 15 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(w.progress.financial, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {w.lifecycleStage}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onOpenRiskExplanation(w)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold cursor-pointer ${
                        w.risk.band === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : w.risk.band === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {w.risk.band} ({w.risk.score})
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectWork(w)}
                      className="px-3 py-1 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
