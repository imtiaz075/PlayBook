import React, { useState, useEffect } from 'react';
import { Wallet, X, Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { PlanBudget, BudgetCategoryAllocation, BudgetType } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, CURRENCY_SYMBOLS } from '../../services/currency';
import {
  BUDGET_TYPE_OPTIONS,
  BUSINESS_BUDGET_CATEGORIES,
  PERSONAL_BUDGET_CATEGORIES,
  HOME_BUDGET_CATEGORIES,
  getCategoriesForBudgetType,
} from '../../services/budgetCategories';

interface PlanBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlanBudget: (budget: Omit<PlanBudget, 'id' | 'createdAt'>) => void;
  editingBudget?: PlanBudget | null;
  onUpdatePlanBudget?: (id: string, updates: Partial<PlanBudget>) => void;
  defaultMonth?: string; // YYYY-MM
  initialBudgetType?: BudgetType;
}

const getMonthBounds = (ym: string) => {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = Number(mStr) || new Date().getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const paddedMonth = String(m).padStart(2, '0');
  return {
    startDate: `${y}-${paddedMonth}-01`,
    endDate: `${y}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`,
  };
};

const formatMonthTitle = (ym: string, bType: BudgetType = 'business') => {
  const scopeLabel = bType === 'business' ? 'Business' : bType === 'personal' ? 'Personal' : 'Home';
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return `Monthly ${scopeLabel} Budget`;
  return `${new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })} ${scopeLabel} Budget`;
};

export const PlanBudgetModal: React.FC<PlanBudgetModalProps> = ({
  isOpen,
  onClose,
  onSavePlanBudget,
  editingBudget,
  onUpdatePlanBudget,
  defaultMonth,
  initialBudgetType = 'business',
}) => {
  const { displayCurrency } = useApp();
  const currentMonth = defaultMonth || new Date().toISOString().substring(0, 7);

  const [budgetType, setBudgetType] = useState<BudgetType>(initialBudgetType);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [name, setName] = useState(formatMonthTitle(currentMonth, initialBudgetType));
  const [nameTouched, setNameTouched] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [currency, setCurrency] = useState(displayCurrency || 'USD');
  const [startDate, setStartDate] = useState(getMonthBounds(currentMonth).startDate);
  const [endDate, setEndDate] = useState(getMonthBounds(currentMonth).endDate);
  const [notes, setNotes] = useState('');
  const [allocations, setAllocations] = useState<BudgetCategoryAllocation[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [isCustomNewCat, setIsCustomNewCat] = useState(false);
  const [customNewCatName, setCustomNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const baseMonth = defaultMonth || new Date().toISOString().substring(0, 7);
    if (editingBudget) {
      const editMonth = editingBudget.startDate?.substring(0, 7) || baseMonth;
      const editType: BudgetType = editingBudget.budgetType || 'business';
      const existingAllocs = Array.isArray(editingBudget.categoryAllocations)
        ? editingBudget.categoryAllocations
        : [];
      setBudgetType(editType);
      setSelectedMonth(editMonth);
      setPeriod(editingBudget.period || 'monthly');
      setName(editingBudget.name || formatMonthTitle(editMonth, editType));
      setNameTouched(true);
      setMonthlyLimit(
        editingBudget.totalPlannedBudget !== undefined
          ? String(editingBudget.totalPlannedBudget)
          : ''
      );
      setCurrency(editingBudget.currency || displayCurrency || 'USD');
      setStartDate(editingBudget.startDate || getMonthBounds(editMonth).startDate);
      setEndDate(editingBudget.endDate || getMonthBounds(editMonth).endDate);
      setNotes(editingBudget.notes || '');
      setAllocations(existingAllocs);
      setShowCategories(existingAllocs.length > 0);
    } else {
      const baseType: BudgetType = initialBudgetType || 'business';
      const bounds = getMonthBounds(baseMonth);
      setBudgetType(baseType);
      setSelectedMonth(baseMonth);
      setPeriod('monthly');
      setName(formatMonthTitle(baseMonth, baseType));
      setNameTouched(false);
      setMonthlyLimit('');
      setCurrency(displayCurrency || 'USD');
      setStartDate(bounds.startDate);
      setEndDate(bounds.endDate);
      setNotes('');
      setAllocations([]);
      setShowCategories(false);
    }
    setNewCatName('');
    setIsCustomNewCat(false);
    setCustomNewCatName('');
    setNewCatAmount('');
  }, [editingBudget, isOpen, displayCurrency, defaultMonth, initialBudgetType]);

  if (!isOpen) return null;

  const allocationsTotal = allocations.reduce((sum, a) => sum + Number(a.plannedAmount || 0), 0);
  const parsedLimit = parseFloat(monthlyLimit);
  const effectiveBudgetTotal =
    !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : allocationsTotal;

  const handleBudgetTypeChange = (nextType: BudgetType) => {
    setBudgetType(nextType);
    if (!nameTouched && !editingBudget) {
      setName(formatMonthTitle(selectedMonth, nextType));
    }
  };

  const handleMonthChange = (nextMonth: string) => {
    setSelectedMonth(nextMonth);
    const bounds = getMonthBounds(nextMonth);
    setStartDate(bounds.startDate);
    setEndDate(bounds.endDate);
    if (!nameTouched && !editingBudget) {
      setName(formatMonthTitle(nextMonth, budgetType));
    }
  };

  const handleAddCategory = () => {
    const resolvedCat = isCustomNewCat ? customNewCatName.trim() : newCatName.trim();
    if (!resolvedCat) return;
    const amount = parseFloat(newCatAmount) || 0;
    const nextAllocs = [...allocations, { category: resolvedCat, plannedAmount: amount }];
    setAllocations(nextAllocs);
    if (!monthlyLimit || Number(monthlyLimit) === allocationsTotal) {
      const nextSum = nextAllocs.reduce((s, a) => s + Number(a.plannedAmount || 0), 0);
      setMonthlyLimit(String(nextSum));
    }
    setNewCatName('');
    setCustomNewCatName('');
    setIsCustomNewCat(false);
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
    if (!name.trim() || effectiveBudgetTotal <= 0) return;

    const bounds = period === 'monthly' ? getMonthBounds(selectedMonth) : { startDate, endDate };

    const payload = {
      name: name.trim(),
      budgetType,
      period,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      currency,
      totalPlannedBudget: effectiveBudgetTotal,
      categoryAllocations: allocations,
      notes: notes.trim() || undefined,
    };

    if (editingBudget && onUpdatePlanBudget) {
      onUpdatePlanBudget(editingBudget.id, payload);
    } else {
      onSavePlanBudget(payload);
    }
    onClose();
  };

  const activeScopeCategories = getCategoriesForBudgetType(budgetType);
  const otherGroups = BUDGET_TYPE_OPTIONS.filter((o) => o.value !== budgetType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget Limit'}
              </h2>
              <p className="text-xs text-slate-500">
                Set Business, Personal, or Home limits to track expenses and remaining balance
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
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Section: Monthly Limit, Currency & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Budget Limit ({CURRENCY_SYMBOLS[currency] || currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder={currency === 'PKR' ? 'e.g. 50000' : 'e.g. 2000'}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {period === 'monthly' ? 'Budget Month' : 'Period'}
              </label>
              {period === 'monthly' ? (
                <input
                  type="month"
                  required
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              ) : (
                <select
                  value={period}
                  onChange={(e) =>
                    setPeriod(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom')
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Budget Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameTouched(true);
                }}
                placeholder="e.g. November 2026 Business Budget"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {period !== 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Optional Cycle Switch & Category Breakdown Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              {showCategories ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>
                Category Limits (Optional){allocations.length > 0 ? ` · ${allocations.length} added` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod(period === 'monthly' ? 'custom' : 'monthly')}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              {period === 'monthly' ? 'Use custom date range' : 'Switch to monthly picker'}
            </button>
          </div>

          {/* Optional Category Allocations Section */}
          {showCategories && (
            <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {allocations.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {allocations.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-semibold text-slate-800 flex-1 truncate">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 font-mono">
                          {CURRENCY_SYMBOLS[currency] || currency}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.plannedAmount}
                          onChange={(e) => handleUpdateAllocation(index, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-md text-right font-mono font-bold focus:ring-2 focus:ring-purple-500"
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
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2">
                {isCustomNewCat ? (
                  <div className="flex items-center gap-1.5 w-full sm:flex-1">
                    <input
                      type="text"
                      value={customNewCatName}
                      onChange={(e) => setCustomNewCatName(e.target.value)}
                      placeholder="Custom category name..."
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomNewCat(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 shrink-0"
                    >
                      List
                    </button>
                  </div>
                ) : (
                  <select
                    value={newCatName}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomNewCat(true);
                        setNewCatName('');
                      } else {
                        setNewCatName(e.target.value);
                      }
                    }}
                    className="w-full sm:flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select category...</option>
                    <optgroup
                      label={
                        BUDGET_TYPE_OPTIONS.find((o) => o.value === budgetType)?.label || 'Selected Scope'
                      }
                    >
                      {activeScopeCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    {otherGroups.map((group) => {
                      const cats =
                        group.value === 'business'
                          ? BUSINESS_BUDGET_CATEGORIES
                          : group.value === 'personal'
                          ? PERSONAL_BUDGET_CATEGORIES
                          : HOME_BUDGET_CATEGORIES;
                      return (
                        <optgroup key={group.value} label={group.label}>
                          {cats.map((c) => (
                            <option key={`${group.value}-${c}`} value={c}>
                              {c}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    <option value="__custom__">+ Custom Category...</option>
                  </select>
                )}

                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Amount"
                  value={newCatAmount}
                  onChange={(e) => setNewCatAmount(e.target.value)}
                  className="w-full sm:w-28 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {allocations.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Category splits sum:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(allocationsTotal, currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional budget notes..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
              <span>{editingBudget ? 'Save Changes' : 'Save Monthly Limit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
