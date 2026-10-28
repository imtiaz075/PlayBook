import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Calendar,
  Receipt,
  UserPlus,
  Target,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformType, Priority } from '../../types';

export const QuickAddModal: React.FC = () => {
  const {
    quickAddOpen,
    setQuickAddOpen,
    clients,
    addTask,
    addSchedule,
    addExpense,
    addClient,
    addGoal,
    budgetCategories,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'task' | 'schedule' | 'expense' | 'contact' | 'goal'>('task');

  // Task form
  const [taskName, setTaskName] = useState('');
  const [taskClientId, setTaskClientId] = useState(clients[0]?.id || '');
  const [taskPlatform, setTaskPlatform] = useState<PlatformType>('Fiverr');
  const [taskDeadline, setTaskDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskPrice, setTaskPrice] = useState('100');
  const [taskCurrency, setTaskCurrency] = useState('USDT');

  // Schedule form
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedTime, setSchedTime] = useState('10:00');
  const [schedType, setSchedType] = useState<'activity' | 'reminder'>('activity');
  const [schedNotes, setSchedNotes] = useState('');

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('30');
  const [expCatId, setExpCatId] = useState(budgetCategories[0]?.id || '');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactSource, setContactSource] = useState('Upwork');
  const [contactRate, setContactRate] = useState('65');

  // Goal form
  const [goalName, setGoalName] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState('5000');
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );

  if (!quickAddOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const selectedClient = clients.find((c) => c.id === taskClientId);
    addTask({
      name: taskName.trim(),
      clientId: taskClientId || (clients[0]?.id || 'c-new'),
      clientName: selectedClient?.fullName || 'General Client',
      platform: taskPlatform,
      deadline: taskDeadline,
      priority: taskPriority,
      status: 'open',
      priceType: 'fixed',
      projectPrice: Number(taskPrice) || 0,
      currency: taskCurrency,
      platformFeePercentage: settings.platformFees[taskPlatform] ?? 15,
      deadlineAlertEnabled: true,
      notes: '',
    });
    setQuickAddOpen(false);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle.trim()) return;

    addSchedule({
      title: schedTitle.trim(),
      date: schedDate,
      startTime: schedTime,
      type: schedType,
      notes: schedNotes,
      alertAtTime: true,
      advanceReminderMinutes: 15,
      repeatSetting: 'none',
    });
    setQuickAddOpen(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || Number(expAmount) <= 0) return;

    const cat = budgetCategories.find((c) => c.id === expCatId);
    addExpense({
      title: expTitle.trim(),
      amount: Number(expAmount),
      currency: 'USD',
      date: expDate,
      category: cat?.name || 'General Expense',
      paymentMethod: 'Credit Card',
      isRecurring: false,
    });
    setQuickAddOpen(false);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;

    addClient({
      fullName: contactName.trim(),
      email: contactEmail.trim(),
      companyName: contactCompany.trim(),
      clientSource: contactSource,
      country: 'United States',
      preferredCurrency: 'USD',
      pricingType: 'hourly',
      hourlyRate: Number(contactRate) || 60,
      status: 'active',
    });
    setQuickAddOpen(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;

    addGoal({
      name: goalName.trim(),
      category: 'achievements',
      targetDate: goalTargetDate,
      targetValue: Number(goalTargetValue) || 1000,
      progressPercentage: 0,
      status: 'not_started',
      measurementMethod: 'numeric_auto',
      priority: 'high',
      notes: '',
      milestones: [],
    });
    setQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Global Quick Add</h2>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/50 gap-2 overflow-x-auto">
          {[
            { id: 'task', label: 'Task / Project', icon: CheckSquare },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'expense', label: 'Expense', icon: Receipt },
            { id: 'contact', label: 'Client', icon: UserPlus },
            { id: 'goal', label: 'Goal', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body forms */}
        <div className="p-6">
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task or Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Landing Page & Interactive Prototypes"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Client *</label>
                  <select
                    value={taskClientId}
                    onChange={(e) => setTaskClientId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.companyName || c.clientSource})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Platform *</label>
                  <select
                    value={taskPlatform}
                    onChange={(e) => setTaskPlatform(e.target.value as PlatformType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {['Fiverr', 'Upwork', 'Freelancer.com', 'PeoplePerHour', 'Guru', 'LinkedIn', 'Direct Clients', 'Other'].map(
                      (p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Project Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={taskPrice}
                    onChange={(e) => setTaskPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Currency *</label>
                  <select
                    value={taskCurrency}
                    onChange={(e) => setTaskCurrency(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {['USDT', 'USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD'].map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p)}
                      className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                        taskPriority === p
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Create Task & Project
                </button>
              </div>
            </form>
          )}

          {activeTab === 'schedule' && (
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Schedule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Feedback Call with Alex"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                <div className="flex gap-2">
                  {(['activity', 'reminder'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSchedType(t)}
                      className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                        schedType === t
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="Optional meeting link or key points..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          )}

          {activeTab === 'expense' && (
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Domain Renewal, Software Seat, Hardware"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Budget Category *</label>
                <select
                  value={expCatId}
                  onChange={(e) => setExpCatId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {budgetCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Limit: ${c.monthlyLimit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Log Expense
                </button>
              </div>
            </form>
          )}

          {activeTab === 'contact' && (
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="david@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Studio</label>
                  <input
                    type="text"
                    placeholder="Miller Ventures"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Client Source</label>
                  <select
                    value={contactSource}
                    onChange={(e) => setContactSource(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {['Fiverr', 'Upwork', 'LinkedIn', 'Freelancer.com', 'PeoplePerHour', 'Guru', 'Direct Clients', 'Referral'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={contactRate}
                    onChange={(e) => setContactRate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Save New Client
                </button>
              </div>
            </form>
          )}

          {activeTab === 'goal' && (
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reach $7,000 USD Monthly Baseline"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Value ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Create Goal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
