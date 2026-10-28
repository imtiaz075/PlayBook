import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Award,
  Check,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goal, GoalType, Priority } from '../../types';
import { formatCurrency } from '../../services/currency';
import { CountdownBadge } from '../common/CountdownBadge';
import { InfoTooltip } from '../common/Tooltip';

interface GoalsPageProps {
  onOpenNewGoal: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onOpenNewGoal }) => {
  const {
    goals,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    payments,
    tasks,
    timeEntries,
    displayCurrency,
  } = useApp();

  const [filterType, setFilterType] = useState<string>('all');
  const [newMilestoneGoalId, setNewMilestoneGoalId] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-calculated progress for dynamic goals
  const calculatedGoals = goals.map((goal) => {
    let actual = goal.currentActualValue;

    if (goal.measurementMethod === 'numeric_auto') {
      if (goal.type === 'income') {
        actual = payments.reduce((sum, p) => sum + p.amount, 0);
      } else if (goal.type === 'projects_count') {
        actual = tasks.filter((t) => t.status === 'completed').length;
      } else if (goal.type === 'work_hours') {
        const totalSecs = timeEntries.reduce((sum, te) => sum + te.durationSeconds, 0);
        actual = Math.round(totalSecs / 3600);
      }
    }

    let progressPct = 0;
    if (goal.measurementMethod === 'milestones') {
      const totalMilestones = goal.milestones.length;
      const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
      progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    } else {
      progressPct = goal.targetValue > 0 ? Math.min(100, Math.round((actual / goal.targetValue) * 100)) : 0;
    }

    const isOverdue = !goal.isCompleted && goal.targetDate < todayStr;
    const daysRemaining = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );

    return {
      ...goal,
      calculatedActual: actual,
      progressPct,
      isOverdue,
      daysRemaining,
    };
  });

  const filteredGoals = calculatedGoals.filter((g) => {
    if (filterType === 'all') return true;
    return g.type === filterType;
  });

  // Statistics
  const activeCount = calculatedGoals.filter((g) => !g.isCompleted).length;
  const completedCount = calculatedGoals.filter((g) => g.isCompleted || g.progressPct >= 100).length;
  const milestonesDoneCount = goals.flatMap((g) => g.milestones).filter((m) => m.isCompleted).length;
  const overdueCount = calculatedGoals.filter((g) => g.isOverdue).length;

  const handleAddMilestone = (goalId: string) => {
    if (!milestoneTitle.trim()) return;
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const newM = {
      id: `m-${Date.now()}`,
      title: milestoneTitle.trim(),
      targetDate: milestoneDate,
      isCompleted: false,
    };

    updateGoal(goalId, {
      milestones: [...targetGoal.milestones, newM],
    });

    setMilestoneTitle('');
    setNewMilestoneGoalId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Goals
          </h1>
          <InfoTooltip content="Set professional objectives, revenue targets, and milestone checkpoints." />
        </div>

        <button
          onClick={onOpenNewGoal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-indigo-600 font-semibold">Active Goals</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {activeCount}
          </p>
          <span className="text-[10px] text-slate-400">in progress</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-emerald-600 font-semibold">Completed Goals</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {completedCount}
          </p>
          <span className="text-[10px] text-slate-400">achieved</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-purple-600 font-semibold">Milestones Done</span>
          <p className="text-2xl font-bold text-purple-600 font-mono tabular-nums mt-1">
            {milestonesDoneCount}
          </p>
          <span className="text-[10px] text-slate-400">checkpoints hit</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-rose-600 font-semibold">Overdue Goals</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {overdueCount}
          </p>
          <span className="text-[10px] text-slate-400">past target date</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs text-xs font-medium transition-all duration-200 hover:shadow-md hover:border-slate-300">
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'income', label: 'Revenue & Income' },
          { id: 'projects_count', label: 'Project Count' },
          { id: 'work_hours', label: 'Billable Hours' },
          { id: 'savings', label: 'Savings Targets' },
          { id: 'learning', label: 'Learning & Skills' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Target size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-700">No goals found for this category</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click "+ Add New Goal" to establish targets.
            </p>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
            const totalMilestones = goal.milestones.length;

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-slate-300 flex flex-col justify-between bg-white ${
                  goal.isOverdue
                    ? 'border-rose-300 shadow-xs'
                    : goal.progressPct >= 100
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {goal.type.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <CountdownBadge
                        deadline={goal.targetDate}
                        isCompleted={goal.isCompleted || goal.progressPct >= 100}
                        compact
                      />
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {goal.targetDate}
                      </span>
                    </div>
                  </div>

                  {/* Goal Name */}
                  <h3 className="text-base font-bold text-slate-900">{goal.name}</h3>
                  {goal.notes && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{goal.notes}</p>
                  )}

                  {/* Progress Gauge */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">
                        {goal.measurementMethod === 'numeric_auto'
                          ? `Progress (${goal.calculatedActual} / ${goal.targetValue})`
                          : `Milestones (${completedMilestones} / ${totalMilestones})`}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {goal.progressPct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${goal.progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          goal.progressPct >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Milestones Checklist</span>
                      <button
                        onClick={() => setNewMilestoneGoalId(goal.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Milestone
                      </button>
                    </div>

                    {goal.milestones.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No milestones defined yet.</p>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => toggleMilestone(goal.id, m.id)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-2 text-xs ${
                              m.isCompleted
                                ? 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  m.isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {m.isCompleted && <Check size={11} strokeWidth={3} />}
                              </div>
                              <span className="truncate">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <CountdownBadge
                                deadline={m.targetDate}
                                isCompleted={m.isCompleted}
                                compact
                              />
                              <span className="text-[10px] text-slate-400 font-mono">
                                {m.targetDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Measurement: {goal.measurementMethod.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Milestone Sub-Modal */}
      {newMilestoneGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Add Goal Milestone</h3>
              <button
                onClick={() => setNewMilestoneGoalId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Phase 1 deliverable"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNewMilestoneGoalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddMilestone(newMilestoneGoalId)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
