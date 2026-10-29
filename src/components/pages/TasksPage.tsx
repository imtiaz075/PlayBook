import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Play,
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  Trash2,
  Layers,
  Calendar,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, PlatformType, Priority } from '../../types';
import { formatCurrency } from '../../services/currency';
import { CountdownBadge } from '../common/CountdownBadge';
import { InfoTooltip } from '../common/Tooltip';
import { TaskModal } from '../modals/TaskModal';

interface TasksPageProps {
  onOpenNewTask: () => void;
  onOpenRecordPaymentWithTask: (task: Task) => void;
  onOpenCreateInvoiceWithTask: (task: Task) => void;
  onOpenClientDetails: (clientId: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onOpenNewTask,
  onOpenRecordPaymentWithTask,
  onOpenCreateInvoiceWithTask,
  onOpenClientDetails,
}) => {
  const {
    tasks,
    clients,
    updateTask,
    deleteTask,
    completeTask,
    startTimer,
    stopTimer,
    isTimerRunning,
    timerSeconds,
    formatTimerTime,
    timeEntries,
    settings,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Base platform list
  const platforms: PlatformType[] = [
    'Fiverr',
    'Upwork',
    'Freelancer.com',
    'PeoplePerHour',
    'Guru',
    'LinkedIn',
    'Direct Clients',
    'Other',
  ];

  // Derive all unique platforms including custom ones from tasks
  const allPlatforms = useMemo(() => {
    const set = new Set<string>(platforms);
    tasks.forEach((t) => set.add(t.platform));
    return Array.from(set);
  }, [tasks]);

  // Global Statistics
  const openCount = tasks.filter((t) => t.status === 'open').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.deadline < todayStr
  ).length;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (platformFilter !== 'all' && t.platform !== platformFilter) {
      return false;
    }
    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') {
      return t.status !== 'completed' && t.status !== 'cancelled' && t.deadline < todayStr;
    }
    return t.status === statusFilter;
  });

  // Sort: overdue & urgent first, then deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aOverdue = a.status !== 'completed' && a.deadline < todayStr;
    const bOverdue = b.status !== 'completed' && b.deadline < todayStr;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.deadline.localeCompare(b.deadline);
  });

  // Group by platform
  const tasksByPlatform = useMemo(() => {
    const map: Record<string, Task[]> = {};
    allPlatforms.forEach((p) => {
      map[p] = [];
    });
    sortedTasks.forEach((t) => {
      if (!map[t.platform]) map[t.platform] = [];
      map[t.platform].push(t);
    });
    return map;
  }, [sortedTasks, allPlatforms]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tasks
          </h1>
          <InfoTooltip content="Organized client projects, milestone delivery dates, pricing, and live deadline tracking." />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dedicated Tasks Timer */}
          <div className="flex items-center gap-2.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md">
            <Clock size={15} className={isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
            <div className="font-mono text-xs font-bold tracking-tight">
              {formatTimerTime(timerSeconds)}
            </div>
            {isTimerRunning ? (
              <button
                onClick={() => stopTimer()}
                className="px-2 py-0.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => startTimer()}
                className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
              >
                <Play size={11} fill="currentColor" />
                <span>Start</span>
              </button>
            )}
          </div>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-slate-500">All Projects</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {tasks.length}
          </p>
          <span className="text-[10px] text-slate-400">total tracked</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-blue-600 font-medium">In Progress</span>
          <p className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">
            {inProgressCount}
          </p>
          <span className="text-[10px] text-slate-400">active sprint</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-slate-600 font-medium">Open Backlog</span>
          <p className="text-2xl font-bold text-slate-700 font-mono tabular-nums mt-1">
            {openCount}
          </p>
          <span className="text-[10px] text-slate-400">queued work</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-emerald-600 font-medium">Completed</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {completedCount}
          </p>
          <span className="text-[10px] text-slate-400">delivered</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-rose-600 font-medium">Overdue</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {overdueCount}
          </p>
          <span className="text-[10px] text-slate-400">needs attention</span>
        </div>
      </div>

      {/* Filter Tabs & Platform Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'open', label: 'Open' },
            { id: 'completed', label: 'Completed' },
            { id: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Platform:</span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Platforms</option>
            {allPlatforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Platform-Based Organization Sections */}
      <div className="space-y-6">
        {allPlatforms.map((platform) => {
          const platformTasks = tasksByPlatform[platform] || [];
          if (platformFilter !== 'all' && platform !== platformFilter) return null;
          if (platformTasks.length === 0 && platformFilter === 'all') return null;

          // Platform metrics
          const activeProjects = platformTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;
          const completedProjects = platformTasks.filter((t) => t.status === 'completed').length;
          const grossVal = platformTasks.reduce((sum, t) => sum + t.projectPrice, 0);
          const feePct = settings.platformFees[platform] ?? 0;
          const estimatedFees = platformTasks.reduce((sum, t) => sum + (t.projectPrice * (t.platformFeePercentage ?? feePct)) / 100, 0);
          const netEarnings = grossVal - estimatedFees;

          return (
            <div key={platform} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
              {/* Platform Section Header */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">{platform}</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    ({platformTasks.length} task{platformTasks.length !== 1 ? 's' : ''})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-mono">
                    Fee: {feePct}%
                  </span>
                </div>

                {/* Platform Summary Totals */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Active: </span>
                    <span className="font-bold text-slate-800 font-mono tabular-nums">{activeProjects}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Delivered: </span>
                    <span className="font-bold text-emerald-600 font-mono tabular-nums">{completedProjects}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross: </span>
                    <span className="font-bold text-slate-800 font-mono tabular-nums">${grossVal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Est. Fees: </span>
                    <span className="font-bold text-rose-600 font-mono tabular-nums">-${estimatedFees.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <span className="text-emerald-700 font-semibold">Est. Net: </span>
                    <span className="font-bold text-emerald-800 font-mono tabular-nums">${netEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Task Cards Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {platformTasks.map((task) => {
                  const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && task.deadline < todayStr;
                  const feeAmount = (task.projectPrice * task.platformFeePercentage) / 100;
                  const netValue = task.projectPrice - feeAmount;
                  const remainingBalance = Math.max(0, task.projectPrice - task.amountPaid);
                  const trackedHours = (task.totalTimeTrackedSeconds / 3600).toFixed(1);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-slate-300 flex flex-col justify-between ${
                        isOverdue
                          ? 'bg-rose-50/40 border-rose-300'
                          : task.status === 'completed'
                          ? 'bg-slate-50/60 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Top Kicker Bar */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                task.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {task.status.replace('_', ' ')}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                                task.priority === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <CountdownBadge
                              deadline={task.deadline}
                              isCompleted={task.status === 'completed'}
                              compact
                            />
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                              {task.deadline}
                            </span>
                          </div>
                        </div>

                        {/* Title & Client */}
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{task.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>Client:</span>
                          <button
                            onClick={() => onOpenClientDetails(task.clientId)}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {task.clientName}
                          </button>
                        </div>

                        {/* Financial & Fee Math Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Gross Price</span>
                            <span className="font-bold text-slate-900 font-mono tabular-nums">
                              {formatCurrency(task.projectPrice, task.currency)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              Fee ({task.platformFeePercentage}%)
                            </span>
                            <span className="font-bold text-rose-600 font-mono tabular-nums">
                              -{formatCurrency(feeAmount, task.currency)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-emerald-700 font-semibold block">Est. Net</span>
                            <span className="font-bold text-emerald-700 font-mono tabular-nums">
                              {formatCurrency(netValue, task.currency)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Remaining Due</span>
                            <span className="font-bold text-amber-700 font-mono tabular-nums">
                              {formatCurrency(remainingBalance, task.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Time & Payout Info */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            <span>Tracked: </span>
                            <span className="font-mono tabular-nums font-semibold text-slate-800">
                              {trackedHours} hrs
                            </span>
                          </div>

                          {task.payoutExpectedDate && (
                            <div className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">
                              Payout Clearance: {task.payoutExpectedDate}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startTimer(task.id, task.clientId)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                            title="Start Timer for this project"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Timer</span>
                          </button>

                          <button
                            onClick={() => onOpenRecordPaymentWithTask(task)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            title="Record client payment"
                          >
                            <DollarSign size={12} />
                            <span>Payment</span>
                          </button>

                          <button
                            onClick={() => onOpenCreateInvoiceWithTask(task)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
                            title="Create invoice for this project"
                          >
                            <FileText size={12} />
                            <span>Invoice</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"
                            title="Edit task/project"
                          >
                            <Edit size={13} />
                          </button>

                          {task.status !== 'completed' ? (
                            <button
                              onClick={() => completeTask(task.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                            >
                              Deliver
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          )}

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          taskToEdit={editingTask}
        />
      )}
    </div>
  );
};
