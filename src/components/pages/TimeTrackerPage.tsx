import React, { useState } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  Clock,
  DollarSign,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimeEntry } from '../../types';
import { formatCurrency } from '../../services/currency';
import { InfoTooltip } from '../common/Tooltip';

interface TimeTrackerPageProps {
  onOpenCreateInvoice?: () => void;
  onOpenManualTimeModal: () => void;
  onOpenRecordPaymentWithInvoice?: (invoice: any) => void;
}

export const TimeTrackerPage: React.FC<TimeTrackerPageProps> = ({
  onOpenManualTimeModal,
}) => {
  const {
    activeTimer,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    timeEntries,
    deleteTimeEntry,
    tasks,
    clients,
    displayCurrency,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter time entries
  const filteredTimeEntries = timeEntries.filter((te) => {
    if (dateFilter === 'today') return te.date === todayStr;
    if (dateFilter === 'week') {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      return te.date >= lastWeek;
    }
    if (dateFilter === 'month') {
      return te.date.startsWith(todayStr.substring(0, 7));
    }
    return true;
  });

  // Time Tracker Statistics
  const totalSeconds = filteredTimeEntries.reduce((sum, te) => sum + te.durationSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  const billableSeconds = filteredTimeEntries
    .filter((te) => te.isBillable)
    .reduce((sum, te) => sum + te.durationSeconds, 0);
  const billableHours = (billableSeconds / 3600).toFixed(1);

  const billableValue = filteredTimeEntries
    .filter((te) => te.isBillable)
    .reduce((sum, te) => sum + te.billableAmount, 0);

  // Active Timer formatting
  const formatTimerClock = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimerFromDropdown = () => {
    if (selectedProjectId) {
      startTimer(selectedProjectId);
    } else {
      startTimer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Time Tracker
          </h1>
          <InfoTooltip content="Timestamp-accurate billable work sessions, client billing, and focus time tracking." />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManualTimeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <Clock size={14} className="text-indigo-600" />
            <span>Manual Time Entry</span>
          </button>
        </div>
      </div>

      {/* A. Statistics Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter Range:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['today', 'week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 font-medium capitalize rounded-md transition-colors ${
                  dateFilter === period
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-slate-500">Tracked Time</span>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {totalHours}h
            </p>
            <span className="text-[10px] text-slate-400 font-mono">{totalSeconds.toLocaleString()} secs</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-blue-600 font-medium">Billable Hours</span>
            <p className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">
              {billableHours}h
            </p>
            <span className="text-[10px] text-slate-400">client work</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-emerald-600 font-medium">Billable Value</span>
            <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
              {formatCurrency(billableValue, 'USD')}
            </p>
            <span className="text-[10px] text-slate-400">calculated value</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-indigo-600 font-medium">Recorded Sessions</span>
            <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
              {filteredTimeEntries.length}
            </p>
            <span className="text-[10px] text-slate-400">log entries</span>
          </div>
        </div>
      </div>

      {/* B. Active Timer Interactive Console */}
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeTimer.isRunning
                    ? activeTimer.isPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                {activeTimer.isRunning
                  ? activeTimer.isPaused
                    ? 'Timer Paused'
                    : 'Recording Live Focus Session'
                  : 'Ready to Track Focus Work'}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-white tracking-tight">
                {formatTimerClock(elapsedSeconds)}
              </span>
              {activeTimer.isRunning && (
                <div className="text-xs text-emerald-400 font-mono">
                  Billable Value:{' '}
                  <span className="font-bold text-sm">
                    {formatCurrency((elapsedSeconds / 3600) * (activeTimer.hourlyRate || 50), 'USD')}
                  </span>
                </div>
              )}
            </div>

            {activeTimer.isRunning ? (
              <p className="text-xs text-slate-300">
                Working on <span className="font-semibold text-white">{activeTimer.projectName}</span>{' '}
                for <span className="text-indigo-300 font-semibold">{activeTimer.clientName}</span>{' '}
                (@ ${activeTimer.hourlyRate}/hr)
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Project / Task (or General)</option>
                  {tasks
                    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.clientName} - {t.platform})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Timer Buttons */}
          <div className="flex items-center gap-3">
            {activeTimer.isRunning ? (
              <>
                {activeTimer.isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Pause size={14} fill="currentColor" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={stopTimer}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <Square size={14} fill="currentColor" />
                  <span>Stop & Save Session</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartTimerFromDropdown}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:scale-102"
              >
                <Play size={15} fill="currentColor" />
                <span>Start Live Timer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* C. Time Entries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Work Sessions Log ({filteredTimeEntries.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {totalHours} hrs logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Project & Client</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5 text-right">Duration</th>
                <th className="py-3 px-5 text-right">Rate</th>
                <th className="py-3 px-5 text-right">Billable Value</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimeEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No time entries found for this period. Use the active timer or "Manual Time Entry".
                  </td>
                </tr>
              ) : (
                filteredTimeEntries.map((entry) => {
                  const hrs = (entry.durationSeconds / 3600).toFixed(2);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono tabular-nums text-slate-600">
                        {entry.date}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{entry.projectName}</p>
                        <p className="text-[11px] text-slate-500">{entry.clientName}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">
                        {entry.description || 'Focus session work'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {hrs} hrs
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-600">
                        ${entry.hourlyRate}/h
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(entry.billableAmount, 'USD')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => deleteTimeEntry(entry.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
