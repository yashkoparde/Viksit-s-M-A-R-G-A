import React from 'react';
import { Sparkles } from 'lucide-react';

interface AskMargaAvatarProps {
  onClick: () => void;
  className?: string;
}

export const AskMargaAvatar: React.FC<AskMargaAvatarProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      id="btn-ask-marga-avatar"
      type="button"
      className={`h-8 flex items-center gap-2 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition-colors cursor-pointer ${className}`}
      title="Ask MARGA — Statutory & Guideline Assistant"
      aria-label="Open Ask MARGA Assistant"
    >
      <Sparkles className="w-3.5 h-3.5 text-slate-300" />
      <span>Ask MARGA</span>
    </button>
  );
};
