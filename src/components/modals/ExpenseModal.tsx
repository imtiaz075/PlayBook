import React, { useState } from 'react';
import { CreditCard, X, Plus, Save } from 'lucide-react';
import { Expense, PlanBudget } from '../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  editingExpense?: Expense | null;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
  budgets?: PlanBudget[];
}

export const PREDEFINED_EXPENSE_CATEGORIES = [
  'Rent and Housing',
  'Food and Groceries',
  'Transportation',
  'Utilities',
  'Internet and Mobile',
  'Business Expenses',
  'Software and Subscriptions',
  'Equipment and Supplies',
  'Marketing and Advertising',
  'Education and Courses',
  'Health and Medical',
  'Family and Household',
  'Savings',
  'Debt and Loan Payments',
  'Entertainment',
  'Taxes',
  'Travel',
  'Bank and Transaction Fees',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  editingExpense,
  onUpdateExpense,
  budgets = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(editingExpense?.title || '');
  const [amount, setAmount] = useState<string>(editingExpense ? String(editingExpense.amount) : '');
  const [currency, setCurrency] = useState(editingExpense?.currency || 'USD');
  const [category, setCategory] = useState(editingExpense?.category || 'Business Expenses');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [date, setDate] = useState(editingExpense?.date || todayStr);
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.paymentMethod || 'Credit Card');
  const [budgetId, setBudgetId] = useState(editingExpense?.budgetId || '');
  const [isRecurring, setIsRecurring] = useState(editingExpense?.isRecurring || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(
    editingExpense?.recurrenceFrequency || 'monthly'
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(editingExpense?.nextRenewalDate || '');
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [receiptAttachment, setReceiptAttachment] = useState(editingExpense?.receiptAttachment || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const finalCategory = isCustom ? customCategory.trim() || 'Custom Expense' : category;
    const numericAmount = parseFloat(amount) || 0;

    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, {
        title: title.trim(),
        amount: numericAmount,
        currency,
        category: finalCategory,
        isCustomCategory: isCustom,
        date,
        paymentMethod,
        budgetId: budgetId || undefined,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        nextRenewalDate: isRecurring ? nextRenewalDate : undefined,
        notes: notes.trim(),
        receiptAttachment,
      });
    } else {
      onSaveExpense({
        title: title.trim(),
        amount: numericAmount,
        currency,
        category: finalCategory,
        isCustomCategory: isCustom,
        date,
        paymentMethod,
        budgetId: budgetId || undefined,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        nextRenewalDate: isRecurring ? nextRenewalDate : undefined,
        notes: notes.trim(),
        receiptAttachment,
      });
    }
    onClose();
  };

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
              <p className="text-xs text-slate-500">Record actual paid business or personal expense</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Figma Organization License Renewal"
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
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45.00"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USDT">USDT (₮)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] text-rose-600 font-semibold hover:underline"
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
                placeholder="e.g. Co-Working Workspace Pass"
                className="w-full px-3 py-2 text-xs border border-rose-300 bg-rose-50/30 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {PREDEFINED_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="">None (Standalone Expense)</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currency} {b.totalPlannedBudget})
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
