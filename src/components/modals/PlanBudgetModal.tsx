import React, { useState } from 'react';
import { Wallet, X, Plus, Trash2, Save } from 'lucide-react';
import { PlanBudget, BudgetCategoryAllocation } from '../../types';

interface PlanBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlanBudget: (budget: Omit<PlanBudget, 'id' | 'createdAt'>) => void;
  editingBudget?: PlanBudget | null;
  onUpdatePlanBudget?: (id: string, updates: Partial<PlanBudget>) => void;
}

const PREDEFINED_CATEGORIES = [
  'Rent & Housing',
  'Food & Groceries',
  'Transportation',
  'Utilities',
  'Internet & Mobile',
  'Business Expenses',
  'Software & Subscriptions',
  'Equipment & Supplies',
  'Marketing & Advertising',
  'Education & Courses',
  'Health & Medical',
  'Savings',
  'Entertainment',
  'Taxes',
  'Other',
];

export const PlanBudgetModal: React.FC<PlanBudgetModalProps> = ({
  isOpen,
  onClose,
  onSavePlanBudget,
  editingBudget,
  onUpdatePlanBudget,
}) => {
  const [name, setName] = useState(editingBudget?.name || 'Monthly Operating Budget');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>(
    editingBudget?.period || 'monthly'
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(editingBudget?.startDate || todayStr);
  const [endDate, setEndDate] = useState(
    editingBudget?.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState(editingBudget?.currency || 'USD');
  const [notes, setNotes] = useState(editingBudget?.notes || '');

  const [allocations, setAllocations] = useState<BudgetCategoryAllocation[]>(
    editingBudget?.categoryAllocations || [
      { category: 'Rent & Housing', plannedAmount: 1200 },
      { category: 'Food & Groceries', plannedAmount: 400 },
      { category: 'Software & Subscriptions', plannedAmount: 150 },
      { category: 'Savings', plannedAmount: 500 },
    ]
  );

  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');

  if (!isOpen) return null;

  const totalPlanned = allocations.reduce((sum, a) => sum + Number(a.plannedAmount || 0), 0);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const amount = parseFloat(newCatAmount) || 0;
    setAllocations((prev) => [...prev, { category: newCatName.trim(), plannedAmount: amount }]);
    setNewCatName('');
    setNewCatAmount('');
  };

  const handleRemoveCategory = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, amount: number) => {
    setAllocations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, plannedAmount: amount } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingBudget && onUpdatePlanBudget) {
      onUpdatePlanBudget(editingBudget.id, {
        name: name.trim(),
        period,
        startDate,
        endDate,
        currency,
        totalPlannedBudget: totalPlanned,
        categoryAllocations: allocations,
        notes: notes.trim(),
      });
    } else {
      onSavePlanBudget({
        name: name.trim(),
        period,
        startDate,
        endDate,
        currency,
        totalPlannedBudget: totalPlanned,
        categoryAllocations: allocations,
        notes: notes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingBudget ? 'Edit Plan Budget' : 'Plan Budget'}
              </h2>
              <p className="text-xs text-slate-500">
                Allocate planned budget targets across custom expense categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Budget Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Master Freelance Budget"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom')
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USDT">USDT (₮)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Planned Allocations
              </label>
              <div className="w-full px-3 py-2 text-xs border border-purple-200 bg-purple-50 font-bold font-mono text-purple-900 rounded-xl">
                {currency} {totalPlanned.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category Allocations Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Category Allocations
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {allocations.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <span className="font-semibold text-slate-800 flex-1 truncate">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 font-mono">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.plannedAmount}
                      onChange={(e) => handleUpdateAllocation(index, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg text-right font-mono font-bold focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Category Allocation Row */}
            <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-purple-50/50 border border-purple-200 rounded-xl">
              <select
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select or type category...</option>
                {PREDEFINED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or custom category name"
                value={newCatName.includes('Select') ? '' : newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full sm:w-1/3 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newCatAmount}
                onChange={(e) => setNewCatAmount(e.target.value)}
                className="w-full sm:w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center gap-1 shrink-0"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Budget notes, assumptions, or savings priorities..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-xs"
            >
              <Save size={14} />
              <span>{editingBudget ? 'Save Changes' : 'Save Plan Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
