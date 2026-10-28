import React from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  Play,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { WorkingHoursTimer } from '../common/WorkingHoursTimer';
import { NeedsAttentionSection } from '../common/NeedsAttentionSection';
import { CountdownBadge } from '../common/CountdownBadge';

interface TodayPageProps {
  onOpenNewTask: () => void;
  onOpenNewSchedule: () => void;
  onOpenRecordPayment: () => void;
  onOpenClientDetails: (clientId: string) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  onOpenNewTask,
  onOpenNewSchedule,
  onOpenRecordPayment,
  onOpenClientDetails,
}) => {
  const {
    tasks,
    schedules,
    goals,
    payments,
    invoices,
    displayCurrency,
    ratesData,
    completeTask,
    updateTask,
    toggleScheduleComplete,
    toggleMilestone,
    startTimer,
    stopTimer,
    isTimerRunning,
    timerSeconds,
    formatTimerTime,
    setActivePage,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Data buckets for Today
  const tasksDueToday = tasks.filter(
    (t) => t.deadline === todayStr && t.status !== 'completed' && t.status !== 'cancelled'
  );

  const overdueTasks = tasks.filter(
    (t) => t.deadline < todayStr && t.status !== 'completed' && t.status !== 'cancelled'
  );

  const schedulesForToday = schedules.filter((s) => s.date === todayStr);

  const milestonesDueToday = goals.flatMap((g) =>
    g.milestones
      .filter((m) => m.targetDate === todayStr)
      .map((m) => ({ ...m, goalId: g.id, goalName: g.name }))
  );

  const completedTodayTasks = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(todayStr)
  );

  const completedTodaySchedules = schedulesForToday.filter((s) => s.isCompleted);

  // Expected platform payouts or scheduled payments today
  const expectedPayoutsToday = tasks.filter(
    (t) => t.payoutExpectedDate === todayStr && t.payoutStatus === 'pending'
  );

  const paymentsReceivedToday = payments.filter((p) => p.date === todayStr);

  // Progress metrics calculation
  const totalActionItemsToday =
    tasksDueToday.length +
    schedulesForToday.length +
    milestonesDueToday.length +
    overdueTasks.length;

  const totalCompletedActionItems =
    completedTodayTasks.length + completedTodaySchedules.length;

  const totalDayItems = totalActionItemsToday + totalCompletedActionItems;
  const completionPercentage =
    totalDayItems > 0 ? Math.round((totalCompletedActionItems / totalDayItems) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* A. Daily Progress Header */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold tracking-wide uppercase">
              <Sparkles size={14} />
              <span>Daily Focus & Execution</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalActionItemsToday === 0
                ? 'All scheduled priorities for today are complete!'
                : `${totalActionItemsToday} item${totalActionItemsToday > 1 ? 's' : ''} require your focus today.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dedicated Today Work Timer */}
            <div className="flex items-center gap-2.5 bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md">
              <Clock size={16} className={isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
              <div className="font-mono text-sm font-bold tracking-tight">
                {formatTimerTime(timerSeconds)}
              </div>
              {isTimerRunning ? (
                <button
                  onClick={() => stopTimer()}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => startTimer()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Start</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-2.5 px-3.5 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between text-xs gap-4 mb-1">
                  <span className="font-semibold text-slate-700">Daily Completion</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-600">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionPercentage}%` }}
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{totalCompletedActionItems} done</span>
                  <span>{totalActionItemsToday} remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Counter Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Tasks Due Today</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {tasksDueToday.length}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Schedules & Meets</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {schedulesForToday.length}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Goals & Milestones</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {milestonesDueToday.length}
            </span>
          </div>

          <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-700 font-medium block">Overdue Items</span>
            <span className="text-base font-bold text-rose-700 font-mono tabular-nums">
              {overdueTasks.length}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-medium block">Expected / Recv.</span>
            <span className="text-base font-bold text-emerald-700 font-mono tabular-nums">
              {expectedPayoutsToday.length + paymentsReceivedToday.length}
            </span>
          </div>
        </div>
      </div>

      {/* Needs Attention Section (Strict 12-Hour Approaching Deadlines, Single Column) */}
      <NeedsAttentionSection />

      {/* Working Hours Timer (Daily Workday & Break Interval Manager) */}
      <WorkingHoursTimer />

      {/* C. Separate Overdue Items Section */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md hover:border-rose-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertTriangle size={16} className="text-rose-600" />
              <span>Overdue Tasks (Requires Rescheduling or Completion)</span>
            </div>
            <span className="text-[11px] text-rose-700 font-medium">Overdue deadline passed</span>
          </div>

          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-white rounded-lg border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CountdownBadge deadline={task.deadline} />
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {task.deadline}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-600 font-medium">{task.platform}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{task.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client: {task.clientName} · Value: {formatCurrency(task.projectPrice, task.currency)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startTimer(task.id, task.clientId)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Start Timer</span>
                  </button>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. Activity Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Tasks Due Today */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Tasks Due Today</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {tasksDueToday.length} due
            </span>
          </div>

          <div className="space-y-3">
            {tasksDueToday.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-xs font-medium text-slate-600">No tasks due today</p>
                <p className="text-[11px] text-slate-400">You are ahead of schedule.</p>
              </div>
            ) : (
              tasksDueToday.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-700">{task.platform}</span>
                      <span>·</span>
                      <button
                        onClick={() => onOpenClientDetails(task.clientId)}
                        className="hover:underline text-indigo-600"
                      >
                        {task.clientName}
                      </button>
                      <CountdownBadge deadline={task.deadline} compact />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{task.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatCurrency(task.projectPrice, task.currency)} · {task.priority} priority
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startTimer(task.id, task.clientId)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
                      title="Start Timer"
                    >
                      <Play size={13} fill="currentColor" />
                    </button>
                    <button
                      onClick={() => completeTask(task.id)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Today's Schedule & Meetings */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Today's Schedule & Activities</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {schedulesForToday.length} items
            </span>
          </div>

          <div className="space-y-3">
            {schedulesForToday.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar size={24} className="mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="text-xs font-medium text-slate-600">No scheduled activities today</p>
                <p className="text-[11px] text-slate-400">All schedule items for today are complete.</p>
              </div>
            ) : (
              schedulesForToday.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all duration-150 hover:border-slate-300 hover:shadow-xs flex items-center justify-between gap-3 ${
                    item.isCompleted
                      ? 'bg-slate-50/60 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => toggleScheduleComplete(item.id)}
                      className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono tabular-nums font-bold text-indigo-600">
                          {item.startTime}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {item.type}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold truncate mt-0.5 ${
                          item.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <CountdownBadge
                      deadline={item.date}
                      time={item.startTime}
                      isCompleted={item.isCompleted}
                      compact
                    />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.isCompleted ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Expected Platform Payouts & Payments Today */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Earnings & Payout Clearances</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {expectedPayoutsToday.length + paymentsReceivedToday.length} events
            </span>
          </div>

          <div className="space-y-3">
            {expectedPayoutsToday.length === 0 && paymentsReceivedToday.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs font-medium text-slate-600">No clearance events scheduled for today</p>
                <p className="text-[11px] text-slate-400">
                  Payments will appear here when scheduled clearance dates arrive.
                </p>
              </div>
            ) : (
              <>
                {expectedPayoutsToday.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                        {t.platform} Clearance Expected Today
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{t.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Client: {t.clientName} · Expected Net:{' '}
                        {formatCurrency(
                          t.projectPrice - (t.projectPrice * t.platformFeePercentage) / 100,
                          t.currency
                        )}
                      </p>
                    </div>
                    <button
                      onClick={onOpenRecordPayment}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shrink-0"
                    >
                      Confirm Received
                    </button>
                  </div>
                ))}

                {paymentsReceivedToday.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Received Today
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{p.clientName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Method: {p.paymentMethod}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                      +{formatCurrency(p.amount, p.currency)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Section 4: Completed Activities Today */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Completed Activities Today</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {completedTodayTasks.length + completedTodaySchedules.length} items
            </span>
          </div>

          <div className="space-y-2">
            {completedTodayTasks.length === 0 && completedTodaySchedules.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs text-slate-500">No completed items recorded yet today.</p>
                <p className="text-[11px] text-slate-400">Complete tasks or check off schedules to see them here.</p>
              </div>
            ) : (
              <>
                {completedTodayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">Task</span>
                  </div>
                ))}

                {completedTodaySchedules.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{s.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">Schedule</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
