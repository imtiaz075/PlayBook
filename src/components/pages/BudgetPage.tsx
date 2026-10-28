import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Receipt,
  DollarSign,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  Trash2,
  Calendar,
  CreditCard,
  TrendingDown,
  TrendingUp,
  X,
  Edit,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, Subscription, BudgetCategory } from '../../types';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { InfoTooltip } from '../common/Tooltip';

interface BudgetPageProps {
  onOpenNewExpense: () => void;
  onOpenNewSubscription: () => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({
  onOpenNewExpense,
  onOpenNewSubscription,
}) => {
  const {
    budgetCategories,
    expenses,
    subscriptions,
    payments,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    deleteExpense,
    updateSubscription,
    deleteSubscription,
    displayCurrency,
    ratesData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'categories' | 'expenses' | 'subscriptions'>('categories');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );

  // New Category sub-modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('300');

  // Filter expenses by selected month
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  // Category spending breakdown
  const categorySpending = budgetCategories.map((cat) => {
    const spent = monthExpenses
      .filter((e) => e.categoryId === cat.id)
      .reduce(
        (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
        0
      );
    const limit = convertCurrency(cat.monthlyLimit, 'USD', displayCurrency, ratesData.rates);
    const remaining = limit - spent;
    const pctUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const isOver = spent > limit;

    return {
      ...cat,
      spent,
      limit,
      remaining,
      pctUsed,
      isOver,
    };
  });

  // Overall statistics
  const totalPlannedSpending = categorySpending.reduce((sum, c) => sum + c.limit, 0);
  const totalActualSpending = categorySpending.reduce((sum, c) => sum + c.spent, 0);
  const totalRemainingBudget = Math.max(0, totalPlannedSpending - totalActualSpending);

  const monthIncome = payments
    .filter((p) => p.date.startsWith(selectedMonth))
    .reduce(
      (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
      0
    );

  const netCashFlow = monthIncome - totalActualSpending;

  // Active upcoming subscriptions
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalMonthlySubs = activeSubs.reduce((sum, s) => {
    const monthlyAmt =
      s.recurrence === 'yearly' ? s.amount / 12 : s.recurrence === 'quarterly' ? s.amount / 3 : s.amount;
    return sum + convertCurrency(monthlyAmt, s.currency, displayCurrency, ratesData.rates);
  }, 0);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addBudgetCategory({
      name: newCatName.trim(),
      monthlyLimit: Number(newCatLimit) || 100,
    });

    setNewCatName('');
    setCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Budget
          </h1>
          <InfoTooltip content="Monthly operational expenses, subscription renewals, and category spending limits." />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* A. Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-slate-500">Planned Budget</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(totalPlannedSpending, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">category caps</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-rose-600 font-semibold">Actual Spending</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(totalActualSpending, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">{monthExpenses.length} expenses logged</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-emerald-600 font-semibold">Remaining Budget</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(totalRemainingBudget, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">unspent room</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-slate-500">Recorded Income</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(monthIncome, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">client cash collected</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-indigo-600 font-semibold">Net Cash Flow</span>
          <p
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1 truncate ${
              netCashFlow >= 0 ? 'text-indigo-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netCashFlow, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">income minus expenses</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieChart size={15} />
            <span>Category Budgets & Limits ({categorySpending.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt size={15} />
            <span>Logged Expenses Ledger ({monthExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'subscriptions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Repeat size={15} />
            <span>Subscriptions & Recurring ({subscriptions.length})</span>
          </button>
        </div>

        {/* Tab 1: Category Budgets */}
        {activeTab === 'categories' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700">Category Budgets</h2>
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {categorySpending.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
                    cat.isOver
                      ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h3>
                    {cat.isOver ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle size={11} /> Over Budget!
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                        {cat.pctUsed}% used
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden my-2">
                    <div
                      style={{ width: `${Math.min(100, cat.pctUsed)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        cat.isOver ? 'bg-rose-500' : cat.pctUsed > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Spent</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(cat.spent, displayCurrency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Monthly Limit</span>
                      <span className="font-semibold text-slate-600 font-mono tabular-nums">
                        {formatCurrency(cat.limit, displayCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Logged Expenses */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No expenses logged for {selectedMonth}. Click "+ Add Expense" to record spending.
                    </td>
                  </tr>
                ) : (
                  monthExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-mono text-slate-600">{exp.date}</td>
                      <td className="py-3 px-5 font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-5">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {exp.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-500">{exp.paymentMethod}</td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(exp.amount, exp.currency)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Software & Subscriptions</h3>
                <p className="text-xs text-slate-500">
                  Estimated recurring commitment: ~{formatCurrency(totalMonthlySubs, displayCurrency)} / month
                </p>
              </div>
              <button
                onClick={onOpenNewSubscription}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Add Subscription</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border transition-all ${
                    sub.status === 'cancelled'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {sub.recurrence}
                    </span>
                    <button
                      onClick={() =>
                        updateSubscription(sub.id, {
                          status: sub.status === 'active' ? 'cancelled' : 'active',
                        })
                      }
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        sub.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {sub.status === 'active' ? 'Active' : 'Cancelled'}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 truncate">{sub.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{sub.categoryName}</p>

                  <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Renewal Date</span>
                      <span className="font-mono tabular-nums text-slate-700 font-medium">
                        {sub.renewalDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Cost</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(sub.amount, sub.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Category Sub-Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Add Budget Category</h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel & Coworking"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Monthly Limit ($ USD) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newCatLimit}
                  onChange={(e) => setNewCatLimit(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
