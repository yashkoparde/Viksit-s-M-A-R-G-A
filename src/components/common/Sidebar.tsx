import React from 'react';
import {
  LayoutDashboard,
  AlertCircle,
  FolderKanban,
  FileCheck2,
  Coins,
  ClockAlert,
  Send,
  ClipboardCheck,
  Building2,
  Map,
  Scale,
  ShieldCheck,
  FileText,
  Camera,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Role } from '../../types';

interface SidebarProps {
  currentRole: Role;
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenStorySequence?: () => void;
  attentionCount?: number;
  recsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeView,
  onSelectView,
  onOpenStorySequence,
  attentionCount = 3,
  recsCount = 4,
}) => {
  // Define nav items for each role
  const roleNavItems: Record<
    Role,
    {
      primary: { id: string; label: string; icon: React.ElementType; badge?: number }[];
      secondary: { id: string; label: string; icon: React.ElementType }[];
    }
  > = {
    MP: {
      primary: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'geo-map', label: 'Live GIS Project Map', icon: Map },
        { id: 'attention', label: 'Attention Required', icon: AlertCircle, badge: attentionCount },
        { id: 'works', label: 'My Works', icon: FolderKanban },
        { id: 'funds', label: 'Fund Position', icon: Coins },
        { id: 'delayed', label: 'Delayed / Stuck', icon: ClockAlert },
      ],
      secondary: [
        { id: 'escalations', label: 'Escalations to DA', icon: Send },
        { id: 'recommendations', label: 'New Recommendation', icon: FileCheck2 },
      ],
    },
    DA: {
      primary: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'map', label: 'District Geo-Nodes Map', icon: Map },
        { id: 'action-now', label: 'Requires Action Now', icon: AlertCircle, badge: attentionCount },
        { id: 'recommendations', label: 'Recommendation Inbox', icon: FileCheck2, badge: recsCount },
        { id: 'works', label: 'All District Works', icon: FolderKanban },
        { id: 'inspections', label: '10% Inspection Tracker', icon: ClipboardCheck },
      ],
      secondary: [
        { id: 'compliance', label: 'Compliance & UC', icon: Scale },
        { id: 'agencies', label: 'Implementing Agencies', icon: Building2 },
      ],
    },
    IA: {
      primary: [
        { id: 'overview', label: 'Execution Overview', icon: LayoutDashboard },
        { id: 'action-now', label: 'Action Checklist', icon: AlertCircle, badge: 2 },
        { id: 'works', label: 'My Assigned Works', icon: FolderKanban },
        { id: 'site-visits', label: 'Field Site Visits', icon: Camera },
        { id: 'completion', label: 'Completion & UC', icon: ClipboardCheck },
      ],
      secondary: [
        { id: 'mpr', label: 'Monthly Reports (MPR)', icon: FileText },
        { id: 'register', label: 'Measurement Book (MB)', icon: Activity },
      ],
    },
    STATE: {
      primary: [
        { id: 'overview', label: 'State Overview', icon: LayoutDashboard },
        { id: 'map', label: 'District Risk Map', icon: Map },
        { id: 'districts', label: 'District Comparison', icon: Scale },
        { id: 'inspections', label: '1% State Inspections', icon: ClipboardCheck },
        { id: 'briefing', label: 'Review Briefing Dossier', icon: FileText },
      ],
      secondary: [
        { id: 'compliance', label: 'State UC & Audit', icon: ShieldCheck },
        { id: 'scst', label: 'SC/ST Earmarking', icon: UserCheck },
      ],
    },
    MOSPI: {
      primary: [
        { id: 'overview', label: 'National Overview', icon: LayoutDashboard },
        { id: 'map', label: 'India Risk Map', icon: Map },
        { id: 'ranking', label: 'District Risk Ranking', icon: Scale },
        { id: 'integrity', label: 'Data Integrity & Reconcile', icon: ShieldCheck },
        { id: 'pre-audit', label: 'Pre-Audit Triage', icon: AlertCircle, badge: 4 },
      ],
      secondary: [
        { id: 'systemic', label: 'Systemic Risk Anomalies', icon: Activity },
        { id: 'reports', label: 'National Annual Report', icon: FileText },
      ],
    },
  };

  const nav = roleNavItems[currentRole];

  return (
    <aside className="w-56 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)]">
      {/* Primary Nav */}
      <div className="p-3 space-y-1">
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          Operational Workspace
        </div>
        {nav.primary.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-slate-900' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Nav */}
      <div className="p-3 pt-2 border-t border-slate-100 space-y-1">
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          Governance & Records
        </div>
        {nav.secondary.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Authority Badge Footer */}
      <div className="mt-auto p-3 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-700">MARGA Operating Node</div>
        <div className="truncate text-slate-500">Tier: {currentRole} Authority</div>
      </div>
    </aside>
  );
};
