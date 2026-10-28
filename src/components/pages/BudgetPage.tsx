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
  Wallet,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, Subscription, BudgetCategory, PlanBudget } from '../../types';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { InfoTooltip } from '../common/Tooltip';
import { PlanBudgetModal } from '../modals/PlanBudgetModal';
import { ExpenseModal } from '../modals/ExpenseModal';

interface BudgetPageProps {
  onOpenNewExpense?: () => void;
  onOpenNewSubscription?: () => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = () => {
  const {
    budgetCategories,
    expenses,
    subscriptions,
    payments,
    planBudgets,
    addPlanBudget,
    updatePlanBudget,
    deletePlanBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    deleteSubscription,
    displayCurrency,
    ratesData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'plans' | 'expenses' | 'subscriptions' | 'categories'>('plans');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );

  // Search & Filter state for Expenses
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modals state
  const [planBudgetModalOpen, setPlanBudgetModalOpen] = useState(false);
  const [editingPlanBudget, setEditingPlanBudget] = useState<PlanBudget | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('300');

  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingBudgetPlanId, setDeletingBudgetPlanId] = useState<string | null>(null);

  // Filter expenses by selected month
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  // Filtered expenses list for Expenses tab
  const filteredExpensesList = expenses.filter((e) => {
    const titleStr = (e.title || '').toLowerCase();
    const catStr = (e.category || '').toLowerCase();
    const notesStr = (e.notes || '').toLowerCase();
    const searchStr = (expenseSearch || '').toLowerCase();

    const matchesSearch =
      titleStr.includes(searchStr) ||
      catStr.includes(searchStr) ||
      notesStr.includes(searchStr);

    const matchesCategory =
      selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Category spending breakdown
  const categorySpending = budgetCategories.map((cat) => {
    const catNameLower = (cat.name || '').toLowerCase();
    const spent = monthExpenses
      .filter((e) => (e.category || '').toLowerCase() === catNameLower)
      .reduce(
        (sum, e) => sum + convertCurrency(e.amount || 0, e.currency || 'USD', displayCurrency, ratesData.rates),
        0
      );
    const limit = convertCurrency(cat.monthlyLimit || 0, 'USD', displayCurrency, ratesData.rates);
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
  const totalActualSpending = expenses.reduce(
    (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
    0
  );
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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addBudgetCategory({
      name: newCatName.trim(),
      monthlyLimit: Number(newCatLimit) || 100,
      currency: 'USD',
      color: 'indigo',
      iconName: 'tag',
    });

    setNewCatName('');
    setCategoryModalOpen(false);
  };

  const confirmDeleteExpense = () => {
    if (deletingExpenseId) {
      deleteExpense(deletingExpenseId);
      setDeletingExpenseId(null);
    }
  };

  const confirmDeleteBudgetPlan = () => {
    if (deletingBudgetPlanId) {
      deletePlanBudget(deletingBudgetPlanId);
      setDeletingBudgetPlanId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Budget & Expense Management
          </h1>
          <InfoTooltip content="Plan custom operating budgets, track actual paid expenses, and monitor category limits." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={() => {
              setEditingPlanBudget(null);
              setPlanBudgetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-xl transition-colors shadow-2xs"
          >
            <Wallet size={15} />
            <span>Plan Budget</span>
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-xs"
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
          <span className="text-[10px] text-slate-400">{expenses.length} expenses logged</span>
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
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'plans'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet size={15} />
            <span>Planned Budgets ({planBudgets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt size={15} />
            <span>Actual Expenses Log ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieChart size={15} />
            <span>Category Spending Caps</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'subscriptions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Repeat size={15} />
            <span>Recurring Subscriptions ({subscriptions.length})</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PLANNED BUDGETS */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Planned Operating Budgets</h3>
                  <p className="text-xs text-slate-500">
                    Allocate planned targets across expense categories without counting allocations as actual paid expenses.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPlanBudget(null);
                    setPlanBudgetModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-xs"
                >
                  <Plus size={14} />
                  <span>Create Plan Budget</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planBudgets.map((b) => {
                  return (
                    <div
                      key={b.id}
                      className="p-5 bg-white border border-purple-200/90 rounded-2xl shadow-2xs hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-purple-100 text-purple-800">
                              {b.period}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {b.startDate} to {b.endDate}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1">{b.name}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPlanBudget(b);
                              setPlanBudgetModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg transition-colors"
                            title="Edit Plan Budget"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingBudgetPlanId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete Plan Budget"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                        <div>
                          <span className="text-xs font-semibold text-purple-900 block">Total Planned Budget</span>
                          <span className="text-lg font-bold font-mono text-purple-900">
                            {b.currency} {b.totalPlannedBudget.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Allocated Categories</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {b.categoryAllocations.length} categories
                          </span>
                        </div>
                      </div>

                      {/* Category Allocations Breakdown */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 block">Category Allocations vs Actual Spending:</span>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {b.categoryAllocations.map((alloc, idx) => {
                            const allocCatLower = (alloc.category || '').toLowerCase();
                            const actualSpent = expenses
                              .filter((e) => (e.category || '').toLowerCase() === allocCatLower)
                              .reduce((s, e) => s + (e.amount || 0), 0);
                            const isExceeded = actualSpent > alloc.plannedAmount;
                            const isApproaching = actualSpent >= alloc.plannedAmount * 0.85;

                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 ${
                                  isExceeded
                                    ? 'bg-rose-50 border-rose-200'
                                    : isApproaching
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900">{alloc.category}</span>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-slate-500">
                                      Spent: ${actualSpent} /
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      Plan: ${alloc.plannedAmount}
                                    </span>
                                  </div>
                                </div>
                                {isExceeded && (
                                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                    <AlertTriangle size={11} />
                                    Exceeded planned limit by ${(actualSpent - alloc.plannedAmount).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACTUAL EXPENSES LOG */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="all">All Categories</option>
                    {Array.from(new Set(expenses.map((e) => e.category || 'General'))).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setExpenseModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs shrink-0"
                  >
                    <Plus size={14} /> Add Expense
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Expense Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpensesList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No expenses found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredExpensesList.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                            {exp.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {exp.title}
                            {exp.isRecurring && (
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                Recurring
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-[11px]">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {exp.paymentMethod || 'Credit Card'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                            {formatCurrency(exp.amount, exp.currency)}
                          </td>
                          <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingExpense(exp);
                                setExpenseModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                              title="Edit expense"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingExpenseId(exp.id)}
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
            </div>
          )}

          {/* TAB 3: CATEGORY SPENDING CAPS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Category Spending Limits & Caps</h3>
                  <p className="text-xs text-slate-500">Track monthly expense thresholds per category.</p>
                </div>
                <button
                  onClick={() => setCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  <Plus size={14} /> New Category Limit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySpending.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                      <button
                        onClick={() => deleteBudgetCategory(cat.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Spent: {formatCurrency(cat.spent, displayCurrency)}</span>
                        <span className="font-bold text-slate-900">Cap: {formatCurrency(cat.limit, displayCurrency)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, cat.pctUsed)}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            cat.isOver ? 'bg-rose-600' : cat.pctUsed > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RECURRING SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Software & Operational Subscriptions</h3>
                  <p className="text-xs text-slate-500">Recurring tools, SaaS licenses, and automatic renewals.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Service Name</th>
                      <th className="py-3 px-4">Billing Cycle</th>
                      <th className="py-3 px-4">Next Renewal</th>
                      <th className="py-3 px-4 text-right">Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.name}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">{sub.billingCycle}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{sub.renewalDate}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(sub.cost, sub.currency)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteSubscription(sub.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Budget Modal */}
      <PlanBudgetModal
        isOpen={planBudgetModalOpen}
        onClose={() => setPlanBudgetModalOpen(false)}
        onSavePlanBudget={addPlanBudget}
        editingBudget={editingPlanBudget}
        onUpdatePlanBudget={updatePlanBudget}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaveExpense={addExpense}
        editingExpense={editingExpense}
        onUpdateExpense={updateExpense}
        budgets={planBudgets}
      />

      {/* Delete Expense Confirmation Modal */}
      {deletingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Expense Record</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this recorded expense? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingExpenseId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExpense}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Budget Plan Confirmation Modal */}
      {deletingBudgetPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Budget Plan</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this plan budget? Your recorded actual expenses will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingBudgetPlanId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBudgetPlan}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Create Spending Cap Limit</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software & Subscriptions"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Threshold ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCatLimit}
                  onChange={(e) => setNewCatLimit(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
