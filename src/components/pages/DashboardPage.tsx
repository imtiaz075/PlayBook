import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Plus,
  Play,
  FileText,
  Users,
  PieChart,
  Target,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { WorkingHoursTimer } from '../common/WorkingHoursTimer';
import { NeedsAttentionSection } from '../common/NeedsAttentionSection';
import { InfoTooltip } from '../common/Tooltip';

interface DashboardPageProps {
  onOpenCreateInvoice: () => void;
  onOpenRecordPayment: () => void;
  onOpenNewTask: () => void;
  onOpenNewSchedule: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateInvoice,
  onOpenRecordPayment,
  onOpenNewTask,
  onOpenNewSchedule,
}) => {
  const {
    tasks,
    timeEntries,
    schedules,
    goals,
    invoices,
    payments,
    expenses,
    budgetCategories,
    clients,
    displayCurrency,
    ratesData,
    setActivePage,
    completeTask,
    toggleScheduleComplete,
    toggleMilestone,
    startTimer,
    setQuickAddOpen,
    needsAttentionSettings,
    updateNeedsAttentionSettings,
    dismissAttentionItem,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Calculations for Today at a Glance
  const tasksCompletedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(todayStr)
  ).length;

  const secondsTrackedToday = timeEntries
    .filter((te) => te.date === todayStr)
    .reduce((sum, te) => sum + te.durationSeconds, 0);

  const schedulesCompletedToday = schedules.filter(
    (s) => s.date === todayStr && s.isCompleted
  ).length;

  const milestonesCompletedToday = goals
    .flatMap((g) => g.milestones)
    .filter((m) => m.isCompleted).length;

  const contactsAddedToday = clients.filter((c) => c.createdAt.startsWith(todayStr)).length;

  // Today's Payments Received (Actual Cash)
  const paymentsReceivedToday = payments
    .filter((p) => p.date === todayStr)
    .reduce(
      (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
      0
    );

  // Today's Invoiced / Earned Revenue
  const revenueEarnedToday = invoices
    .filter((inv) => inv.issueDate === todayStr)
    .reduce(
      (sum, inv) => sum + convertCurrency(inv.total, inv.currency, displayCurrency, ratesData.rates),
      0
    );

  // 2. Needs Attention Calculation (Tasks, Schedules, Goals, and Invoices with deadlines)
  const now = new Date();


  // 3. Seven-day performance overview
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

  const tasksLast7Days = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt >= sevenDaysAgoStr
  ).length;

  const secondsTrackedLast7Days = timeEntries
    .filter((te) => te.date >= sevenDaysAgoStr)
    .reduce((sum, te) => sum + te.durationSeconds, 0);

  const hoursTrackedLast7Days = (secondsTrackedLast7Days / 3600).toFixed(1);

  const paymentsReceivedLast7Days = payments
    .filter((p) => p.date >= sevenDaysAgoStr)
    .reduce(
      (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
      0
    );

  const expensesLast7Days = expenses
    .filter((e) => e.date >= sevenDaysAgoStr)
    .reduce(
      (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
      0
    );

  // 4. Daily Hours in Last 7 Days for visual chart
  const last7DaysLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayHours = timeEntries
      .filter((te) => te.date === dateStr)
      .reduce((s, te) => s + te.durationSeconds / 3600, 0);
    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      hours: Number(dayHours.toFixed(1)),
    };
  });

  const maxDailyHours = Math.max(...last7DaysLabels.map((d) => d.hours), 5);

  // Monthly Budget Progress
  const totalPlannedBudget = budgetCategories
    .filter((c) => !c.isArchived)
    .reduce((sum, c) => sum + c.monthlyLimit, 0);

  const currentMonthExpenses = expenses
    .filter((e) => e.date.startsWith(todayStr.substring(0, 7)))
    .reduce(
      (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
      0
    );

  const budgetPctUsed = totalPlannedBudget > 0 ? Math.min(100, Math.round((currentMonthExpenses / totalPlannedBudget) * 100)) : 0;

  // Monthly Earnings Goal Progress
  const primaryGoal = goals.find((g) => g.type === 'income') || goals[0];
  const goalTarget = primaryGoal ? primaryGoal.targetValue : 6000;
  const currentMonthPayments = payments
    .filter((p) => p.date.startsWith(todayStr.substring(0, 7)))
    .reduce(
      (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
      0
    );
  const goalPct = Math.min(100, Math.round((currentMonthPayments / (goalTarget || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* A. Daily Motivation Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wide">
            <Sparkles size={14} className="text-amber-400" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            "Your consistency is building your future."
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Small daily progress compounds into extraordinary freedom and client trust.
          </p>
        </div>

        {/* Compact Daily Achievement Count */}
        <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/10">
          <div className="text-right">
            <span className="block text-[11px] text-indigo-200">Today's Achievements</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {tasksCompletedToday + schedulesCompletedToday} activities
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Needs Attention Section (Strict 12-Hour Approaching Deadlines, Single Column) */}
      <NeedsAttentionSection />

      {/* Working Hours Timer (Daily Workday & Break Interval Manager) */}
      <WorkingHoursTimer />

      {/* B. Today At A Glance (Interactive Stat Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today at a Glance</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tasks Completed */}
          <div
            onClick={() => setActivePage('tasks')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Tasks Done</span>
              <CheckCircle2 size={15} className="text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {tasksCompletedToday}
            </p>
            <span className="text-[10px] text-slate-500">completed today</span>
          </div>

          {/* Time Tracked */}
          <div
            onClick={() => setActivePage('time')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Time Tracked</span>
              <Clock size={15} className="text-indigo-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {(secondsTrackedToday / 3600).toFixed(1)}h
            </p>
            <span className="text-[10px] text-slate-500">{Math.round(secondsTrackedToday / 60)} minutes</span>
          </div>

          {/* Schedules Done */}
          <div
            onClick={() => setActivePage('schedule')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Schedules</span>
              <Calendar size={15} className="text-blue-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {schedulesCompletedToday}
            </p>
            <span className="text-[10px] text-slate-500">checked off</span>
          </div>

          {/* Milestones Done */}
          <div
            onClick={() => setActivePage('goals')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Milestones</span>
              <Target size={15} className="text-purple-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {milestonesCompletedToday}
            </p>
            <span className="text-[10px] text-slate-500">goal steps</span>
          </div>

          {/* Payments Received */}
          <div
            onClick={() => setActivePage('earnings')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Cash Received</span>
              <DollarSign size={15} className="text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums truncate">
              {formatCurrency(paymentsReceivedToday, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-500">actual deposited</span>
          </div>

          {/* Invoiced / Earned */}
          <div
            onClick={() => setActivePage('time')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Invoiced Today</span>
              <FileText size={15} className="text-amber-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums truncate">
              {formatCurrency(revenueEarnedToday, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-500">billed revenue</span>
          </div>
        </div>
      </div>


      {/* D. Seven-Day Performance & Key Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Performance Metric Overview */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Performance</h3>
              <p className="text-xs text-slate-500">Rolling week output & cashflow</p>
            </div>
            <TrendingUp size={16} className="text-indigo-600" />
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-600">Tasks Completed</span>
              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                {tasksLast7Days} projects
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-600">Focus Hours Tracked</span>
              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                {hoursTrackedLast7Days} hrs
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-600">Payments Deposited</span>
              <span className="text-xs font-bold text-emerald-600 font-mono tabular-nums">
                {formatCurrency(paymentsReceivedLast7Days, displayCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-600">Expenses Incurred</span>
              <span className="text-xs font-bold text-rose-600 font-mono tabular-nums">
                {formatCurrency(expensesLast7Days, displayCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 bg-slate-50 px-2 rounded-md">
              <span className="text-xs font-semibold text-slate-700">Net 7-Day Cashflow</span>
              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(paymentsReceivedLast7Days - expensesLast7Days, displayCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Work Hours Chart (Last 7 Days) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Daily Tracked Hours</h3>
              <Clock size={16} className="text-indigo-600" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Last 7 days work session breakdown</p>
          </div>

          <div className="h-32 flex items-end justify-between gap-2 pt-2 px-1">
            {last7DaysLabels.map((item) => {
              const heightPct = Math.max(8, Math.round((item.hours / maxDailyHours) * 100));
              const isToday = item.date === todayStr;
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-600">
                    {item.hours > 0 ? `${item.hours}h` : '0'}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-md h-24 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        isToday ? 'bg-indigo-600' : 'bg-slate-400 hover:bg-slate-600'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isToday ? 'text-indigo-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {item.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal & Budget Gauges */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Targets & Health</h3>
              <Target size={16} className="text-purple-600" />
            </div>
            <p className="text-xs text-slate-500">Monthly revenue goal & budget limits</p>
          </div>

          {/* Monthly Revenue Goal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Monthly Revenue Goal</span>
              <span className="font-mono tabular-nums text-slate-900 font-bold">
                {goalPct}% ({formatCurrency(currentMonthPayments, displayCurrency)} / {formatCurrency(goalTarget, displayCurrency)})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${goalPct}%` }}
                className="h-full bg-emerald-600 rounded-full transition-all"
              />
            </div>
          </div>

          {/* Monthly Budget Spending */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Budget Spent</span>
              <span className={`font-mono tabular-nums font-bold ${budgetPctUsed > 90 ? 'text-rose-600' : 'text-slate-900'}`}>
                {budgetPctUsed}% ({formatCurrency(currentMonthExpenses, displayCurrency)} / {formatCurrency(totalPlannedBudget, displayCurrency)})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${budgetPctUsed}%` }}
                className={`h-full rounded-full transition-all ${
                  budgetPctUsed > 90 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active Clients</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {clients.filter((c) => c.status === 'active').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
