import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  Filter,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScheduleItem } from '../../types';
import { CountdownBadge } from '../common/CountdownBadge';
import { InfoTooltip } from '../common/Tooltip';

interface SchedulePageProps {
  onOpenNewSchedule: () => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ onOpenNewSchedule }) => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, toggleScheduleComplete } = useApp();

  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredSchedules = schedules.filter((s) => {
    if (filterPeriod === 'day') {
      return s.date === todayStr;
    }
    if (filterPeriod === 'week') {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
      const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      return s.date >= lastWeek && s.date <= nextWeek;
    }
    if (filterPeriod === 'month') {
      const currentMonth = todayStr.substring(0, 7);
      return s.date.startsWith(currentMonth);
    }
    return true;
  });

  // Sort chronologically
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  // Statistics
  const totalCount = filteredSchedules.length;
  const completedCount = filteredSchedules.filter((s) => s.isCompleted).length;
  const upcomingCount = filteredSchedules.filter(
    (s) => !s.isCompleted && (s.date > todayStr || s.date === todayStr)
  ).length;
  const missedCount = filteredSchedules.filter(
    (s) => !s.isCompleted && s.date < todayStr
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Schedule</h1>
          <InfoTooltip content="Plan client calls, milestone delivery dates, focus sessions, and recurring reminders." />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* A. Statistics Cards with Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter Range:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['day', 'week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-3 py-1 font-medium capitalize rounded-md transition-colors ${
                  filterPeriod === period
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {period === 'day' ? 'Today' : period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-slate-500">Total Scheduled</span>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {totalCount}
            </p>
            <span className="text-[10px] text-slate-400">in selected period</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-emerald-600 font-medium">Completed</span>
            <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
              {completedCount}
            </p>
            <span className="text-[10px] text-slate-400">activities done</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-indigo-600 font-medium">Upcoming</span>
            <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
              {upcomingCount}
            </p>
            <span className="text-[10px] text-slate-400">pending execution</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
            <span className="text-xs text-rose-600 font-medium">Missed / Overdue</span>
            <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
              {missedCount}
            </p>
            <span className="text-[10px] text-slate-400">past scheduled date</span>
          </div>
        </div>
      </div>

      {/* B. Schedule List (Chronological) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Timeline & Planned Activities</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {sortedSchedules.length} items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-slate-700">No scheduled items found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "+ Add Schedule" to set appointments, deadlines, and reminders.
              </p>
            </div>
          ) : (
            sortedSchedules.map((item) => {
              const isPast = item.date < todayStr && !item.isCompleted;
              const isToday = item.date === todayStr;

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    item.isCompleted
                      ? 'bg-slate-50/50 opacity-60'
                      : isPast
                      ? 'bg-rose-50/30'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleScheduleComplete(item.id)}
                      className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        item.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-500 bg-white'
                      }`}
                    >
                      {item.isCompleted && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-mono tabular-nums font-bold ${
                            isToday ? 'text-indigo-600' : 'text-slate-700'
                          }`}
                        >
                          {item.date} · {item.startTime}
                          {item.endTime ? ` - ${item.endTime}` : ''}
                        </span>
                        <CountdownBadge
                          deadline={item.date}
                          time={item.startTime}
                          isCompleted={item.isCompleted}
                          compact
                        />
                        <span className="text-slate-300">·</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                            item.type === 'activity'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {item.type}
                        </span>
                        {item.repeatSetting !== 'none' && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                            Repeats: {item.repeatSetting}
                          </span>
                        )}
                        {item.alertAtTime && (
                          <span className="text-[10px] text-amber-700 flex items-center gap-0.5" title="Alert enabled">
                            <Bell size={11} /> Alert
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-bold mt-1 ${
                          item.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => toggleScheduleComplete(item.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      {item.isCompleted ? 'Mark Pending' : 'Check Off'}
                    </button>
                    <button
                      onClick={() => deleteSchedule(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete schedule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
