import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft,
  Eye, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { Work } from '../../types';

interface PublicPortalProps {
  works: Work[];
  onBackToLanding: () => void;
  onSelectWork: (work: Work) => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  works,
  onBackToLanding,
  onSelectWork
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const districts = useMemo(() => {
    const set = new Set<string>();
    works.forEach(w => {
      if (w.district) set.add(w.district);
    });
    return Array.from(set).sort();
  }, [works]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    works.forEach(w => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set).sort();
  }, [works]);

  const totalSanctionedCr = useMemo(() => {
    const sum = works.reduce((acc, w) => acc + (w.financial.sanctioned || 0), 0);
    return (sum / 100).toFixed(2);
  }, [works]);

  const totalCompleted = useMemo(() => {
    return works.filter(w => w.status === 'Completed' || w.status === 'Substantially Complete').length;
  }, [works]);

  const filteredWorks = useMemo(() => {
    return works.filter(work => {
      const matchesSearch = 
        work.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (work.location && work.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (work.district && work.district.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDistrict = districtFilter === 'ALL' || work.district === districtFilter;
      const matchesCategory = categoryFilter === 'ALL' || work.category === categoryFilter;
      const matchesStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'Completed' && (work.status === 'Completed' || work.status === 'Substantially Complete')) ||
        (statusFilter === 'Ongoing' && work.status === 'Ongoing') ||
        (statusFilter === 'Delayed' && (work.status === 'Delayed' || work.status === 'Attention Required'));

      return matchesSearch && matchesDistrict && matchesCategory && matchesStatus;
    });
  }, [works, searchTerm, districtFilter, categoryFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white tracking-wider">MARGA</span>
              <span className="text-slate-600">/</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Public Transparency Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Open Statutory Data · Citizens Only</span>
          </div>
        </div>
      </header>

      {/* Main Public Canvas */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
        {/* Intro Transparency Notice */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
              <Eye className="w-4 h-4" />
              <span>Open Public Inspection</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Community Development & Fund Transparency
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every citizen can openly audit sanctioned funds, physical progress, and project locations in their constituency. Internal administrative communications between officials remain strictly private.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Public Works</span>
              <span className="text-xl font-black text-white font-mono">{works.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Sanctioned</span>
              <span className="text-xl font-black text-emerald-400 font-mono">₹{totalSanctionedCr} Cr</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block">Completed</span>
              <span className="text-xl font-black text-sky-400 font-mono">{totalCompleted} Works</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project name, ID, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
            >
              <option value="ALL">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
            >
              <option value="ALL">All Sectors / Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200"
            >
              <option value="ALL">All Progress Statuses</option>
              <option value="Completed">Completed Works</option>
              <option value="Ongoing">Works in Progress</option>
              <option value="Delayed">Delayed / Attention</option>
            </select>
          </div>
        </div>

        {/* Public Works Transparency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorks.map((work) => {
            const isFinished = work.status === 'Completed' || work.status === 'Substantially Complete';
            const sanctionedAmount = work.financial.sanctioned?.toFixed(2) || '0.00';
            const spentAmount = work.financial.expenditure?.toFixed(2) || '0.00';
            const progressPct = Math.min(100, Math.round(work.progress.physical || 0));

            return (
              <div
                key={work.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {work.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isFinished
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : work.status === 'Ongoing'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {work.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {work.name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{work.location || work.district}, {work.state}</span>
                  </div>

                  {/* Financial & Physical Summary */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Sanctioned Budget:</span>
                      <span className="font-mono font-bold text-white">₹{sanctionedAmount} Lakhs</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Expenditure Released:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{spentAmount} Lakhs</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Physical Execution:</span>
                        <span className="font-bold text-slate-200">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isFinished ? 'bg-emerald-400' : 'bg-sky-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Sector: {work.category}
                  </span>
                  <button
                    onClick={() => onSelectWork(work)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Public Specs</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredWorks.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
            <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h5 className="font-bold text-white text-base">No Matching Public Works</h5>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter selection.</p>
          </div>
        )}
      </main>
    </div>
  );
};