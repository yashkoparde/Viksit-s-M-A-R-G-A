import React, { useState } from 'react';
import { X, Check, Ban, Shield, Layers, KeyRound, ArrowRight, ExternalLink } from 'lucide-react';
import { Role } from '../../types';
import { ROLE_DEFINITIONS } from '../../data/roleDefinitions';

interface RolePermissionMatrixModalProps {
  currentRole: Role;
  onSelectRole?: (role: Role) => void;
  onSwitchRole?: (role: Role) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RolePermissionMatrixModal: React.FC<RolePermissionMatrixModalProps> = ({
  currentRole,
  onSelectRole,
  onSwitchRole,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'matrix'>('profile');
  const [viewRole, setViewRole] = useState<Role>(currentRole);

  if (!isOpen) return null;

  const triggerRoleSelect = (role: Role) => {
    if (onSelectRole) onSelectRole(role);
    if (onSwitchRole) onSwitchRole(role);
  };

  const roleDef = ROLE_DEFINITIONS[viewRole];
  const allRoles: Role[] = ['MP', 'DA', 'IA', 'STATE', 'MOSPI'];

  const matrixRows = [
    {
      operation: 'Recommend Works',
      description: 'Submit formal MPLADS work recommendations',
      permissions: { MP: 'Full Authority', DA: 'Receives & Evaluates', IA: 'No Access', STATE: 'State Tracking', MOSPI: 'National Monitoring' },
      status: { MP: true, DA: 'review', IA: false, STATE: false, MOSPI: false },
    },
    {
      operation: 'Sanction Works',
      description: 'Issue legal Administrative Sanctions and cost clearance',
      permissions: { MP: 'Prohibited', DA: 'Statutory Authority', IA: 'No Access', STATE: 'Policy Oversight', MOSPI: 'Guideline Oversight' },
      status: { MP: false, DA: true, IA: false, STATE: false, MOSPI: false },
    },
    {
      operation: 'Hold & Disburse Funds',
      description: 'Manage MPLADS district bank account & releases',
      permissions: { MP: 'Prohibited (No Account)', DA: 'Sole Disbursing Officer', IA: 'Draws Staged Funds', STATE: 'Nodal Account Monitor', MOSPI: 'Union Fund Release' },
      status: { MP: false, DA: true, IA: 'conditional', STATE: false, MOSPI: 'union' },
    },
    {
      operation: 'Physical Execution & MB',
      description: 'Execute works, certify measurement books (MB)',
      permissions: { MP: 'No Execution Role', DA: 'Supervisory Review', IA: 'Direct Execution', STATE: 'No Direct Role', MOSPI: 'Macro Verification' },
      status: { MP: false, DA: false, IA: true, STATE: false, MOSPI: false },
    },
    {
      operation: 'Geotagged Site Evidence',
      description: 'Capture photo evidence & digital location',
      permissions: { MP: 'Viewer / Inquirer', DA: 'Verification Inspections', IA: 'Mandatory Site Visits', STATE: 'Audit Inspection', MOSPI: 'Ledger Audit' },
      status: { MP: 'view', DA: true, IA: true, STATE: true, MOSPI: 'view' },
    },
    {
      operation: 'Final UC & Project Closure',
      description: 'Verify UC, recover unspent funds, close work',
      permissions: { MP: 'Prohibited', DA: 'Final Closure Authority', IA: 'Submits Final UC & Refund', STATE: 'UC Clearance Audit', MOSPI: 'National Accounting' },
      status: { MP: false, DA: true, IA: 'submit', STATE: false, MOSPI: false },
    },
    {
      operation: '10% Mandatory Inspection',
      description: 'Statutory annual physical inspection quota',
      permissions: { MP: 'Non-Statutory Visits', DA: 'Mandatory 10% Target', IA: '100% Internal Check', STATE: '1% State Target', MOSPI: 'National Sample' },
      status: { MP: false, DA: true, IA: false, STATE: false, MOSPI: false },
    },
    {
      operation: '1% State Oversight Inspection',
      description: 'Inter-district technical quality audit',
      permissions: { MP: 'No Mandate', DA: 'Facilitates State Team', IA: 'Facilitates State Team', STATE: 'Mandatory 1% Target', MOSPI: 'CAG Audit Interface' },
      status: { MP: false, DA: false, IA: false, STATE: true, MOSPI: false },
    },
    {
      operation: 'Formal Escalation / Inquiries',
      description: 'Issue official bottleneck inquiry notices',
      permissions: { MP: 'Can Escalate to DA', DA: 'Queries Agencies / MP', IA: 'Reports Field Blockers', STATE: 'State Directive to DA', MOSPI: 'Pre-Audit Escalation' },
      status: { MP: true, DA: true, IA: true, STATE: true, MOSPI: true },
    },
    {
      operation: 'Autonomous AI Punishment',
      description: 'Penalize or reject works solely by AI model',
      permissions: { MP: 'Strictly Prohibited', DA: 'Strictly Prohibited', IA: 'Strictly Prohibited', STATE: 'Strictly Prohibited', MOSPI: 'Strictly Prohibited' },
      status: { MP: 'forbidden', DA: 'forbidden', IA: 'forbidden', STATE: 'forbidden', MOSPI: 'forbidden' },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">MARGA Operational Guardrails & Role Matrix</h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 font-mono text-slate-700">
                  Active: {currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Statutory authority boundaries, role-exclusive features, and operational guardrails across all 5 user tiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Role Authority Deep-Dive
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Comparative Permissions Matrix (All 5 Roles)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Role Switcher Pills inside Deep-Dive */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-md">
                <span className="text-xs font-medium text-slate-500 px-2">Select Tier to Inspect:</span>
                {allRoles.map((role) => {
                  const def = ROLE_DEFINITIONS[role];
                  const isSelected = viewRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setViewRole(role)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {def.shortTitle}
                    </button>
                  );
                })}
              </div>

              {/* Authority Summary Banner */}
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                      Tier {viewRole} · {roleDef.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{roleDef.name}</h3>
                  </div>
                  {viewRole !== currentRole ? (
                    <button
                      onClick={() => {
                        triggerRoleSelect(viewRole);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Switch to this Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-medium">
                      Currently Operating
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">Statutory Authority: </span>
                    <span className="font-medium text-slate-800">{roleDef.authorityLevel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Operational Jurisdiction: </span>
                    <span className="font-medium text-slate-800">{roleDef.geographyScope}</span>
                  </div>
                </div>
              </div>

              {/* CAN vs CANNOT Dual Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CAN */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-md p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                    <Check className="w-4 h-4" />
                    <span>Statutory Powers & Actions (What {roleDef.shortTitle} CAN do)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {roleDef.can.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CANNOT */}
                <div className="border border-rose-200 bg-rose-50/40 rounded-md p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                    <Ban className="w-4 h-4" />
                    <span>Operational Limitations (What {roleDef.shortTitle} CANNOT do)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {roleDef.cannot.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Guardrails */}
              <div className="border border-amber-200 bg-amber-50/40 rounded-md p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>Administrative & Legal Guardrails</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {roleDef.guardrails.map((g, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Features Built for this Role */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role-Specific Workflows in this Portal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleDef.keyFeatures.map((feat) => (
                    <div key={feat.id} className="border border-slate-200 rounded p-3 bg-white">
                      <h5 className="text-xs font-semibold text-slate-900 mb-1">{feat.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3 w-1/4">Operational Capability</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">MP</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">DA</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">IA</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">State</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">MoSPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matrixRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{row.operation}</div>
                          <div className="text-[11px] text-slate-500">{row.description}</div>
                        </td>

                        {allRoles.map((role) => {
                          const val = row.permissions[role];
                          return (
                            <td key={role} className="py-2.5 px-2 text-center align-middle">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight ${
                                  val.includes('Authority') || val.includes('Full') || val.includes('Direct')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : val.includes('Prohibited')
                                    ? 'bg-rose-100 text-rose-800'
                                    : val.includes('No Access') || val.includes('No Execution') || val.includes('No Mandate')
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  <strong>Zero-Trust Guardrail:</strong> AI risk models provide statistical decision-support. No disciplinary or financial action can be initiated without human officer verification.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Governing standard: MPLADS Operational Manual & General Financial Rules (GFR 2017)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
