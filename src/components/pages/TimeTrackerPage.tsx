import React, { useState, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  Clock,
  DollarSign,
  Trash2,
  Edit3,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { TimeEntry } from '../../types';
import { formatCurrency } from '../../services/currency';
import { InfoTooltip } from '../common/Tooltip';
import { ManualTimeModal } from '../modals/ManualTimeModal';

interface TimeTrackerPageProps {
  onOpenCreateInvoice?: () => void;
  onOpenManualTimeModal: () => void;
  onOpenRecordPaymentWithInvoice?: (invoice: any) => void;
}

export const TimeTrackerPage: React.FC<TimeTrackerPageProps> = ({
  onOpenManualTimeModal,
}) => {
  const {
    timeEntries,
    deleteTimeEntry,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

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

  // 7-Day Sparkline Trend Chart Data
  const sparklineData = useMemo(() => {
    const days: { day: string; hours: number; rawDate: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayBillableSecs = timeEntries
        .filter((te) => te.date === dateStr && te.isBillable)
        .reduce((sum, te) => sum + te.durationSeconds, 0);
      const dayHours = Number((dayBillableSecs / 3600).toFixed(2));
      days.push({ day: dayLabel, hours: dayHours, rawDate: dateStr });
    }
    return days;
  }, [timeEntries]);

  const confirmDelete = () => {
    if (deletingEntryId) {
      deleteTimeEntry(deletingEntryId);
      setDeletingEntryId(null);
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

      {/* A. Statistics Overview & Sparkline Chart */}
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
                {period === 'today'
                  ? 'Today'
                  : period === 'week'
                  ? 'This Week'
                  : period === 'month'
                  ? 'This Month'
                  : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stat Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
              <span className="text-xs text-slate-500">Tracked Time</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {totalHours}h
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {totalSeconds.toLocaleString()} secs
              </span>
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
              <span className="text-xs text-indigo-600 font-medium">Sessions</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                {filteredTimeEntries.length}
              </p>
              <span className="text-[10px] text-slate-400">log entries</span>
            </div>
          </div>

          {/* Mini Sparkline Chart Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-xs font-bold text-slate-800">7-Day Billable Hours Trend</span>
                <p className="text-[10px] text-slate-500">Daily logged billable work hours</p>
              </div>
              <TrendingUp size={16} className="text-indigo-600 shrink-0" />
            </div>
            <div className="h-20 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [`${val ?? 0} hrs`, 'Billable Time']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '4px 8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#4f46e5' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                      <td className="py-3.5 px-5 text-right flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                          title="Edit session entry"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingEntryId(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
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

      {/* Edit Session Modal */}
      {editingEntry && (
        <ManualTimeModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          editingTimeEntry={editingEntry}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Session Deletion</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this recorded time entry? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingEntryId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
