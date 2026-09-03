import React from 'react';
import {
  Search,
  History,
  FileSpreadsheet,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Role, AuthUser } from '../../types';
import { ROLE_DEFINITIONS } from '../../data/roleDefinitions';

interface HeaderProps {
  currentRole: Role;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSelectRole?: (role: Role) => void;
  onRoleChange?: (role: Role) => void;
  onOpenRoleMatrix?: () => void;
  onOpenMatrix?: () => void;
  onOpenAssistant?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenSearch: () => void;
  onOpenNotifications?: () => void;
  onOpenAuditLedger: () => void;
  onOpenReportModal?: () => void;
  onOpenReportGenerator?: () => void;
  onOpenStorySequence?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onLogout,
  onOpenSearch,
  onOpenAuditLedger,
  onOpenReportModal,
  onOpenReportGenerator,
  onOpenStorySequence,
}) => {
  const activeDef = ROLE_DEFINITIONS[currentRole] || {
    title: 'MPLADS Portal',
    shortTitle: currentRole,
    subtitle: 'Civic Infrastructure Operating Layer',
  };

  const triggerReport = () => {
    if (onOpenReportModal) onOpenReportModal();
    if (onOpenReportGenerator) onOpenReportGenerator();
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: MARGA Logo & Typography (Aligned with STATE / Landing) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Stylized Modern Emblem */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border border-blue-500/30 text-white font-extrabold text-lg flex items-center justify-center shadow-xs shadow-blue-500/20 font-sans tracking-tight shrink-0">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wide text-slate-900">
                MARGA
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                MPLADS
              </span>
              <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {activeDef.shortTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5 hidden md:block">
              Civic Infrastructure Operating Layer
            </p>
          </div>
        </div>

        {/* Quick Return to Landing Story Sequence */}
        {onOpenStorySequence && (
          <button
            onClick={onOpenStorySequence}
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition-colors cursor-pointer"
            title="Return to Scrollytelling Sequence"
          >
            ← Story Sequence
          </button>
        )}

        {/* Geography Context Badge */}
        <div className="hidden lg:flex items-center text-xs text-slate-500 border-l border-slate-200 pl-3 h-5">
          <span className="font-medium text-slate-700">
            {currentRole === 'MOSPI'
              ? 'Union of India (National HQ)'
              : currentRole === 'STATE'
              ? 'Karnataka State (ST-KA)'
              : 'Mysuru District (Karnataka)'}
          </span>
        </div>
      </div>

      {/* Right: Clean Utilities & Authenticated Officer Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 h-8 rounded-md transition-colors cursor-pointer"
          title="Search works, districts, MPs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search Work ID, MP, District...</span>
        </button>

        {/* Reports Generator Modal Trigger */}
        <button
          onClick={triggerReport}
          className="h-8 w-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          title="Generate Official Reports (MPR / Briefing)"
          aria-label="Generate Official Reports"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>

        {/* Authoritative Audit Ledger Trigger */}
        <button
          onClick={onOpenAuditLedger}
          className="h-8 w-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          title="View Authoritative Audit Ledger"
          aria-label="View Authoritative Audit Ledger"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Authenticated Officer Badge (Fixed by Authentication) */}
        {currentUser ? (
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 max-w-[130px] sm:max-w-[160px] truncate" title={currentUser.name}>
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                {currentUser.role}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">{activeDef.shortTitle}</span>
          </div>
        )}

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all cursor-pointer"
            title="Sign out from MARGA Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
