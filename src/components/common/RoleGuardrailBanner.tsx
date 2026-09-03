import React, { useState } from 'react';
import { Shield, CheckCircle, Ban, AlertCircle, ChevronDown, ChevronUp, KeyRound, ExternalLink } from 'lucide-react';
import { Role } from '../../types';
import { ROLE_DEFINITIONS } from '../../data/roleDefinitions';

interface RoleGuardrailBannerProps {
  currentRole: Role;
  onOpenMatrix?: () => void;
}

export const RoleGuardrailBanner: React.FC<RoleGuardrailBannerProps> = ({
  currentRole,
  onOpenMatrix,
}) => {
  const [expanded, setExpanded] = useState(false);
  const def = ROLE_DEFINITIONS[currentRole];

  if (!def) return null;

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden text-xs">
      {/* Compact Header Strip */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-200 text-slate-800">
            <Shield className="w-3.5 h-3.5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight">{def.shortTitle}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                Tier: {currentRole}
              </span>
              <span className="text-slate-400 hidden sm:inline">·</span>
              <span className="text-slate-600 hidden sm:inline text-[11px]">{def.authorityLevel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <span>{expanded ? 'Hide Guardrails' : 'View Role Guardrails & Limits'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onOpenMatrix && (
            <button
              onClick={onOpenMatrix}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Open full statutory 5-tier matrix"
            >
              <KeyRound className="w-3 h-3 text-slate-700" />
              <span className="hidden md:inline">Full Matrix</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Fresh Role Boundaries Card */}
      {expanded ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white animate-in fade-in duration-150">
          {/* Authorized Actions */}
          <div className="space-y-1.5 p-2.5 rounded bg-emerald-50/50 border border-emerald-150">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase tracking-wider text-[10px]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Statutory Powers (Can Do)</span>
            </div>
            <ul className="space-y-1 text-[11px] text-emerald-950">
              {def.can.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1 leading-snug">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explicit Prohibitions */}
          <div className="space-y-1.5 p-2.5 rounded bg-rose-50/50 border border-rose-150">
            <div className="flex items-center gap-1.5 text-rose-900 font-bold uppercase tracking-wider text-[10px]">
              <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Strict Restrictions (Cannot Do)</span>
            </div>
            <ul className="space-y-1 text-[11px] text-rose-950">
              {def.cannot.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1 leading-snug">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Statutory Governance & Guardrails */}
          <div className="space-y-1.5 p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Governing Statutory Guardrail</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              {def.guardrails[0]}
            </p>
            <div className="pt-1 text-[10px] text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-slate-700">Jurisdiction:</span>
              <span>{def.geographyScope}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Minimalist summary pill line */
        <div className="px-3.5 py-1.5 bg-white flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-900">Key Power:</span>
            <span className="truncate max-w-xs sm:max-w-md">{def.can[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="font-medium text-slate-900">Restriction:</span>
            <span className="truncate max-w-xs sm:max-w-md">{def.cannot[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
};
