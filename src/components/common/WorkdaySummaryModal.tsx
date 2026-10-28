import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Coffee,
  Calendar,
  Sparkles,
  BarChart3,
  Copy,
  Check,
} from 'lucide-react';
import { WorkdaySummary } from '../../types';

interface WorkdaySummaryModalProps {
  summary: WorkdaySummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes?: (id: string, notes: string) => void;
}

export const WorkdaySummaryModal: React.FC<WorkdaySummaryModalProps> = ({
  summary,
  isOpen,
  onClose,
  onSaveNotes,
}) => {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(summary?.notes || '');

  if (!isOpen || !summary) return null;

  const formatHoursMinutes = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const plannedSec = summary.plannedWorkMinutes * 60;
  const achievementPct = plannedSec > 0 ? Math.round((summary.activeWorkSeconds / plannedSec) * 100) : 100;

  const handleCopy = () => {
    const text = `📋 PlayBook Daily Workday Summary (${summary.date})
• Working Time: ${formatHoursMinutes(summary.activeWorkSeconds)} / ${formatHoursMinutes(plannedSec)} (${achievementPct}%)
• Total Elapsed: ${formatHoursMinutes(summary.totalElapsedSeconds)} (${summary.startTime} - ${summary.endTime})
• Break Time: ${formatHoursMinutes(summary.totalBreakSeconds)} (${summary.breaksCount} breaks)
• Focus Sessions: ${summary.sessionsCount} completed
${notes ? `• Notes: ${notes}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    if (onSaveNotes) {
      onSaveNotes(summary.id, notes);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Workday Completed!</h2>
              <p className="text-xs text-indigo-200">Daily productivity summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Hero Metric */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Active Focus Time</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {formatHoursMinutes(summary.activeWorkSeconds)}
              </p>
              <span className="text-[11px] text-slate-500">
                Target: {formatHoursMinutes(plannedSec)} ({achievementPct}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Target Met</span>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono mt-1 ${
                  achievementPct >= 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Sparkles size={12} />
                <span>{achievementPct}%</span>
              </div>
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Calendar size={13} className="text-indigo-600" />
                <span>Schedule</span>
              </div>
              <p className="text-xs font-bold text-slate-900 font-mono">
                {summary.startTime} - {summary.endTime}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock size={13} className="text-blue-600" />
                <span>Total Elapsed</span>
              </div>
              <p className="text-xs font-bold text-slate-900 font-mono">
                {formatHoursMinutes(summary.totalElapsedSeconds)}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Coffee size={13} className="text-amber-600" />
                <span>Break Time</span>
              </div>
              <p className="text-xs font-bold text-slate-900 font-mono">
                {formatHoursMinutes(summary.totalBreakSeconds)}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <BarChart3 size={13} className="text-purple-600" />
                <span>Sessions</span>
              </div>
              <p className="text-xs font-bold text-slate-900 font-mono">
                {summary.sessionsCount} work / {summary.breaksCount} break
              </p>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Workday Reflection or Wins (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well today? Tasks finished, milestones shipped, lessons learned..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveNotes}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
