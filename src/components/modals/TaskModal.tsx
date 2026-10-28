import React, { useState } from 'react';
import { X, CheckSquare, Plus, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority, PlatformType, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  initialClientId,
}) => {
  const { clients, addTask, addClient, settings } = useApp();

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '');
  const [platform, setPlatform] = useState<PlatformType>('Fiverr');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [priceType, setPriceType] = useState<'fixed' | 'hourly'>('fixed');
  const [projectPrice, setProjectPrice] = useState('100');
  const [currency, setCurrency] = useState('USDT');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [estimatedHours, setEstimatedHours] = useState('10');
  const [notes, setNotes] = useState('');
  const [deadlineAlertEnabled, setDeadlineAlertEnabled] = useState(true);

  // New Client quick-toggle inside form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  if (!isOpen) return null;

  const currentFeePct = settings.platformFees[platform] ?? 0;
  const priceNum = Number(projectPrice) || 0;
  const estimatedFeeAmount = (priceNum * currentFeePct) / 100;
  const estimatedNet = priceNum - estimatedFeeAmount;

  const handleQuickAddClient = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) return;

    const created = addClient({
      fullName: newClientName.trim(),
      email: newClientEmail.trim(),
      clientSource: platform,
      country: 'United States',
      preferredCurrency: currency,
      pricingType: 'hourly',
      hourlyRate: Number(hourlyRate) || 50,
      status: 'active',
    });

    setClientId(created.id);
    setShowNewClientForm(false);
    setNewClientName('');
    setNewClientEmail('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedClient = clients.find((c) => c.id === clientId);

    addTask({
      name: name.trim(),
      clientId: clientId || clients[0]?.id || 'c-default',
      clientName: selectedClient?.fullName || 'General Client',
      platform,
      deadline,
      startDate,
      priority,
      status,
      priceType,
      projectPrice: priceNum,
      currency,
      hourlyRate: Number(hourlyRate) || undefined,
      estimatedHours: Number(estimatedHours) || undefined,
      notes: notes.trim(),
      deadlineAlertEnabled,
      platformFeePercentage: currentFeePct,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Add Project or Task</h2>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Task or Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next.js SaaS Authentication & Billing API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Client Selection with inline quick-add */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Client / Contact *</label>
              <button
                type="button"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {showNewClientForm ? 'Cancel New Client' : '+ Add New Client Here'}
              </button>
            </div>

            {showNewClientForm ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mb-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Client Name *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Client Email *"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddClient}
                  className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  Save & Select Client
                </button>
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.companyName || c.clientSource})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Platform *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['Fiverr', 'Upwork', 'Freelancer.com', 'PeoplePerHour', 'Guru', 'LinkedIn', 'Direct Clients', 'Other'].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p} (Fee: {settings.platformFees[p] ?? 0}%)
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Price Type</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'fixed' | 'hourly')}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {priceType === 'fixed' ? 'Gross Price *' : 'Est. Project Value'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={projectPrice}
                onChange={(e) => setProjectPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency *</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['USDT', 'USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Smart Platform Fee Live Preview Strip */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-medium">{platform} Fee ({currentFeePct}%): </span>
              <span className="font-mono text-rose-600 font-bold">-{estimatedFeeAmount} {currency}</span>
            </div>
            <div className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <span className="text-emerald-800 font-semibold">Estimated Net Take-Home: </span>
              <span className="font-mono font-bold text-emerald-800">{estimatedNet} {currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg border transition-colors ${
                    priority === p
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Notes / Scope</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key deliverables, git repo link, milestone criteria..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="deadlineAlert"
                checked={deadlineAlertEnabled}
                onChange={(e) => setDeadlineAlertEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="deadlineAlert" className="text-xs text-slate-700">
                Alert me before deadline
              </label>
            </div>

            <div className="flex items-center gap-2">
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
                Save Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
