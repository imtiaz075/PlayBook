import React, { useState, useEffect } from 'react';
import { X, Target, Plus, Trash2, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goal, GoalCategory, MeasurementMethod, Priority, GoalMilestone } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, editingGoal }) => {
  const { addGoal, updateGoal } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const in30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('learning');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [targetDate, setTargetDate] = useState(in30DaysStr);
  const [priority, setPriority] = useState<Priority>('high');
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('milestones');
  const [targetValue, setTargetValue] = useState<string>('100');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled'>('in_progress');
  const [notes, setNotes] = useState('');

  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; targetDate: string; isCompleted: boolean }>>([
    {
      id: 'm-1',
      title: 'Complete initial learning module',
      targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      isCompleted: false,
    },
  ]);

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name || '');
      setCategory(editingGoal.category || 'learning');
      setCustomCategoryName(editingGoal.customCategoryName || '');
      setDescription(editingGoal.description || '');
      setReason(editingGoal.reason || '');
      setStartDate(editingGoal.startDate || todayStr);
      setTargetDate(editingGoal.targetDate || in30DaysStr);
      setPriority(editingGoal.priority || 'high');
      setMeasurementMethod(editingGoal.measurementMethod || 'milestones');
      setTargetValue(editingGoal.targetValue ? String(editingGoal.targetValue) : '100');
      setProgressPercentage(editingGoal.progressPercentage || 0);
      setStatus(editingGoal.status || 'in_progress');
      setNotes(editingGoal.notes || '');
      setMilestones(
        editingGoal.milestones
          ? editingGoal.milestones.map((m) => ({ ...m }))
          : []
      );
    } else {
      setName('');
      setCategory('learning');
      setCustomCategoryName('');
      setDescription('');
      setReason('');
      setStartDate(todayStr);
      setTargetDate(in30DaysStr);
      setPriority('high');
      setMeasurementMethod('milestones');
      setTargetValue('100');
      setProgressPercentage(0);
      setStatus('in_progress');
      setNotes('');
      setMilestones([
        {
          id: 'm-1',
          title: 'Complete initial learning milestone',
          targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          isCompleted: false,
        },
      ]);
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestoneInput = () => {
    setMilestones((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        title: '',
        targetDate: targetDate,
        isCompleted: false,
      },
    ]);
  };

  const handleMilestoneChange = (index: number, field: string, val: any) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedMilestones: GoalMilestone[] = milestones
      .filter((m) => m.title.trim().length > 0)
      .map((m) => ({
        id: m.id,
        title: m.title.trim(),
        targetDate: m.targetDate,
        isCompleted: m.isCompleted || false,
      }));

    // Auto-calculate progress percentage if milestones exist
    let calcProgress = progressPercentage;
    if (measurementMethod === 'milestones' && formattedMilestones.length > 0) {
      const doneCount = formattedMilestones.filter((m) => m.isCompleted).length;
      calcProgress = Math.round((doneCount / formattedMilestones.length) * 100);
    }

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name: name.trim(),
        category,
        customCategoryName: category === 'custom' ? customCategoryName.trim() : undefined,
        description: description.trim() || undefined,
        reason: reason.trim() || undefined,
        startDate,
        targetDate,
        priority,
        measurementMethod,
        targetValue: Number(targetValue) || 100,
        progressPercentage: calcProgress,
        status,
        isCompleted: status === 'completed' || calcProgress >= 100,
        notes: notes.trim() || undefined,
        milestones: formattedMilestones,
      });
    } else {
      addGoal({
        name: name.trim(),
        category,
        customCategoryName: category === 'custom' ? customCategoryName.trim() : undefined,
        description: description.trim() || undefined,
        reason: reason.trim() || undefined,
        startDate,
        targetDate,
        priority,
        measurementMethod,
        targetValue: Number(targetValue) || 100,
        progressPercentage: calcProgress,
        status,
        notes: notes.trim() || undefined,
        milestones: formattedMilestones,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingGoal ? 'Edit Growth & Success Goal' : 'Create Personal & Professional Goal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Goal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Advanced TypeScript & Full-Stack Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="learning">Learning & Skill Master</option>
                <option value="achievements">Achievements & Certifications</option>
                <option value="career">Career & Business Success</option>
                <option value="personal">Personal Development & Habits</option>
                <option value="custom">Custom Goal Category</option>
              </select>
            </div>

            {category === 'custom' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Public Speaking"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description & Reason for Pursuing</label>
            <textarea
              rows={2}
              placeholder="Why is achieving this goal important for your career or personal growth?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Measurement Method</label>
                <select
                  value={measurementMethod}
                  onChange={(e) => setMeasurementMethod(e.target.value as MeasurementMethod)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="milestones">Milestone Steps</option>
                  <option value="manual">Manual Progress %</option>
                  <option value="numeric_auto">Numeric Target</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Goal Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {measurementMethod === 'manual' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Progress Percentage ({progressPercentage}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Milestones List */}
          {measurementMethod === 'milestones' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Key Milestones / Steps ({milestones.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddMilestoneInput}
                  className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {milestones.map((m, index) => (
                  <div key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={m.isCompleted}
                      onChange={(e) => handleMilestoneChange(index, 'isCompleted', e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      placeholder="Milestone action step..."
                      value={m.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      type="date"
                      value={m.targetDate}
                      onChange={(e) => handleMilestoneChange(index, 'targetDate', e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes & Achievements Log</label>
            <textarea
              rows={2}
              placeholder="Record notes, accomplishments, resources, or certificates gained..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs transition-colors"
            >
              <Save size={14} />
              <span>{editingGoal ? 'Save Changes' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
