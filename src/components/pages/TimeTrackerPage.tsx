import React, { useState, useMemo, useEffect } from 'react';
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
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { TimeEntry } from '../../types';
import { formatCurrency, convertCurrency, CURRENCY_SYMBOLS } from '../../services/currency';
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
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tasks,
    clients,
    settings,
    displayCurrency,
    ratesData,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [rateInput, setRateInput] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Live timer tick every second when project timer is running
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeTimer.isRunning && !activeTimer.isPaused) {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer.isRunning, activeTimer.isPaused]);

  const defaultRate = Number(settings.defaultHourlyRate) > 0 ? Number(settings.defaultHourlyRate) : 50;

  const findClientMatch = (clientId?: string, clientNameHint?: string) => {
    if (clientId) {
      const byId = clients.find((c) => c.id === clientId);
      if (byId) return byId;
    }
    if (clientNameHint) {
      const norm = clientNameHint.trim().toLowerCase();
      return clients.find((c) => c.fullName.trim().toLowerCase() === norm);
    }
    return undefined;
  };

  const resolveEffectiveHourlyRate = (taskId?: string, clientId?: string): number => {
    if (taskId) {
      const foundTask = tasks.find((t) => t.id === taskId);
      if (foundTask) {
        const foundClient = findClientMatch(foundTask.clientId || clientId, foundTask.clientName);
        const taskRate = Number(foundTask.hourlyRate);
        const clientRate = Number(foundClient?.hourlyRate);
        if (foundTask.priceType === 'hourly' && taskRate > 0) {
          return taskRate;
        }
        if (clientRate > 0) {
          return clientRate;
        }
        if (taskRate > 0) {
          return taskRate;
        }
      }
    }
    if (clientId) {
      const foundClient = findClientMatch(clientId);
      const clientRate = Number(foundClient?.hourlyRate);
      if (clientRate > 0) {
        return clientRate;
      }
    }
    return defaultRate;
  };

  const resolveEntryCurrency = (taskId?: string, clientId?: string, explicitCurrency?: string): string => {
    if (explicitCurrency) return explicitCurrency;
    if (taskId) {
      const foundTask = tasks.find((t) => t.id === taskId);
      if (foundTask?.currency) return foundTask.currency;
      const foundClient = findClientMatch(foundTask?.clientId || clientId, foundTask?.clientName);
      if (foundClient?.preferredCurrency) return foundClient.preferredCurrency;
    }
    if (clientId) {
      const foundClient = findClientMatch(clientId);
      if (foundClient?.preferredCurrency) return foundClient.preferredCurrency;
    }
    return settings.defaultCurrency || 'USD';
  };

  const resolvedRateForSelection = resolveEffectiveHourlyRate(
    selectedTaskId || undefined,
    selectedClientId || undefined
  );

  // Auto-sync the visible rate input whenever selected client, task, or underlying rates change
  useEffect(() => {
    if (!activeTimer.isRunning) {
      setRateInput(String(resolvedRateForSelection));
    }
  }, [selectedClientId, selectedTaskId, resolvedRateForSelection, activeTimer.isRunning]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const parsedRateInput = Number(rateInput);
  const previewHourlyRate =
    Number.isFinite(parsedRateInput) && parsedRateInput > 0
      ? parsedRateInput
      : resolvedRateForSelection;
  const activeOrPreviewRate = activeTimer.isRunning
    ? (Number(activeTimer.hourlyRate) > 0 ? Number(activeTimer.hourlyRate) : defaultRate)
    : previewHourlyRate;
  const activeRateCurrency = activeTimer.isRunning
    ? resolveEntryCurrency(activeTimer.projectId, activeTimer.clientId, activeTimer.currency)
    : resolveEntryCurrency(selectedTaskId || undefined, selectedClientId || undefined);
  const activeRateSymbol = CURRENCY_SYMBOLS[activeRateCurrency] || activeRateCurrency;

  // Compute live elapsed seconds for active timer
  const now = Date.now();
  let liveElapsedSeconds = activeTimer.accumulatedSeconds;
  if (activeTimer.isRunning && !activeTimer.isPaused && activeTimer.lastResumedTime) {
    liveElapsedSeconds += Math.floor((now - activeTimer.lastResumedTime) / 1000);
  }

  const liveBillableAmount = Number(
    ((liveElapsedSeconds / 3600) * activeOrPreviewRate).toFixed(2)
  );
  const liveBillableDisplay = convertCurrency(
    liveBillableAmount,
    activeRateCurrency,
    displayCurrency,
    ratesData.rates
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter time entries
  const filteredTimeEntries = timeEntries.filter((te) => {
    if (dateFilter === 'today') return te.date === todayStr;
    if (dateFilter === 'week') {
      const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
      return te.date >= weekAgo;
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
    .reduce((sum, te) => {
      const entryCurr = resolveEntryCurrency(te.projectId, te.clientId, te.currency);
      return sum + convertCurrency(te.billableAmount, entryCurr, displayCurrency, ratesData.rates);
    }, 0);

  // 7-Day Sparkline Trend Chart Data
  const sparklineData = useMemo(() => {
    const days: { day: string; hours: number; rawDate: string }[] = [];
    const currentDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate.getTime() - i * 86400000);
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

  const handleStartProjectTimer = () => {
    startTimer(
      selectedTaskId || undefined,
      selectedClientId || undefined,
      previewHourlyRate
    );
  };

  const activeTasksForSelect = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (!selectedClientId ||
        t.clientId === selectedClientId ||
        (selectedClient && t.clientName.trim().toLowerCase() === selectedClient.fullName.trim().toLowerCase()))
  );

  const formatTimerTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Time Tracker
          </h1>
          <InfoTooltip content="Timestamp-accurate billable work sessions, client project billing, and focus time tracking." />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenManualTimeModal}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Clock size={15} className="text-indigo-600" />
            <span>Manual Time Entry</span>
          </button>
        </div>
      </div>

      {/* RESTORED PROJECT TIMER FEATURE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Briefcase size={14} />
              <span>Project & Client Billing Timer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {activeTimer.isRunning
                ? activeTimer.projectName
                : selectedTask
                ? selectedTask.name
                : selectedClient
                ? `${selectedClient.fullName} — Hourly Work`
                : 'Select Client or Task to Start Timer'}
            </h2>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              {activeTimer.isRunning
                ? `Tracking billable hours for ${activeTimer.clientName} at ${activeRateSymbol} ${activeOrPreviewRate}/hr.`
                : selectedTask
                ? `Ready to track "${selectedTask.name}" (${selectedTask.clientName}) at ${activeRateSymbol} ${previewHourlyRate}/hr.`
                : selectedClient
                ? `Ready to track hourly work for ${selectedClient.fullName} at ${activeRateSymbol} ${previewHourlyRate}/hr.`
                : `Choose a client or task to start billable time tracking (default rate: ${activeRateSymbol} ${previewHourlyRate}/hr).`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
            <div className="text-center sm:text-left shrink-0">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">
                {activeTimer.isRunning ? (activeTimer.isPaused ? 'Timer Paused' : 'Live Elapsed Time') : 'Ready to Start'}
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-indigo-400 tabular-nums">
                {formatTimerTime(liveElapsedSeconds)}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono block mt-0.5">
                Est. Value: {formatCurrency(liveBillableDisplay, displayCurrency)} ({activeRateSymbol} {activeOrPreviewRate}/hr)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!activeTimer.isRunning ? (
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      const nextClientId = e.target.value;
                      setSelectedClientId(nextClientId);
                      const nextClient = clients.find((c) => c.id === nextClientId);
                      if (
                        nextClientId &&
                        selectedTask &&
                        selectedTask.clientId !== nextClientId &&
                        (!nextClient ||
                          selectedTask.clientName.trim().toLowerCase() !==
                            nextClient.fullName.trim().toLowerCase())
                      ) {
                        setSelectedTaskId('');
                      }
                    }}
                    aria-label="Select client"
                    className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:max-w-[180px] truncate cursor-pointer"
                  >
                    <option value="">All Clients / General</option>
                    {clients
                      .filter((c) => c.status !== 'closed' && c.status !== 'archived' || c.id === selectedClientId)
                      .map((c) => {
                        const cSym = CURRENCY_SYMBOLS[c.preferredCurrency || 'USD'] || c.preferredCurrency || '$';
                        return (
                          <option key={c.id} value={c.id}>
                            {c.fullName}{Number(c.hourlyRate) > 0 ? ` (${cSym} ${c.hourlyRate}/hr)` : ''}
                          </option>
                        );
                      })}
                  </select>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      const nextTaskId = e.target.value;
                      setSelectedTaskId(nextTaskId);
                      if (nextTaskId) {
                        const matched = tasks.find((t) => t.id === nextTaskId);
                        if (matched) {
                          const matchedClient = findClientMatch(matched.clientId, matched.clientName);
                          if (matchedClient?.id) {
                            setSelectedClientId(matchedClient.id);
                          } else if (matched.clientId) {
                            setSelectedClientId(matched.clientId);
                          }
                        }
                      }
                    }}
                    aria-label="Select task"
                    className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:max-w-[200px] truncate cursor-pointer"
                  >
                    <option value="">
                      {selectedClient ? `${selectedClient.fullName} — General Hourly` : 'General Work Session'}
                    </option>
                    {activeTasksForSelect.map((task) => {
                      const effRate = resolveEffectiveHourlyRate(task.id, task.clientId);
                      const tSym = CURRENCY_SYMBOLS[task.currency || 'USD'] || task.currency || '$';
                      return (
                        <option key={task.id} value={task.id}>
                          {task.name} ({task.clientName} · {tSym} {effRate}/hr)
                        </option>
                      );
                    })}
                  </select>
                  <div
                    className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 shrink-0"
                    title="Effective hourly rate for this session (auto-filled from project or client profile)"
                  >
                    <span className="text-[11px] font-mono text-indigo-300 mr-1.5 select-none">
                      {activeRateSymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      aria-label="Hourly rate"
                      className="w-16 bg-transparent text-white text-xs font-mono font-bold focus:outline-none tabular-nums"
                    />
                    <span className="text-[10px] text-slate-400 ml-1 select-none">/hr</span>
                  </div>
                  <button
                    onClick={handleStartProjectTimer}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
                  >
                    <Play size={15} fill="currentColor" />
                    <span>Start Timer</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {activeTimer.isPaused ? (
                    <button
                      onClick={resumeTimer}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <Pause size={14} fill="currentColor" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    onClick={stopTimer}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <Square size={14} fill="currentColor" />
                    <span>Stop & Save</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* A. Statistics Overview & Sparkline Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">Filter Range:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-xs">
            {(['today', 'week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3.5 py-1.5 font-medium capitalize rounded-lg transition-colors cursor-pointer ${
                  dateFilter === period
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stat Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
              <span className="text-xs text-slate-500 font-medium">Tracked Time</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
                {totalHours}h
              </p>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {totalSeconds.toLocaleString()} secs total
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
              <span className="text-xs text-blue-600 font-medium">Billable Hours</span>
              <p className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1.5">
                {billableHours}h
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">client billable work</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
              <span className="text-xs text-emerald-600 font-medium">Billable Value</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1.5">
                {formatCurrency(billableValue, displayCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">calculated earnings</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
              <span className="text-xs text-indigo-600 font-medium">Sessions</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1.5">
                {filteredTimeEntries.length}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">logged intervals</span>
            </div>
          </div>

          {/* Mini Sparkline Chart Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-900">7-Day Billable Trend</span>
                <p className="text-[10px] text-slate-500">Daily logged billable work hours</p>
              </div>
              <TrendingUp size={16} className="text-indigo-600 shrink-0" />
            </div>
            <div className="h-24 w-full mt-2">
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
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
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Project & Client</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6 text-right">Duration</th>
                <th className="py-3.5 px-6 text-right">Rate</th>
                <th className="py-3.5 px-6 text-right">Billable Value</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimeEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No time entries found for this period. Use the active project timer above or "Manual Time Entry".
                  </td>
                </tr>
              ) : (
                filteredTimeEntries.map((entry) => {
                  const hrs = (entry.durationSeconds / 3600).toFixed(2);
                  const entryCurr = resolveEntryCurrency(entry.projectId, entry.clientId, entry.currency);
                  const entrySym = CURRENCY_SYMBOLS[entryCurr] || entryCurr;
                  const convertedBillable = convertCurrency(
                    entry.billableAmount,
                    entryCurr,
                    displayCurrency,
                    ratesData.rates
                  );
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono tabular-nums text-slate-600">
                        {entry.date}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900">{entry.projectName}</p>
                        <p className="text-[11px] text-slate-500">{entry.clientName}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {entry.description || 'Focus session work'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {hrs} hrs
                      </td>
                      <td className="py-4 px-6 text-right font-mono tabular-nums text-slate-600">
                        {entrySym} {entry.hourlyRate}/h
                      </td>
                      <td className="py-4 px-6 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(convertedBillable, displayCurrency)}
                      </td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                          title="Edit session entry"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingEntryId(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this recorded time entry? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeletingEntryId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer"
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
