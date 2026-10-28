import React, { useState } from 'react';
import { X, Clock, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currency';

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({ isOpen, onClose }) => {
  const { clients, tasks, addTimeEntry, settings } = useApp();

  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('2');
  const [minutes, setMinutes] = useState('0');
  const [hourlyRate, setHourlyRate] = useState(settings.defaultHourlyRate?.toString() || '65');
  const [isBillable, setIsBillable] = useState(true);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientTasks = tasks.filter((t) => t.clientId === clientId);
  const selectedTask = tasks.find((t) => t.id === projectId);

  const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60;
  const billableAmount = isBillable ? Number(((totalSeconds / 3600) * Number(hourlyRate)).toFixed(2)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || totalSeconds <= 0) return;

    addTimeEntry({
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      projectId: projectId || 'p-manual',
      projectName: selectedTask?.name || 'Manual Consulting Session',
      date,
      startTime: new Date(`${date}T09:00:00`).toISOString(),
      endTime: new Date(`${date}T09:00:00`).getTime() + totalSeconds * 1000 ? new Date().toISOString() : new Date().toISOString(),
      durationSeconds: totalSeconds,
      hourlyRate: Number(hourlyRate) || 0,
      isBillable,
      billableAmount,
      description: description.trim() || 'Manual time logged',
      invoiceId: null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Manual Time Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client *</label>
            <select
              required
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProjectId('');
                const cl = clients.find((c) => c.id === e.target.value);
                if (cl?.hourlyRate) setHourlyRate(cl.hourlyRate.toString());
              }}
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">General Consulting Work</option>
              {clientTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hours *</label>
              <input
                type="number"
                min="0"
                max="24"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isBillableCheck"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isBillableCheck" className="text-xs font-medium text-slate-700">
                Billable Work
              </label>
            </div>
          </div>

          {/* Computed Value preview */}
          {isBillable && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">Computed Billable Value:</span>
              <span className="font-bold text-emerald-800 font-mono tabular-nums">
                {formatCurrency(billableAmount, 'USD')}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="What tasks or deliverables were completed?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              Save Time Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
