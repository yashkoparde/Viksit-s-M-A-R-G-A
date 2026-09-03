import React from 'react';
import { X, Bell, AlertTriangle, Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectWork?: (workId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectWork,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'action':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'due':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'update':
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900">Notifications & Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-md border text-xs space-y-1 transition-colors ${
                n.unread ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{n.subtitle}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{n.timestamp}</span>
                    {n.workId && (
                      <button
                        onClick={() => {
                          if (onSelectWork) onSelectWork(n.workId!);
                          onClose();
                        }}
                        className="font-medium text-slate-900 hover:underline flex items-center gap-1"
                      >
                        <span>Inspect {n.workId}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Operational alerts strictly routed by user role and geography.
        </div>
      </div>
    </div>
  );
};
