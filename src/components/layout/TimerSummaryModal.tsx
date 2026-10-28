import React from 'react';
import { CheckCircle2, Clock, DollarSign, FileText, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currency';

interface TimerSummaryModalProps {
  onOpenCreateInvoiceWithData: (data: {
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    durationHours: number;
    hourlyRate: number;
    amount: number;
  }) => void;
}

export const TimerSummaryModal: React.FC<TimerSummaryModalProps> = ({
  onOpenCreateInvoiceWithData,
}) => {
  const { completedSessionSummary, dismissCompletedSessionSummary, displayCurrency, ratesData } =
    useApp();

  if (!completedSessionSummary || !completedSessionSummary.visible) return null;

  const { durationSeconds, billableValue, projectName, clientName, projectId, clientId, hourlyRate } =
    completedSessionSummary;

  const hours = (durationSeconds / 3600).toFixed(2);
  const formattedDuration = `${Math.floor(durationSeconds / 3600)}h ${Math.floor(
    (durationSeconds % 3600) / 60
  )}m ${durationSeconds % 60}s`;

  const handleCreateInvoice = () => {
    onOpenCreateInvoiceWithData({
      clientId,
      clientName,
      projectId,
      projectName,
      durationHours: Number(hours),
      hourlyRate,
      amount: billableValue,
    });
    dismissCompletedSessionSummary();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Session Recorded Successfully</h3>
          </div>
          <button
            onClick={dismissCompletedSessionSummary}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-slate-900">{projectName}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Client: {clientName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock size={13} />
                <span>Tracked Time</span>
              </div>
              <p className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {formattedDuration}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">({hours} hrs total)</p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-1">
                <DollarSign size={13} />
                <span>Billable Value</span>
              </div>
              <p className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                {formatCurrency(billableValue, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">@ ${hourlyRate}/hr</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            This time entry has been saved to your Time Tracker and linked to the project and client records.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreateInvoice}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              <FileText size={15} />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={dismissCompletedSessionSummary}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
