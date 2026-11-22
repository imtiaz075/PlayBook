import React, { useState, useEffect } from 'react';
import { TrendingUp, X, Save } from 'lucide-react';
import { BudgetIncome, BudgetType, PlanBudget } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currency';
import {
  BUDGET_TYPE_OPTIONS,
  INCOME_SOURCES_BY_TYPE,
} from '../../services/budgetCategories';

interface BudgetIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIncome: (income: Omit<BudgetIncome, 'id' | 'createdAt'>) => void;
  editingIncome?: BudgetIncome | null;
  onUpdateIncome?: (id: string, updates: Partial<BudgetIncome>) => void;
  budgets?: PlanBudget[];
  initialBudgetType?: BudgetType;
  defaultMonth?: string;
}

export const BudgetIncomeModal: React.FC<BudgetIncomeModalProps> = ({
  isOpen,
  onClose,
  onSaveIncome,
  editingIncome,
  onUpdateIncome,
  budgets = [],
  initialBudgetType = 'business',
  defaultMonth,
}) => {
  const { displayCurrency } = useApp();

  const getDefaultDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (defaultMonth && !today.startsWith(defaultMonth)) {
      return `${defaultMonth}-01`;
    }
    return today;
  };

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(displayCurrency || 'USD');
  const [budgetType, setBudgetType] = useState<BudgetType>(initialBudgetType);
  const [source, setSource] = useState(INCOME_SOURCES_BY_TYPE[initialBudgetType][0]);
  const [customSource, setCustomSource] = useState('');
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [date, setDate] = useState(getDefaultDate());
  const [budgetId, setBudgetId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingIncome) {
      const bType = editingIncome.budgetType || 'business';
      const predefined = INCOME_SOURCES_BY_TYPE[bType] || INCOME_SOURCES_BY_TYPE.business;
      const isCustom = !predefined.includes(editingIncome.source);
      setTitle(editingIncome.title || '');
      setAmount(editingIncome.amount !== undefined ? String(editingIncome.amount) : '');
      setCurrency(editingIncome.currency || displayCurrency || 'USD');
      setBudgetType(bType);
      setIsCustomSource(isCustom);
      setSource(isCustom ? predefined[0] : editingIncome.source);
      setCustomSource(isCustom ? editingIncome.source : '');
      setDate(editingIncome.date || getDefaultDate());
      setBudgetId(editingIncome.budgetId || '');
      setNotes(editingIncome.notes || '');
    } else {
      const bType = initialBudgetType || 'business';
      setTitle('');
      setAmount('');
      setCurrency(displayCurrency || 'USD');
      setBudgetType(bType);
      setIsCustomSource(false);
      setSource(INCOME_SOURCES_BY_TYPE[bType][0]);
      setCustomSource('');
      setDate(getDefaultDate());
      setBudgetId('');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingIncome, initialBudgetType, displayCurrency, defaultMonth]);

  if (!isOpen) return null;

  const sourceOptions = INCOME_SOURCES_BY_TYPE[budgetType] || INCOME_SOURCES_BY_TYPE.business;
  const scopedBudgets = budgets.filter((b) => (b.budgetType || 'business') === budgetType);

  const handleBudgetTypeChange = (nextType: BudgetType) => {
    setBudgetType(nextType);
    const nextSources = INCOME_SOURCES_BY_TYPE[nextType];
    if (!isCustomSource && !nextSources.includes(source)) {
      setSource(nextSources[0]);
    }
    if (budgetId) {
      const linked = budgets.find((b) => b.id === budgetId);
      if (linked && (linked.budgetType || 'business') !== nextType) {
        setBudgetId('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;

    const finalSource = isCustomSource ? customSource.trim() || 'Other Income' : source;

    const payload: Omit<BudgetIncome, 'id' | 'createdAt'> = {
      title: title.trim(),
      amount: numericAmount,
      currency,
      budgetType,
      source: finalSource,
      budgetId: budgetId || undefined,
      date,
      notes: notes.trim() || undefined,
    };

    if (editingIncome && onUpdateIncome) {
      onUpdateIncome(editingIncome.id, payload);
    } else {
      onSaveIncome(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingIncome ? 'Edit Recorded Income' : 'Record Income'}
              </h2>
              <p className="text-xs text-slate-500">
                Add business, personal, or home income to track monthly cash flow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Budget Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Budget Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleBudgetTypeChange(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    budgetType === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Income Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                budgetType === 'business'
                  ? 'e.g. Monthly Retainer Deposit'
                  : budgetType === 'home'
                  ? 'e.g. Household Contribution'
                  : 'e.g. Personal Profit Draw'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={currency === 'PKR' ? 'e.g. 150000' : 'e.g. 2500'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (Rs)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USDT">USDT</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="AUD">AUD (AU$)</option>
                <option value="INR">INR (₹)</option>
                <option value="BDT">BDT (৳)</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Income Source</label>
                <button
                  type="button"
                  onClick={() => setIsCustomSource(!isCustomSource)}
                  className="text-[11px] text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  {isCustomSource ? 'Use list' : '+ Custom'}
                </button>
              </div>
              {isCustomSource ? (
                <input
                  type="text"
                  required
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Enter custom source..."
                  className="w-full px-3 py-2 text-xs border border-emerald-300 bg-emerald-50/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              ) : (
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {sourceOptions.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Received</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {scopedBudgets.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link to Budget Plan <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Auto-match by month & scope</option>
                {scopedBudgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({formatCurrency(b.totalPlannedBudget, b.currency || 'USD')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Transfer reference or details..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs"
            >
              <Save size={14} />
              <span>{editingIncome ? 'Save Changes' : 'Record Income'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
