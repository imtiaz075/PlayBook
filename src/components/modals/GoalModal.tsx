import React, { useState } from 'react';
import { X, Target, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoalType, MeasurementMethod, Priority, GoalMilestone } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose }) => {
  const { addGoal } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('income');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [targetValue, setTargetValue] = useState('6000');
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('numeric_auto');
  const [priority, setPriority] = useState<Priority>('high');
  const [notes, setNotes] = useState('');

  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; targetDate: string }>>([
    {
      id: 'm-1',
      title: 'First milestone milestone achievement',
      targetDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    },
  ]);

  if (!isOpen) return null;

  const handleAddMilestoneInput = () => {
    setMilestones((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        title: '',
        targetDate: targetDate,
      },
    ]);
  };

  const handleMilestoneChange = (index: number, field: string, val: string) => {
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
        isCompleted: false,
      }));

    addGoal({
      name: name.trim(),
      type,
      targetDate,
      targetValue: Number(targetValue) || 1,
      measurementMethod,
      priority,
      notes: notes.trim(),
      milestones: formattedMilestones,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Create Professional Goal</h2>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Goal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Earn $6,000 USD Monthly Baseline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Goal Type *</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as GoalType;
                  setType(t);
                  if (t === 'income') {
                    setTargetValue('6000');
                    setMeasurementMethod('numeric_auto');
                  } else if (t === 'work_hours') {
                    setTargetValue('100');
                    setMeasurementMethod('numeric_auto');
                  } else if (t === 'projects_count') {
                    setTargetValue('6');
                    setMeasurementMethod('milestones');
                  }
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="income">Revenue & Income</option>
                <option value="projects_count">Completed Projects Count</option>
                <option value="work_hours">Billable Work Hours</option>
                <option value="new_clients">Acquire New Clients</option>
                <option value="savings">Savings Target</option>
                <option value="learning">Skill & Learning</option>
                <option value="custom">Custom Goal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Date *</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Numeric Value *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Measurement Method
              </label>
              <select
                value={measurementMethod}
                onChange={(e) => setMeasurementMethod(e.target.value as MeasurementMethod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="numeric_auto">Automatic (from app earnings/time/tasks)</option>
                <option value="milestones">Milestone Checkpoints</option>
                <option value="manual">Manual Progress Updates</option>
              </select>
            </div>
          </div>

          {/* Milestones list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Milestone Checkpoints</span>
              <button
                type="button"
                onClick={handleAddMilestoneInput}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, index) => (
                <div key={m.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="date"
                    value={m.targetDate}
                    onChange={(e) => handleMilestoneChange(index, 'targetDate', e.target.value)}
                    className="w-32 text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Why this matters</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivation and key milestones details..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
