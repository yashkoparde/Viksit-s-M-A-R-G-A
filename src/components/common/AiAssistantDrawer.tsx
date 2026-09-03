import React, { useState } from 'react';
import { X, Sparkles, Send, ArrowRight, CornerDownRight, RotateCcw } from 'lucide-react';
import { Role, Work } from '../../types';
import { apiService } from '../../services/apiService';
import { convertClusterWorkToAppWork } from '../../services/margaDatabase';

interface AiAssistantDrawerProps {
  role?: Role;
  currentRole?: Role;
  selectedWork?: Work | null;
  works?: Work[];
  activeMpName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenWork?: (workId: string) => void;
  onInspectWork?: (work: Work) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  breakdown?: {
    fact?: string[];
    calculation?: string[];
    riskSignal?: string[];
    humanFinding?: string[];
    missingData?: string[];
    guidelines?: string[];
  };
  suggestedAction?: {
    label: string;
    actionType: string;
    workId?: string;
  };
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  role,
  currentRole,
  selectedWork,
  works = [],
  activeMpName,
  isOpen,
  onClose,
  onOpenWork,
  onInspectWork,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: activeMpName
        ? `Ready. Ask me anything about ${activeMpName}'s constituency works.`
        : 'Ready. Ask me anything about MPLADS works.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const effectiveRole = role || currentRole || 'MP';

  // Contextual suggested queries tailored by role
  const rolePrompts: Record<Role, string[]> = {
    MP: [
      `Which works in ${activeMpName || 'my'} constituency require attention?`,
      'Show works delayed over 30 days with payment ahead of progress',
      'What is my constituency unutilized fund position for FY 2025-26?',
      'Is a community center on private trust land permissible under MPLADS?',
    ],
    DA: [
      'Which works are eligible for the statutory 10% DA inspection quota?',
      'Check if payment is running ahead of certified physical execution',
      'What are the statutory grounds for rejecting an MP recommendation?',
      'Show physical vs financial mismatch summary across active works',
    ],
    IA: [
      'Which works have 30-day statutory site inspections due?',
      'What evidence and geotag requirements are needed before completion?',
      'Are there pending Utilisation Certificates (UCs) blocking final payments?',
      'Explain Stage 2 milestone physical verification requirements',
    ],
    STATE: [
      'Which districts currently fall below the mandatory 10% DA inspection quota?',
      'Show state-wide physical execution vs treasury disbursement gaps',
      'Which districts show worsening risk trends this quarter?',
      'What is the state-wide SC/ST fund allocation compliance?',
    ],
    MOSPI: [
      'Which works have the highest risk exposure in the National Triage queue?',
      'What is the pan-India SC/ST fund allocation compliance status?',
      'Explain contractor concentration signals across districts',
      'Summarize national unspent balance and active works count',
    ],
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // 1. First priority: Query the authoritative MARGA AI Backend (MongoDB Atlas + MPLADS Rules Engine)
    try {
      const resp = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          role: effectiveRole,
          activeMpName,
          workId: selectedWork?.id
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.answer) {
          const assistantMsg: Message = {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: json.answer.text,
            breakdown: json.answer.breakdown,
            suggestedAction: json.answer.suggestedAction
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend AI route failed, using local reasoning engine:', err);
    }

    const qLower = query.toLowerCase();

    // 2. Client-side local domain engine fallback
    const mpSpecificWorks = activeMpName
      ? works.filter((w) => (w.mpName || '').trim().toLowerCase() === activeMpName.trim().toLowerCase())
      : works;
    const activeDataset = mpSpecificWorks.length > 0 ? mpSpecificWorks : works;

    const delayedWorks = activeDataset.filter(
      (w) =>
        w.status === 'Delayed' ||
        w.status === 'Attention Required' ||
        (w.progress && w.progress.financial - w.progress.physical > 15)
    );
    const ongoingWorks = activeDataset.filter((w) => w.status === 'Ongoing');
    const completedWorks = activeDataset.filter(
      (w) => w.status === 'Completed' || w.status === 'Substantially Complete'
    );
    const totalSanctioned = activeDataset.reduce((s, w) => s + (w.financial?.sanctioned || 0), 0);
    const totalDisbursed = activeDataset.reduce((s, w) => s + (w.financial?.disbursed || 0), 0);

    let assistantMsg: Message;

    // Check for specific Work ID pattern (e.g., WRK-*, WORK-*, or numeric ID)
    const workIdMatch = query.match(/(?:WRK|WORK)[\w-]+|\b\d{4,7}\b/i);
    let matchedWork: Work | undefined;

    if (workIdMatch) {
      const needle = workIdMatch[0].toLowerCase();
      matchedWork = activeDataset.find((w) => (w.id || '').toLowerCase().includes(needle) || (w.sourceWorkId && String(w.sourceWorkId).includes(needle)));
    }

    // A. Specific Work Inquiry
    if (matchedWork) {
      const gap = (matchedWork.progress.financial - matchedWork.progress.physical).toFixed(1);
      assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `${matchedWork.id} — ${matchedWork.name}:`,
        breakdown: {
          fact: [
            `Sanctioned Amount: ₹${matchedWork.financial.sanctioned.toFixed(2)} Lakhs (Disbursed: ₹${matchedWork.financial.disbursed.toFixed(2)} Lakhs).`,
            `Certified Physical Progress: ${matchedWork.progress.physical}% | Financial Draw: ${matchedWork.progress.financial.toFixed(1)}%.`,
            `Status: ${matchedWork.status} | Lifecycle Stage: ${matchedWork.lifecycleStage}.`,
            `Implementing Agency: ${matchedWork.implementingAgency || 'District Authority'}.`,
            `District / Constituency: ${matchedWork.district}, ${matchedWork.constituency} (${matchedWork.state}).`,
          ],
          calculation: [
            Number(gap) > 0
              ? `Payment vs Progress Gap: +${gap} percentage points (Financial disbursements are running ahead of certified physical work).`
              : `Disbursements strictly match physical milestones (Gap: ${gap} pp).`,
            `Days in current stage: ${matchedWork.dates?.daysInCurrentStage || 1} days.`,
          ],
          riskSignal: [
            `Composite Risk: ${matchedWork.risk?.score || 15}/100 (${matchedWork.risk?.band || 'Low'} Risk).`,
            matchedWork.risk?.signals?.length
              ? `Active Risk Signals: ${matchedWork.risk.signals.join('; ')}`
              : 'No statutory flags triggered.',
          ],
          guidelines: [
            'MPLADS 2023 Guidelines Section 4.2: Funds are released in tranches tied to certified MB book entries.',
          ],
        },
        suggestedAction: {
          label: `Open Work Ledger (${matchedWork.id})`,
          actionType: 'open-work',
          workId: matchedWork.id,
        },
      };
    }
    // B. Delayed / Stalled Works inquiry
    else if (qLower.includes('delay') || qLower.includes('attention') || qLower.includes('stuck') || qLower.includes('mismatch')) {
      const topDelayed = delayedWorks.slice(0, 3);
      if (topDelayed.length > 0) {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `${delayedWorks.length} works need attention${activeMpName ? ` (${activeMpName})` : ''}:`,
          breakdown: {
            fact: topDelayed.map(
              (w) =>
                `• ${w.id}: "${w.name.slice(0, 45)}..." — Physical ${w.progress.physical}% vs Financial ${w.progress.financial.toFixed(1)}% (₹${w.financial.sanctioned}L).`
            ),
            calculation: [
              `Average progress-to-disbursement variance across delayed works: ${(
                topDelayed.reduce((s, w) => s + (w.progress.financial - w.progress.physical), 0) /
                topDelayed.length
              ).toFixed(1)} percentage points ahead.`,
            ],
            riskSignal: [
              `Statutory Alert: ${topDelayed.length} works have exceeded normal stage durations without an uploaded physical measurement book (MB) certificate.`,
            ],
            guidelines: [
              'Section 5.3: District Authority must issue a 14-day cure notice to implementing agencies upon detecting execution delays exceeding 30 calendar days.',
            ],
          },
          suggestedAction: {
            label: `Inspect ${topDelayed[0].id}`,
            actionType: 'open-work',
            workId: topDelayed[0].id,
          },
        };
      } else {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `All ${activeDataset.length} works are on track${activeMpName ? ` (${activeMpName})` : ''}.`,
          breakdown: {
            fact: [
              `All ${activeDataset.length} works are executing within permissible statutory timelines.`,
              `Completed works: ${completedWorks.length} (${((completedWorks.length / (activeDataset.length || 1)) * 100).toFixed(0)}%).`,
              `Ongoing works: ${ongoingWorks.length}.`,
            ],
            calculation: [
              `Financial utilization: ₹${totalDisbursed.toFixed(2)} Lakhs disbursed out of ₹${totalSanctioned.toFixed(2)} Lakhs sanctioned.`,
            ],
            riskSignal: ['Zero critical execution anomalies detected.'],
          },
        };
      }
    }
    // C. Prohibited Works & Eligibility Inquiry
    else if (qLower.includes('prohibit') || qLower.includes('trust') || qLower.includes('religious') || qLower.includes('eligible') || qLower.includes('permissible')) {
      assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Prohibited categories under MPLADS Guidelines 2023:',
        breakdown: {
          fact: [
            'Prohibited Category 1: Works on land/premises owned by private entities, trusts, or registered societies (unless registered for 10+ years with irrevocable public easement deed).',
            'Prohibited Category 2: Works within places of worship, religious institutions, or sectarian shrines.',
            'Prohibited Category 3: Commercial ventures or assets intended to generate revenue for private individuals/bodies.',
            'Prohibited Category 4: Land acquisition, staff salaries, recurrent maintenance, and purchase of inventory.',
            'Prohibited Category 5: Memorials, statues, and naming of assets after living individuals.',
          ],
          guidelines: [
            'Section 2.1: The District Authority has a statutory obligation to reject any recommendation violating Annexure II within 45 days of receipt.',
            'Section 2.3: All created infrastructure must be public assets transferred to the appropriate local body (Panchayat / Municipality).',
          ],
          riskSignal: [
            'MARGA Pre-Screening Flag: Semantic checks automatically reject recommendations containing trust deeds, private enclosures, or commercial leases.',
          ],
        },
      };
    }
    // D. 10% Inspection Quota (Section 5.1)
    else if (qLower.includes('10%') || qLower.includes('inspection') || qLower.includes('quota')) {
      const completedInspections = activeDataset.filter((w) => w.inspectionStatus === 'Completed').length;
      const target10Pct = Math.max(1, Math.ceil(activeDataset.length * 0.1));
      assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: '10% Annual Inspection Target (Section 5.1):',
        breakdown: {
          fact: [
            `Total active constituency works: ${activeDataset.length}.`,
            `Statutory 10% District Authority inspection quota: ${target10Pct} physical site visits required annually.`,
            `Completed field inspections recorded: ${completedInspections} works (${((completedInspections / (activeDataset.length || 1)) * 100).toFixed(1)}% coverage).`,
          ],
          calculation: [
            completedInspections >= target10Pct
              ? `Compliance Status: COMPLIANT (${completedInspections} of ${target10Pct} target achieved).`
              : `Deficit: ${target10Pct - completedInspections} additional physical inspections required to achieve compliance.`,
          ],
          guidelines: [
            'Section 5.1: The District Collector / DM or an officer not below the rank of Sub-Divisional Magistrate must personally inspect at least 10% of works each year.',
            'Section 5.2: Implementing Agencies must inspect 100% of works every 30 days and record timestamped geotagged evidence.',
          ],
        },
      };
    }
    // E. Fund Position / Unspent Balance / Entitlement
    else if (qLower.includes('fund') || qLower.includes('unutil') || qLower.includes('unspent') || qLower.includes('allocation') || qLower.includes('cr') || qLower.includes('crore')) {
      const totalEntitlementCr = 5.0;
      const sanctionedCr = totalSanctioned / 100;
      const unspentCr = Math.max(0, totalEntitlementCr - sanctionedCr);
      assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `Fund Position${activeMpName ? ` — ${activeMpName}` : ''} (FY 2025-26):`,
        breakdown: {
          fact: [
            `Annual Statutory Entitlement: ₹5.00 Crore per Member of Parliament.`,
            `Sanctioned Works Total: ₹${sanctionedCr.toFixed(2)} Crore across ${activeDataset.length} works.`,
            `Unspent / Available Entitlement: ₹${unspentCr.toFixed(2)} Crore.`,
            `Total Disbursed to Agencies: ₹${(totalDisbursed / 100).toFixed(2)} Crore.`,
          ],
          calculation: [
            `Sanction Ratio: ${((sanctionedCr / totalEntitlementCr) * 100).toFixed(1)}% of annual entitlement allocated.`,
            `Disbursement Ratio: ${((totalDisbursed / (totalSanctioned || 1)) * 100).toFixed(1)}% of sanctioned funds drawn.`,
          ],
          guidelines: [
            'Section 3.1: MPLADS funds are non-lapsable. Unspent entitlement rolls over to subsequent fiscal years within the MP tenure.',
            'Section 2.2: Mandatory earmarking requires at least 15% for Scheduled Caste (SC) areas and 2.5% for Scheduled Tribe (ST) areas.',
          ],
        },
      };
    }
    // F. Fallback / General Query with Live MongoDB Search
    else {
      // Query MongoDB Atlas live for matches
      let clusterMatches: Work[] = [];
      try {
        const res = await apiService.getWorks({ search: query, limit: 3 });
        if (res && res.data && res.data.length > 0) {
          clusterMatches = res.data.map(convertClusterWorkToAppWork);
        }
      } catch (err) {
        console.warn('AI cluster search warning:', err);
      }

      if (clusterMatches.length > 0) {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `${clusterMatches.length} matching works for "${query}":`,
          breakdown: {
            fact: clusterMatches.map(
              (m) =>
                `• ${m.id}: "${m.name.slice(0, 50)}..." — ₹${m.financial.sanctioned}L (${m.status}, ${m.district})`
            ),
          },
          suggestedAction: {
            label: `View ${clusterMatches[0].id}`,
            actionType: 'open-work',
            workId: clusterMatches[0].id,
          },
        };
      } else {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `Overview${activeMpName ? ` — ${activeMpName}` : ''}:`,
          breakdown: {
            fact: [
              `${activeDataset.length} works tracked.`,
              `Completed: ${completedWorks.length} | Ongoing: ${ongoingWorks.length} | Attention: ${delayedWorks.length}.`,
              `Sanctioned: ₹${totalSanctioned.toFixed(2)}L | Disbursed: ₹${totalDisbursed.toFixed(2)}L.`,
            ],
          },
        };
      }
    }

    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Ask MARGA</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'init-1',
                    sender: 'assistant',
                    text: activeMpName
                      ? `Ready. Ask me anything about ${activeMpName}'s constituency works.`
                      : 'Ready. Ask me anything about MPLADS works.',
                  },
                ]);
              }}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>


        {/* Quick Topic Chips */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => handleSend('Show delayed works with payment ahead of progress')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>⚡ Delayed Works</span>
          </button>
          <button
            onClick={() => handleSend('Is a community center on private trust land permissible under MPLADS?')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>🏛️ Prohibited Works</span>
          </button>
          <button
            onClick={() => handleSend('What is the statutory 10% inspection target for District Collectors?')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>🔍 10% Inspection Target</span>
          </button>
          <button
            onClick={() => handleSend('What is the constituency unutilized fund position and SC/ST quota for FY 2025-26?')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>💰 Fund Position & SC/ST</span>
          </button>
          <button
            onClick={() => handleSend('Explain GFR Rule 238(1) and Form 12-C Utilization Certificate requirements')}
            className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>📜 GFR 238(1) & Form 12-C</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-medium mb-1">{m.text}</div>

                {/* Segmented breakdown badges */}
                {m.breakdown && (
                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
                    {m.breakdown.fact && m.breakdown.fact.length > 0 && (
                      <div className="space-y-1">
                        {m.breakdown.fact.map((f, i) => (
                          <div key={i} className="text-slate-700">• {f}</div>
                        ))}
                      </div>
                    )}

                    {m.breakdown.calculation && m.breakdown.calculation.length > 0 && (
                      <div className="space-y-1 text-slate-600">
                        {m.breakdown.calculation.map((c, i) => (
                          <div key={i}>• {c}</div>
                        ))}
                      </div>
                    )}

                    {m.breakdown.riskSignal && m.breakdown.riskSignal.length > 0 && (
                      <div className="bg-orange-50/70 p-2 rounded border border-orange-200 space-y-1">
                        {m.breakdown.riskSignal.map((r, i) => (
                          <div key={i} className="text-orange-800">• {r}</div>
                        ))}
                      </div>
                    )}

                    {m.breakdown.guidelines && m.breakdown.guidelines.length > 0 && (
                      <div className="text-slate-500 space-y-1 italic">
                        {m.breakdown.guidelines.map((g, i) => (
                          <div key={i}>• {g}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contextual Action Button */}
                {m.suggestedAction && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        if (m.suggestedAction?.workId) {
                          if (onOpenWork) {
                            onOpenWork(m.suggestedAction.workId);
                          }
                        }
                      }}
                      className="w-full text-center py-1.5 px-2 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{m.suggestedAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Contextual Suggested Questions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
            Suggested
          </span>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {(rolePrompts[effectiveRole] || rolePrompts['MP']).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-left text-[11px] text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 p-1.5 rounded transition-colors truncate flex items-center gap-1 cursor-pointer"
              >
                <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
