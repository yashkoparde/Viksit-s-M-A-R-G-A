import React, { useState, useMemo } from 'react';
import { Search, X, FolderKanban, MapPin, User, Building, ArrowRight } from 'lucide-react';
import { Work, DistrictStats } from '../../types';

interface GlobalSearchModalProps {
  works: Work[];
  districts: DistrictStats[];
  isOpen: boolean;
  onClose: () => void;
  onSelectWork: (work: Work) => void;
  onSelectDistrict?: (districtId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  works,
  districts,
  isOpen,
  onClose,
  onSelectWork,
  onSelectDistrict,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorks = useMemo(() => {
    if (!searchTerm.trim()) return works.slice(0, 5);
    const s = searchTerm.toLowerCase();
    return works.filter(
      (w) =>
        w.id.toLowerCase().includes(s) ||
        w.name.toLowerCase().includes(s) ||
        w.mpName.toLowerCase().includes(s) ||
        w.district.toLowerCase().includes(s) ||
        w.implementingAgency.toLowerCase().includes(s) ||
        w.category.toLowerCase().includes(s)
    );
  }, [works, searchTerm]);

  const filteredDistricts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const s = searchTerm.toLowerCase();
    return districts.filter((d) => d.name.toLowerCase().includes(s));
  }, [districts, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs pt-16 p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Input Bar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Work ID (WRK-1042), keyword, MP, District..."
            autoFocus
            className="flex-1 text-sm outline-hidden text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 text-xs"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
          {filteredWorks.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Works & Assets ({filteredWorks.length})
              </div>
              {filteredWorks.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    onSelectWork(w);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded hover:bg-slate-50 flex items-start justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-900">{w.id}</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {w.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{w.district}</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs mt-0.5 truncate max-w-md">
                      {w.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Recommended by {w.mpName} · Physical {w.progress.physical}% · Financial {w.progress.financial.toFixed(1)}%
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-2" />
                </button>
              ))}
            </div>
          )}

          {filteredDistricts.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Districts ({filteredDistricts.length})
              </div>
              {filteredDistricts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    if (onSelectDistrict) onSelectDistrict(d.id);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{d.name} District</span>
                    <span className="text-slate-500">({d.totalWorks} Works · {d.completedPct}% Completed)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      d.riskBand === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : d.riskBand === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {d.riskBand} Risk
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredWorks.length === 0 && filteredDistricts.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No matching works or districts found for "{searchTerm}".
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Search across all authoritative records</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
