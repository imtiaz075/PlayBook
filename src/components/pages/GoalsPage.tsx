import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Briefcase,
  User,
  Trash2,
  Edit,
  AlertTriangle,
  Check,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goal, GoalCategory } from '../../types';
import { CountdownBadge } from '../common/CountdownBadge';
import { InfoTooltip } from '../common/Tooltip';
import { GoalModal } from '../modals/GoalModal';

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
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const [newMilestoneGoalId, setNewMilestoneGoalId] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-calculated progress for dynamic goals
  const calculatedGoals = goals.map((goal) => {
    let progressPct = goal.progressPercentage || 0;

    if (goal.measurementMethod === 'milestones' && goal.milestones && goal.milestones.length > 0) {
      const doneCount = goal.milestones.filter((m) => m.isCompleted).length;
      progressPct = Math.round((doneCount / goal.milestones.length) * 100);
    }

    const isOverdue = !goal.isCompleted && goal.targetDate < todayStr;

    return {
      ...goal,
      progressPct,
      isOverdue,
    };
  });

  const filteredGoals = calculatedGoals.filter((g) => {
    if (categoryFilter === 'all') return true;
    return g.category === categoryFilter;
  });

  // Statistics
  const activeCount = calculatedGoals.filter((g) => !g.isCompleted && g.status !== 'completed').length;
  const completedCount = calculatedGoals.filter((g) => g.isCompleted || g.status === 'completed' || g.progressPct >= 100).length;
  const milestonesDoneCount = goals.flatMap((g) => g.milestones || []).filter((m) => m.isCompleted).length;
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
      milestones: [...(targetGoal.milestones || []), newM],
    });

    setMilestoneTitle('');
    setNewMilestoneGoalId(null);
  };

  const confirmDeleteGoal = () => {
    if (deletingGoalId) {
      deleteGoal(deletingGoalId);
      setDeletingGoalId(null);
    }
  };

  const categoryIconMap: Record<string, React.ReactNode> = {
    learning: <BookOpen size={16} className="text-blue-600" />,
    achievements: <Award size={16} className="text-amber-600" />,
    career: <Briefcase size={16} className="text-purple-600" />,
    personal: <User size={16} className="text-emerald-600" />,
    custom: <Sparkles size={16} className="text-indigo-600" />,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Personal & Professional Goals
          </h1>
          <InfoTooltip content="Personal & career growth workspace centered around learning, achievements, certifications, and habit milestones." />
        </div>

        <button
          onClick={onOpenNewGoal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-xs"
        >
          <Plus size={15} />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* A. Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-purple-600 font-semibold">Active Goals</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {activeCount}
          </p>
          <span className="text-[10px] text-slate-400">in progress</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-emerald-600 font-semibold">Completed Achievements</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {completedCount}
          </p>
          <span className="text-[10px] text-slate-400">goals achieved</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-blue-600 font-semibold">Completed Milestones</span>
          <p className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">
            {milestonesDoneCount}
          </p>
          <span className="text-[10px] text-slate-400">action steps</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-rose-600 font-semibold">Overdue Goals</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {overdueCount}
          </p>
          <span className="text-[10px] text-slate-400">past target date</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'learning', label: 'Learning & Skills' },
          { id: 'achievements', label: 'Achievements & Certs' },
          { id: 'career', label: 'Career & Business' },
          { id: 'personal', label: 'Personal Development' },
          { id: 'custom', label: 'Custom Goals' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all shrink-0 ${
              categoryFilter === tab.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Target size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No goals found for this category.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Create New Goal" to set a learning objective, certification target, or habit milestone.
            </p>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            return (
              <div
                key={goal.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Category Badge & Controls */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        {categoryIconMap[goal.category] || <Sparkles size={16} className="text-purple-600" />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {goal.customCategoryName || goal.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CountdownBadge deadline={goal.targetDate} />
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg transition-colors"
                        title="Edit goal"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingGoalId(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {goal.name}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{goal.description}</p>
                  )}
                  {goal.reason && (
                    <p className="text-[11px] text-purple-700 font-medium italic mt-1">
                      Reason: "{goal.reason}"
                    </p>
                  )}

                  {/* Visual Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Progress</span>
                      <span className="font-mono font-bold text-purple-600">
                        {goal.progressPct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${goal.progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          goal.progressPct >= 100 ? 'bg-emerald-500' : 'bg-purple-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Milestones / Steps */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Milestone Steps ({goal.milestones.filter((m) => m.isCompleted).length}/
                          {goal.milestones.length})
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => toggleMilestone(goal.id, m.id)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200 cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                  m.isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {m.isCompleted && <Check size={11} />}
                              </span>
                              <span
                                className={`truncate font-medium ${
                                  m.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {m.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                              {m.targetDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Quick Milestone Input */}
                  {newMilestoneGoalId === goal.id ? (
                    <div className="mt-3 p-2 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        placeholder="Milestone title..."
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="date"
                          value={milestoneDate}
                          onChange={(e) => setMilestoneDate(e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white font-mono"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setNewMilestoneGoalId(null)}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddMilestone(goal.id)}
                            className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNewMilestoneGoalId(goal.id)}
                      className="mt-3 text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Quick Milestone
                    </button>
                  )}
                </div>

                {/* Card Footer */}
                {goal.notes && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    Notes: {goal.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <GoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          editingGoal={editingGoal}
        />
      )}

      {/* Delete Goal Confirmation Modal */}
      {deletingGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Goal</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this goal and its recorded milestones? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingGoalId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGoal}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
