import React, { useState, useMemo } from 'react';
import {
  Globe2,
  ShieldAlert,
  Database,
  FileCheck2,
  AlertTriangle,
  Scale,
  Activity,
  ArrowRight,
  Download,
  Filter,
  Search,
  Send,
  Building2,
  CheckCircle2,
  BookOpen,
  DollarSign,
  FileCheck,
  ShieldCheck,
  LayoutDashboard,
  Check,
  XCircle,
  HelpCircle,
  Map,
  RefreshCw,
  Printer,
  FileText,
  ChevronRight,
  ExternalLink,
  PieChart,
  BarChart3,
  AlertOctagon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Work, DistrictStats } from '../../types';
import { NATIONAL_SUMMARY_DATA, STATE_SUMMARY_DATA } from '../../data/datasetData';
import { LeafletProjectMap } from '../common/LeafletProjectMap';

interface MospiPortalProps {
  works: Work[];
  districts: DistrictStats[];
  activeView: string;
  onSelectWork: (work: Work) => void;
  onOpenRiskExplanation: (work: Work) => void;
  onActionComplete: (msg: string) => void;
  onOpenMatrix?: () => void;
}

export const MospiPortal: React.FC<MospiPortalProps> = ({
  works,
  districts,
  activeView,
  onSelectWork,
  onOpenRiskExplanation,
  onActionComplete,
  onOpenMatrix,
}) => {
  // 1. Authoritative National Macro Aggregates
  const nationalFundsReleasedCr = Number((NATIONAL_SUMMARY_DATA.totalAllocated / 100000000).toFixed(1));
  const nationalFundsUtilizedCr = Number((NATIONAL_SUMMARY_DATA.totalExpenditure / 100000000).toFixed(1));
  const nationalAbsorptionPct = NATIONAL_SUMMARY_DATA.utilizationPercentage.toFixed(1);
  const nationalActiveWorks = NATIONAL_SUMMARY_DATA.pendingWorks;
  const nationalCompletedWorks = NATIONAL_SUMMARY_DATA.totalWorksCompleted;
  const nationalCompletionPct = NATIONAL_SUMMARY_DATA.completionRate.toFixed(1);

  // Filter States for Overview & Ranking
  const [stateSearch, setStateSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL' | 'NE'>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [districtSortBy, setDistrictSortBy] = useState<'risk' | 'works' | 'delayed' | 'utilization' | 'ucs'>('risk');

  // Pre-Audit Triage Items
  const preAuditItems = useMemo(() => {
    return [
      {
        id: 'AUD-01',
        workId: 'WRK-1042',
        work: works.find((w) => w.id === 'WRK-1042') || works[0] || { id: 'WRK-1042', name: 'Shivajinagar Community Hall', district: 'Pune', state: 'Maharashtra', financial: { sanctioned: 65.0, disbursed: 65.0 } } as unknown as Work,
        district: 'Pune (Maharashtra)',
        mpName: 'Dr. Arvind Patil',
        exposureCr: 0.65,
        issue: 'Payment acceleration (+42.8 pp) over certified physical progress; 74 days stalled without MB entry',
        cagRisk: 'High Exposure (Premature Milestone Drawdown)',
        recommendedAudit: 'Order Special Physical Audit by CAG Maharashtra State Branch',
      },
      {
        id: 'AUD-02',
        workId: 'WRK-1044',
        work: works.find((w) => w.id === 'WRK-1044') || works[1] || { id: 'WRK-1044', name: 'High School Science Block', district: 'Pune', state: 'Maharashtra', financial: { sanctioned: 28.0, disbursed: 28.0 } } as unknown as Work,
        district: 'Pune (Maharashtra)',
        mpName: 'Dr. Arvind Patil',
        exposureCr: 0.28,
        issue: 'Unadjusted vendor advance exceeding 60-day statutory threshold without site delivery (GFR Rule 172)',
        cagRisk: 'GFR Rule 172 Non-Compliance',
        recommendedAudit: 'Reconciliation of District Treasury Escrow Sub-Ledger',
      },
      {
        id: 'AUD-03',
        workId: 'WRK-1043',
        work: works.find((w) => w.id === 'WRK-1043') || works[2] || { id: 'WRK-1043', name: 'Gram Panchayat Drinking Water Plant', district: 'Gadchiroli', state: 'Maharashtra', financial: { sanctioned: 42.0, disbursed: 42.0 } } as unknown as Work,
        district: 'Gadchiroli (Maharashtra)',
        mpName: 'Smt. Vandana Chavan',
        exposureCr: 0.42,
        issue: 'Multiple time-extensions granted without revised administrative sanction or liquidated damages',
        cagRisk: 'Procurement Irregularity',
        recommendedAudit: 'Technical Audit of Contract Variation Orders',
      },
      {
        id: 'AUD-04',
        workId: 'WRK-1051',
        work: works.find((w) => w.id === 'WRK-1051') || works[3] || { id: 'WRK-1051', name: 'Rural Health Sub-Center Upgrade', district: 'Siwan', state: 'Bihar', financial: { sanctioned: 50.0, disbursed: 45.0 } } as unknown as Work,
        district: 'Siwan (Bihar)',
        mpName: 'Vijaylakshmi Devi',
        exposureCr: 0.50,
        issue: 'Payment processed without mandatory timestamped geotagged inspection evidence (MPLADS §5.2)',
        cagRisk: 'Geotagging Non-Compliance',
        recommendedAudit: 'Joint Physical Inspection by Nodal State Authority',
      },
    ];
  }, [works]);

  // Data Integrity Discrepancies
  const [reconciledCount, setReconciledCount] = useState(742);
  const [isReconciling, setIsReconciling] = useState(false);

  const reconciliationDiscrepancies = [
    {
      id: 'DISC-01',
      district: 'Pune',
      state: 'Maharashtra',
      type: 'Voucher Aggregation Gap',
      reportedAggregateCr: 32.4,
      projectLedgerSumCr: 30.55,
      varianceCr: 1.85,
      status: 'Failed Reconciliation',
      details: 'Reported district aggregate expenditure exceeds sum of individual vetted vouchers by ₹1.85 Cr.',
    },
    {
      id: 'DISC-02',
      district: 'Gadchiroli',
      state: 'Maharashtra',
      type: 'Bank Interest Uncredited',
      reportedAggregateCr: 18.2,
      projectLedgerSumCr: 17.75,
      varianceCr: 0.45,
      status: 'Warning',
      details: 'Bank interest accrued on district pool account pending credit back to Consolidated Fund of India.',
    },
    {
      id: 'DISC-03',
      district: 'Siwan',
      state: 'Bihar',
      type: 'Form 12-C Variance',
      reportedAggregateCr: 24.6,
      projectLedgerSumCr: 23.68,
      varianceCr: 0.92,
      status: 'Warning',
      details: 'Physical measurement book totals diverge from Form 12-C certified utilization figure.',
    },
    {
      id: 'DISC-04',
      district: 'Mysuru',
      state: 'Karnataka',
      type: 'PFMS Single Escrow Balanced',
      reportedAggregateCr: 41.2,
      projectLedgerSumCr: 41.2,
      varianceCr: 0.0,
      status: 'Fully Reconciled',
      details: 'All active project ledgers exactly match Public Financial Management System (PFMS) entries.',
    },
  ];

  // State Region Mapping
  const regionMap: Record<string, string> = {
    'Uttar Pradesh': 'NORTH',
    'Punjab': 'NORTH',
    'Haryana': 'NORTH',
    'Rajasthan': 'NORTH',
    'Himachal Pradesh': 'NORTH',
    'Uttarakhand': 'NORTH',
    'Jammu and Kashmir': 'NORTH',
    'Delhi': 'NORTH',
    'Maharashtra': 'WEST',
    'Gujarat': 'WEST',
    'Goa': 'WEST',
    'Madhya Pradesh': 'CENTRAL',
    'Chhattisgarh': 'CENTRAL',
    'Bihar': 'EAST',
    'West Bengal': 'EAST',
    'Odisha': 'EAST',
    'Jharkhand': 'EAST',
    'Karnataka': 'SOUTH',
    'Tamil Nadu': 'SOUTH',
    'Andhra Pradesh': 'SOUTH',
    'Telangana': 'SOUTH',
    'Kerala': 'SOUTH',
    'Assam': 'NE',
    'Tripura': 'NE',
    'Meghalaya': 'NE',
    'Manipur': 'NE',
    'Nagaland': 'NE',
    'Mizoram': 'NE',
    'Arunachal Pradesh': 'NE',
    'Sikkim': 'NE',
  };

  const filteredStates = useMemo(() => {
    return STATE_SUMMARY_DATA.filter((st) => {
      const matchesSearch = st.state.toLowerCase().includes(stateSearch.toLowerCase());
      const stateRegion = regionMap[st.state] || 'OTHER';
      const matchesRegion = regionFilter === 'ALL' || stateRegion === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [stateSearch, regionFilter]);

  // District Ranking Sorting
  const sortedDistricts = useMemo(() => {
    const list = [...districts];
    if (riskFilter !== 'all') {
      return list.filter((d) => d.riskBand.toLowerCase() === riskFilter.toLowerCase());
    }
    return list.sort((a, b) => {
      if (districtSortBy === 'risk') return b.riskScore - a.riskScore;
      if (districtSortBy === 'works') return b.totalWorks - a.totalWorks;
      if (districtSortBy === 'delayed') return b.delayedWorks - a.delayedWorks;
      if (districtSortBy === 'utilization') return a.expenditureRate - b.expenditureRate;
      if (districtSortBy === 'ucs') return b.pendingUCs - a.pendingUCs;
      return 0;
    });
  }, [districts, riskFilter, districtSortBy]);

  return (
    <div className="space-y-6">
      {/* Central Ministry Sovereign Header */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono">
              MoSPI National Division
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ministry of Statistics &amp; Programme Implementation · Government of India
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
              ● Live Atlas Connected (130,882 Works)
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1">
            Joint Secretary &amp; National Program Director (MPLADS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apex monitoring of ₹11,681.90 Cr central allocations across 774 Members of Parliament and 780 Districts.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">National Absorption</span>
            <span className="font-mono text-base font-bold text-emerald-700">{nationalAbsorptionPct}%</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-500 block">Active Works Monitored</span>
            <span className="font-mono text-base font-bold text-slate-900">{nationalActiveWorks.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW: NATIONAL OVERVIEW                                                */}
      {/* ========================================================================= */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Macro National KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Total Central Release</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">₹{nationalFundsReleasedCr} Cr</span>
              <span className="text-[10px] text-slate-400">774 MPs Entitlement</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Certified Spent</span>
              <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block">₹{nationalFundsUtilizedCr} Cr</span>
              <span className="text-[10px] text-emerald-600">{nationalAbsorptionPct}% absorbed</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Completed Works</span>
              <span className="text-lg font-bold text-blue-700 font-mono mt-1 block">{nationalCompletedWorks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">{nationalCompletionPct}% completed</span>
            </div>
            <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/40 shadow-xs">
              <span className="text-[11px] text-rose-800 font-medium block">Pre-Audit Triage</span>
              <span className="text-lg font-bold text-rose-700 font-mono mt-1 block">{preAuditItems.length} Works</span>
              <span className="text-[10px] text-rose-600">CAG priority scrutiny</span>
            </div>
            <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/40 shadow-xs">
              <span className="text-[11px] text-amber-800 font-medium block">Treasury Variances</span>
              <span className="text-lg font-bold text-amber-700 font-mono mt-1 block">38 Districts</span>
              <span className="text-[10px] text-amber-600">₹14.82 Cr flagged</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Data Integrity Score</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">97.4%</span>
              <span className="text-[10px] text-slate-400">PFMS verified</span>
            </div>
          </div>

          {/* Central Treasury Single Escrow Pipeline Flow */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Central Treasury Single Escrow Pipeline (FY 2025–26)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                MoSPI CNA · State SNA · District Escrow Sub-Accounts
              </span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Financial Execution Progression</span>
                <span className="font-mono text-emerald-800">
                  {nationalAbsorptionPct}% Certified Utilization (₹{nationalFundsUtilizedCr} Cr of ₹{nationalFundsReleasedCr} Cr)
                </span>
              </div>

              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className="h-full bg-emerald-600 rounded-l-full transition-all"
                  style={{ width: `${nationalAbsorptionPct}%` }}
                  title={`Utilized: ₹${nationalFundsUtilizedCr} Cr`}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: '22%' }}
                  title="Disbursed In-Pipeline: ₹2,569 Cr"
                />
                <div
                  className="h-full bg-indigo-400 transition-all"
                  style={{ width: '18%' }}
                  title="Sanctioned Awaiting Draw: ₹2,102 Cr"
                />
                <div
                  className="h-full bg-slate-300 rounded-r-full transition-all"
                  style={{ width: `${Math.max(0, 100 - Number(nationalAbsorptionPct) - 40)}%` }}
                  title="Uncommitted Central Balance"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Utilized (Vetted MB Entries): ₹{nationalFundsUtilizedCr} Cr
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Active In-Execution Pipeline: ₹2,569.0 Cr
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> Uncommitted Balance: ₹{(nationalFundsReleasedCr - nationalFundsUtilizedCr).toFixed(1)} Cr
                </span>
              </div>
            </div>
          </div>

          {/* All-India State/UT Macro Performance Table */}
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  All-India State/UT Macro Allocation &amp; Absorption Matrix (36 States &amp; UTs)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Compiled directly from official MoSPI central records. Sorted by legislative allocation volume.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter state/UT..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
                  {(['ALL', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NE'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegionFilter(r)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        regionFilter === r
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3">Rank</th>
                    <th className="p-3">State / Union Territory</th>
                    <th className="p-3">MPs</th>
                    <th className="p-3">Allocated (₹ Cr)</th>
                    <th className="p-3">Expenditure (₹ Cr)</th>
                    <th className="p-3">Absorption %</th>
                    <th className="p-3">Completed Works</th>
                    <th className="p-3">Completion Rate</th>
                    <th className="p-3 text-right">Form 12-C Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredStates.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{st.state}</td>
                      <td className="p-3 font-mono">{st.totalMPs}</td>
                      <td className="p-3 font-mono font-medium">₹{(st.allocatedAmount / 10000000).toFixed(2)} Cr</td>
                      <td className="p-3 font-mono text-emerald-800 font-medium">₹{(st.totalExpenditure / 10000000).toFixed(2)} Cr</td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            st.utilizationPct > 45
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.utilizationPct > 30
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.utilizationPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 font-mono">{st.completedWorks.toLocaleString()}</td>
                      <td className="p-3 font-mono font-medium">{st.completionRatePct.toFixed(1)}%</td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            st.utilizationPct > 40
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {st.utilizationPct > 40 ? 'Eligible for 2nd Tranche' : 'Pending 80% Threshold'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW: INDIA RISK MAP                                                   */}
      {/* ========================================================================= */}
      {activeView === 'map' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    All-India Geospatial Risk &amp; Project Nodes Map
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Macro risk topography across 36 States/UTs with interactive GPS node drilldowns for live projects.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  780 Districts Monitored
                </span>
              </div>
            </div>

            {/* Regional Zone Risk Indicator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/30 space-y-1">
                <span className="text-[11px] font-bold text-rose-900 block uppercase tracking-wider">
                  Critical Risk Belt
                </span>
                <span className="text-xs text-slate-700 block">Gadchiroli, Siwan, Chittoor</span>
                <span className="text-[10px] text-rose-700 font-medium">Delay &gt; 35% · Payment acceleration detected</span>
              </div>
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/30 space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
                  High Risk Zones
                </span>
                <span className="text-xs text-slate-700 block">Pune, Patna, Gaya, Dharwad</span>
                <span className="text-[10px] text-amber-700 font-medium">Form 12-C UCs pending &gt; 90 days</span>
              </div>
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-1">
                <span className="text-[11px] font-bold text-blue-900 block uppercase tracking-wider">
                  Moderate Risk Zones
                </span>
                <span className="text-xs text-slate-700 block">Mysuru, Mandya, Bangalore Rural</span>
                <span className="text-[10px] text-blue-700 font-medium">Active execution within statutory variance</span>
              </div>
              <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30 space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 block uppercase tracking-wider">
                  Benchmark Performance
                </span>
                <span className="text-xs text-slate-700 block">Udupi, Coimbatore, Shimla</span>
                <span className="text-[10px] text-emerald-700 font-medium">Absorption &gt; 65% · 100% geotags verified</span>
              </div>
            </div>

            {/* Embedded Geospatial Leaflet Canvas */}
            <div className="pt-2">
              <LeafletProjectMap
                initialDistrictId="mysuru"
                works={works}
                onSelectWork={onSelectWork}
                title="Central Geospatial Monitoring Canvas"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW: DISTRICT RISK RANKING                                            */}
      {/* ========================================================================= */}
      {activeView === 'ranking' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  National District Risk Ranking (Top Exposure Outliers)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Benchmarked using cross-state statistical models on delay, cost deviation, and compliance gaps.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
                  {['all', 'critical', 'high', 'moderate'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setRiskFilter(b)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                        riskFilter === b
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <select
                  value={districtSortBy}
                  onChange={(e) => setDistrictSortBy(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium focus:outline-hidden"
                >
                  <option value="risk">Sort: Composite Risk Score</option>
                  <option value="delayed">Sort: Delayed Works</option>
                  <option value="utilization">Sort: Low Absorption %</option>
                  <option value="ucs">Sort: Pending UCs</option>
                  <option value="works">Sort: Total Works</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3">Rank</th>
                    <th className="p-3">District &amp; State</th>
                    <th className="p-3">Composite Risk</th>
                    <th className="p-3">Active Works</th>
                    <th className="p-3">Delayed Works</th>
                    <th className="p-3">Absorption %</th>
                    <th className="p-3">Pending UCs</th>
                    <th className="p-3 text-right">Central Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedDistricts.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{d.name}</span>
                        <span className="text-[11px] text-slate-500 block">{d.state || 'Maharashtra'}</span>
                      </td>
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
                      <td className="p-3 font-mono">{d.totalWorks}</td>
                      <td className="p-3 font-mono text-rose-700 font-medium">{d.delayedWorks}</td>
                      <td className="p-3 font-mono">{d.expenditureRate}%</td>
                      <td className="p-3 font-mono text-amber-700 font-bold">{d.pendingUCs}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            onActionComplete(`Central MoSPI inspection team dispatched for District ${d.name}. Notice served to DM.`)
                          }
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Dispatch Central Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIEW: DATA INTEGRITY & RECONCILE                                       */}
      {/* ========================================================================= */}
      {activeView === 'integrity' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Data Integrity &amp; Central Treasury Reconciliation Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated reconciliation comparing reported district aggregate expenditure with the project-level voucher ledgers.
                </p>
              </div>

              <button
                disabled={isReconciling}
                onClick={() => {
                  setIsReconciling(true);
                  setTimeout(() => {
                    setReconciledCount(745);
                    setIsReconciling(false);
                    onActionComplete('National Treasury Reconciliation Cycle completed. 745 of 780 districts verified.');
                  }, 1500);
                }}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                <span>Run Central Integrity Reconciliation</span>
              </button>
            </div>

            {/* Reconciliation KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg">
                <span className="text-[11px] text-emerald-800 font-medium block">Balanced Clean</span>
                <span className="text-base font-mono font-bold text-emerald-900 mt-0.5 block">{reconciledCount} / 780 Districts</span>
                <span className="text-[10px] text-emerald-700">95.5% certified accuracy</span>
              </div>
              <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-lg">
                <span className="text-[11px] text-rose-800 font-medium block">Reconciliation Variances</span>
                <span className="text-base font-mono font-bold text-rose-900 mt-0.5 block">{780 - reconciledCount} Districts</span>
                <span className="text-[10px] text-rose-700">Total Variance: ₹14.82 Cr</span>
              </div>
              <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg">
                <span className="text-[11px] text-amber-800 font-medium block">Uncredited Bank Interest</span>
                <span className="text-base font-mono font-bold text-amber-900 mt-0.5 block">₹6.42 Cr Pending</span>
                <span className="text-[10px] text-amber-700">Belongs to Consolidated Fund of India</span>
              </div>
            </div>

            {/* Discrepancies Ledger */}
            <div className="space-y-3 text-xs pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Priority Treasury Variances Requiring Secretarial Action
              </h4>

              {reconciliationDiscrepancies.map((d) => (
                <div
                  key={d.id}
                  className={`p-4 rounded-lg border ${
                    d.status === 'Failed Reconciliation'
                      ? 'border-rose-200 bg-rose-50/30'
                      : d.status === 'Warning'
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-emerald-200 bg-emerald-50/30'
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{d.district} District ({d.state})</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            d.status === 'Failed Reconciliation'
                              ? 'bg-rose-100 text-rose-800'
                              : d.status === 'Warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {d.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">[{d.type}]</span>
                      </div>
                      <p className="text-slate-600 mt-1">{d.details}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Variance Detected</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          d.varianceCr > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {d.varianceCr > 0 ? `+₹${d.varianceCr.toFixed(2)} Cr` : '₹0.00 (Balanced)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">District Reported:</span>
                      <span className="font-mono font-semibold text-slate-800">₹{d.reportedAggregateCr.toFixed(2)} Cr</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Project Voucher Sum:</span>
                      <span className="font-mono font-semibold text-slate-800">₹{d.projectLedgerSumCr.toFixed(2)} Cr</span>
                    </div>
                    <div className="text-right">
                      {d.varianceCr > 0 ? (
                        <button
                          onClick={() =>
                            onActionComplete(`Statutory freeze order issued to District Treasury ${d.district}. Subsequent releases blocked.`)
                          }
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
                        >
                          Freeze Next Installment
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-medium">Reconciled Clean</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW: PRE-AUDIT TRIAGE                                                 */}
      {/* ========================================================================= */}
      {activeView === 'pre-audit' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    National Pre-Audit Triage Board (CAG Scrutiny Pipeline)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evidence-backed queue of high-exposure works recommended for targeted scrutiny by Comptroller and Auditor General (CAG).
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-mono font-bold self-start sm:self-auto">
                {preAuditItems.length} High-Exposure Works Flagged
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {preAuditItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 space-y-3 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900">{item.workId}</span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.work.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-medium">
                          {item.cagRisk}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.district} · Recommended by {item.mpName} · Sanctioned: ₹{(item.work.financial?.sanctioned || 50).toFixed(2)}L
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Financial Exposure</span>
                      <span className="font-mono font-bold text-sm text-slate-900">₹{item.exposureCr.toFixed(2)} Cr</span>
                    </div>
                  </div>

                  {/* Evidence & Findings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[11px] block font-medium">Identified Fiscal Anomaly:</span>
                      <p className="text-slate-800 mt-0.5 leading-relaxed">{item.issue}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block font-medium">Recommended Audit Mandate:</span>
                      <p className="text-slate-800 mt-0.5 font-medium">{item.recommendedAudit}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-2">
                    <span className="text-slate-500">
                      Verified through automated Treasury PFMS cross-checks &amp; measurement books
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectWork(item.work)}
                        className="px-3 py-1 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        Inspect Evidence
                      </button>
                      <button
                        onClick={() => {
                          onActionComplete(`Work ${item.workId} officially referred to Principal Director of Audit (Central) for priority CAG scrutiny.`);
                        }}
                        className="px-3 py-1 font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Refer to CAG Audit Division</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VIEW: SYSTEMIC RISK ANOMALIES                                          */}
      {/* ========================================================================= */}
      {activeView === 'systemic' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Systemic Risk Anomalies &amp; Cost Outlier Intelligence Engine
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifies machine-learned cost per square-meter outliers beyond 2.5 standard deviations from category benchmarks and contractor cartelization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Category Cost Z-Score Outlier:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">+3.4σ Deviation</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Work <strong>WRK-1042</strong> (Shivajinagar Community Hall) was sanctioned at ₹65.00 Lakhs for 3,200 sq.ft, representing ₹2,031/sq.ft compared to the regional benchmark mean of ₹1,420 ± ₹180/sq.ft (Z-Score: +3.4σ).
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900 block">Recommended Action:</span>
                  Require District Authority Technical Cell to submit revised rate analysis prior to further voucher clearance.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Agency Allocation Concentration:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">54% Cartelization Index</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In Gadchiroli District, single agency <em>Zilla Parishad Works Division</em> holds 54% of all active works orders, violating guideline advice against excessive execution bottlenecking.
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900 block">Recommended Action:</span>
                  Issue central advisory to District Collector to de-concentrate tenders among CPWD, State PWD, and PRIs.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Milestone Velocity Stagnation:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">92 Days in Stage 2</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Across 24 works in Northern Bihar, foundation-to-lintel transition times average 92 days against the statutory benchmark of 30 days, indicating contractor cash-flow or site abandonment risks.
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900 block">Recommended Action:</span>
                  Dispatch State Nodal Officer to inspect site muster rolls and invoke Clause 4.5 penalty clauses.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">SC/ST Geographic Misallocation Signal:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Census Anomaly</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  3 sanctioned works categorized as SC-earmarked (15% mandate) are mapped to sub-blocks with &lt;4% Scheduled Caste population density, suggesting geographic misallocation.
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900 block">Recommended Action:</span>
                  Cross-verify with 2011 Census spatial boundaries and reallocate earmarking credit.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VIEW: NATIONAL ANNUAL REPORT                                           */}
      {/* ========================================================================= */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    National Annual Performance Report Studio (FY 2025–26)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Government of India annual statutory performance report, parliament replies, and CAG audit annexures.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onActionComplete('National Annual Report FY 2025–26 compiled and exported to PDF format.')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Official PDF Report</span>
                </button>
              </div>
            </div>

            {/* Official Report Executive Dossier Preview */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-bold font-serif text-sm">
                    GOI
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      MEMBER OF PARLIAMENT LOCAL AREA DEVELOPMENT SCHEME (MPLADS)
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Annual Implementation &amp; Physical Asset Verification Dossier · Vol. XXIV
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-500">
                  <span>Document No: MOSPI-MPLADS-AR-2026</span>
                  <span className="block text-emerald-700 font-bold">NIC Security Certified</span>
                </div>
              </div>

              {/* Certified Macro Statistics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Central Sanction</span>
                  <span className="font-mono font-bold text-slate-900 text-base">₹11,681.90 Cr</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Certified Physical Value</span>
                  <span className="font-mono font-bold text-emerald-800 text-base">₹3,984.76 Cr</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Certified Completed Assets</span>
                  <span className="font-mono font-bold text-blue-800 text-base">43,899 Assets</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Constituency Coverage</span>
                  <span className="font-mono font-bold text-slate-900 text-base">774 / 774 MPs (100%)</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-700 leading-relaxed text-xs">
                <p>
                  <strong>Executive Finding:</strong> During the financial year 2025–26, the Ministry of Statistics and Programme Implementation oversaw the creation of durable public community assets with emphasis on drinking water, rural sanitation, education, and health. The national physical execution index stood at 50.5%, with Uttar Pradesh, Maharashtra, and Bihar accounting for 30.6% of cumulative allocations.
                </p>
                <p>
                  <strong>Statutory Earmarking Compliance:</strong> Total verified disbursements to Scheduled Caste (SC) areas amounted to ₹1,752.30 Cr (15.0% of total outlay), and Scheduled Tribe (ST) areas reached ₹292.05 Cr (2.5% of total outlay), meeting the mandatory quotas prescribed in Section 2.3 of the Revised 2023 Guidelines.
                </p>
              </div>

              {/* Parliament Questions Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 uppercase text-xs">
                    Pending Parliament Questions (PQ) Responses
                  </h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    2 Questions Due This Session
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-slate-900">Lok Sabha Starred Q. No. 248</span>
                      <h4 className="font-semibold text-slate-800 text-xs mt-0.5">
                        "Unspent Balances and Delayed Works under MPLADS in Maharashtra and Bihar"
                      </h4>
                      <span className="text-[11px] text-slate-500">Ministry: MoSPI · Due Date: 11-Sept-2026</span>
                    </div>
                    <button
                      onClick={() => onActionComplete('Certified reply & Annexure table generated for Lok Sabha Starred Q. No. 248.')}
                      className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
                    >
                      Generate Official Reply
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-slate-900">Rajya Sabha Unstarred Q. No. 1120</span>
                      <h4 className="font-semibold text-slate-800 text-xs mt-0.5">
                        "Physical verification and GPS geotagging adherence in tribal districts"
                      </h4>
                      <span className="text-[11px] text-slate-500">Ministry: MoSPI · Due Date: 14-Sept-2026</span>
                    </div>
                    <button
                      onClick={() => onActionComplete('Certified statistical table on GPS geotagging generated for Rajya Sabha Q. 1120.')}
                      className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
                    >
                      Generate Official Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
