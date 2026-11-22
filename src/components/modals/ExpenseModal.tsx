import React, { useState, useEffect } from 'react';
import { CreditCard, X, Save, AlertTriangle, Wallet } from 'lucide-react';
import { Expense, PlanBudget, BudgetType } from '../../types';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { useApp } from '../../context/AppContext';
import {
  ALL_BUDGET_CATEGORIES,
  BUDGET_TYPE_OPTIONS,
  BUSINESS_BUDGET_CATEGORIES,
  PERSONAL_BUDGET_CATEGORIES,
  HOME_BUDGET_CATEGORIES,
  getCategoriesForBudgetType,
  inferBudgetTypeFromCategory,
} from '../../services/budgetCategories';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  editingExpense?: Expense | null;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
  budgets?: PlanBudget[];
  initialBudgetType?: BudgetType;
  defaultMonth?: string;
}

export const PREDEFINED_EXPENSE_CATEGORIES = ALL_BUDGET_CATEGORIES;

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  editingExpense,
  onUpdateExpense,
  budgets = [],
  initialBudgetType = 'business',
  defaultMonth,
}) => {
  const { displayCurrency, expenses, ratesData } = useApp();

  const getDefaultDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (defaultMonth && !today.startsWith(defaultMonth)) {
      return `${defaultMonth}-01`;
    }
    return today;
  };

  const [budgetType, setBudgetType] = useState<BudgetType>(initialBudgetType);
  const [title, setTitle] = useState(editingExpense?.title || '');
  const [amount, setAmount] = useState<string>(editingExpense ? String(editingExpense.amount) : '');
  const [currency, setCurrency] = useState(editingExpense?.currency || displayCurrency || 'USD');
  const [category, setCategory] = useState(editingExpense?.category || getCategoriesForBudgetType(initialBudgetType)[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [date, setDate] = useState(editingExpense?.date || getDefaultDate());
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.paymentMethod || 'Credit Card');
  const [budgetId, setBudgetId] = useState(editingExpense?.budgetId || '');
  const [isRecurring, setIsRecurring] = useState(editingExpense?.isRecurring || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(
    editingExpense?.recurrenceFrequency || 'monthly'
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(editingExpense?.nextRenewalDate || '');
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [receiptAttachment, setReceiptAttachment] = useState(editingExpense?.receiptAttachment || '');

  useEffect(() => {
    if (!isOpen) return;
    const tStr = getDefaultDate();
    if (editingExpense) {
      const cat = editingExpense.category || 'Business Expenses';
      const resolvedType: BudgetType =
        editingExpense.budgetType || inferBudgetTypeFromCategory(cat);
      const custom = !ALL_BUDGET_CATEGORIES.includes(cat);
      setBudgetType(resolvedType);
      setTitle(editingExpense.title || '');
      setAmount(editingExpense.amount !== undefined ? String(editingExpense.amount) : '');
      setCurrency(editingExpense.currency || displayCurrency || 'USD');
      setIsCustom(custom);
      setCategory(custom ? getCategoriesForBudgetType(resolvedType)[0] : cat);
      setCustomCategory(custom ? cat : '');
      setDate(editingExpense.date || tStr);
      setPaymentMethod(editingExpense.paymentMethod || 'Credit Card');
      setBudgetId(editingExpense.budgetId || '');
      setIsRecurring(Boolean(editingExpense.isRecurring));
      setRecurrenceFrequency(editingExpense.recurrenceFrequency || 'monthly');
      setNextRenewalDate(editingExpense.nextRenewalDate || '');
      setNotes(editingExpense.notes || '');
      setReceiptAttachment(editingExpense.receiptAttachment || '');
    } else {
      const resolvedType = initialBudgetType || 'business';
      setBudgetType(resolvedType);
      setTitle('');
      setAmount('');
      setCurrency(displayCurrency || 'USD');
      setIsCustom(false);
      setCategory(getCategoriesForBudgetType(resolvedType)[0]);
      setCustomCategory('');
      setDate(tStr);
      setPaymentMethod('Credit Card');
      setBudgetId('');
      setIsRecurring(false);
      setRecurrenceFrequency('monthly');
      setNextRenewalDate('');
      setNotes('');
      setReceiptAttachment('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingExpense, isOpen, displayCurrency, initialBudgetType, defaultMonth]);

  if (!isOpen) return null;

  const handleBudgetTypeChange = (nextType: BudgetType) => {
    setBudgetType(nextType);
    const scopedCats = getCategoriesForBudgetType(nextType);
    if (!isCustom && !scopedCats.includes(category)) {
      setCategory(scopedCats[0]);
    }
    if (budgetId) {
      const linked = budgets.find((b) => b.id === budgetId);
      if (linked && (linked.budgetType || 'business') !== nextType) {
        setBudgetId('');
      }
    }
  };

  const handleCategoryChange = (nextCat: string) => {
    setCategory(nextCat);
    if (BUSINESS_BUDGET_CATEGORIES.includes(nextCat)) {
      setBudgetType('business');
    } else if (PERSONAL_BUDGET_CATEGORIES.includes(nextCat)) {
      setBudgetType('personal');
    } else if (HOME_BUDGET_CATEGORIES.includes(nextCat)) {
      setBudgetType('home');
    }
  };

  // Match explicitly selected budget plan or the monthly budget covering this expense date + scope
  const matchedBudget =
    (budgetId ? budgets.find((b) => b.id === budgetId) : undefined) ||
    budgets.find(
      (b) =>
        (b.budgetType || 'business') === budgetType &&
        Boolean(b.startDate && b.endDate && date >= b.startDate && date <= b.endDate)
    );

  const budgetRemainingPreview = matchedBudget
    ? (() => {
        const planCurr = matchedBudget.currency || 'USD';
        const planScope: BudgetType = matchedBudget.budgetType || 'business';
        const limitInDisplay = convertCurrency(
          matchedBudget.totalPlannedBudget || 0,
          planCurr,
          displayCurrency,
          ratesData.rates
        );
        const alreadySpentInDisplay = expenses
          .filter((e) => {
            if (editingExpense && e.id === editingExpense.id) return false;
            if (e.budgetId) return e.budgetId === matchedBudget.id;
            const expScope: BudgetType = e.budgetType || inferBudgetTypeFromCategory(e.category);
            if (expScope !== planScope) return false;
            return Boolean(
              matchedBudget.startDate &&
                matchedBudget.endDate &&
                e.date >= matchedBudget.startDate &&
                e.date <= matchedBudget.endDate
            );
          })
          .reduce(
            (sum, e) => sum + convertCurrency(e.amount || 0, e.currency || 'USD', displayCurrency, ratesData.rates),
            0
          );
        const currentAmtInDisplay = convertCurrency(
          parseFloat(amount) || 0,
          currency,
          displayCurrency,
          ratesData.rates
        );
        const remainingBefore = limitInDisplay - alreadySpentInDisplay;
        const remainingAfter = limitInDisplay - (alreadySpentInDisplay + currentAmtInDisplay);
        return {
          name: matchedBudget.name,
          limitInDisplay,
          alreadySpentInDisplay,
          remainingBefore,
          remainingAfter,
        };
      })()
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const finalCategory = isCustom ? customCategory.trim() || 'Custom Expense' : category;
    const numericAmount = parseFloat(amount) || 0;

    const payload: Omit<Expense, 'id' | 'createdAt'> = {
      title: title.trim(),
      amount: numericAmount,
      currency,
      category: finalCategory,
      budgetType,
      isCustomCategory: isCustom,
      date,
      paymentMethod,
      budgetId: budgetId || undefined,
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      nextRenewalDate: isRecurring ? nextRenewalDate : undefined,
      notes: notes.trim(),
      receiptAttachment,
    };

    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, payload);
    } else {
      onSaveExpense(payload);
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
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingExpense ? 'Edit Expense Record' : 'Add Expense'}
              </h2>
              <p className="text-xs text-slate-500">Record business, personal, or home expenses</p>
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
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                budgetType === 'business'
                  ? 'e.g. Monthly Team Payroll, Bonus, or SaaS License'
                  : budgetType === 'home'
                  ? 'e.g. Monthly Groceries & Utilities'
                  : 'e.g. Medical Checkup or Personal Course'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={currency === 'PKR' ? 'e.g. 15000' : '45.00'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
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

          {/* Live Remaining Monthly Budget Indicator */}
          {budgetRemainingPreview && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                budgetRemainingPreview.remainingAfter < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5 truncate">
                  {budgetRemainingPreview.remainingAfter < 0 ? (
                    <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                  ) : (
                    <Wallet size={13} className="text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{budgetRemainingPreview.name}</span>
                </span>
                <span className="font-mono font-semibold shrink-0">
                  Limit: {formatCurrency(budgetRemainingPreview.limitInDisplay, displayCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="opacity-80">
                  Left before: {formatCurrency(Math.max(0, budgetRemainingPreview.remainingBefore), displayCurrency)}
                </span>
                <span
                  className={`font-bold ${
                    budgetRemainingPreview.remainingAfter < 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {budgetRemainingPreview.remainingAfter >= 0
                    ? `Left after expense: ${formatCurrency(budgetRemainingPreview.remainingAfter, displayCurrency)}`
                    : `Over budget by ${formatCurrency(Math.abs(budgetRemainingPreview.remainingAfter), displayCurrency)}`}
                </span>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
              >
                {isCustom ? 'Use Predefined Category' : '+ Add Custom Category'}
              </button>
            </div>

            {isCustom ? (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Festival Bonus or Co-Working Pass"
                className="w-full px-3 py-2 text-xs border border-rose-300 bg-rose-50/30 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <optgroup
                  label={BUDGET_TYPE_OPTIONS.find((o) => o.value === budgetType)?.label || 'Selected Scope'}
                >
                  {activeScopeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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
                      {cats.map((cat) => (
                        <option key={`${group.value}-${cat}`} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Wire</option>
                <option value="Wise">Wise</option>
                <option value="PayPal">PayPal</option>
                <option value="Crypto / USDT">Crypto / USDT</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Related Plan Budget */}
          {budgets.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Related Budget Plan</label>
              <select
                value={budgetId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setBudgetId(nextId);
                  if (nextId) {
                    const b = budgets.find((item) => item.id === nextId);
                    if (b?.budgetType) {
                      setBudgetType(b.budgetType);
                    }
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="">Auto-match by month & scope</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{(b.budgetType || 'business').toUpperCase()}] {b.name} (
                    {formatCurrency(b.totalPlannedBudget, b.currency || 'USD')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring Expense Settings */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Recurring Expense</span>
                <p className="text-[10px] text-slate-500">Auto-repeat or subscription billing</p>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={recurrenceFrequency}
                    onChange={(e) =>
                      setRecurrenceFrequency(e.target.value as 'weekly' | 'monthly' | 'yearly')
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Receipt Ref</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Invoice reference number, receipt link, or notes..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-xs"
            >
              <Save size={14} />
              <span>{editingExpense ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
