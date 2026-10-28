import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimeEntry } from '../../types';

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTimeEntry?: TimeEntry | null;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({
  isOpen,
  onClose,
  editingTimeEntry,
}) => {
  const { clients, tasks, addTimeEntry, updateTimeEntry, settings } = useApp();

  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('2');
  const [minutes, setMinutes] = useState('0');
  const [hourlyRate, setHourlyRate] = useState(settings.defaultHourlyRate?.toString() || '65');
  const [isBillable, setIsBillable] = useState(true);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingTimeEntry) {
      setClientId(editingTimeEntry.clientId || clients[0]?.id || '');
      setProjectId(editingTimeEntry.projectId || '');
      setDate(editingTimeEntry.date || new Date().toISOString().split('T')[0]);
      const totalMins = Math.floor(editingTimeEntry.durationSeconds / 60);
      setHours(String(Math.floor(totalMins / 60)));
      setMinutes(String(totalMins % 60));
      setHourlyRate(String(editingTimeEntry.hourlyRate || 65));
      setIsBillable(editingTimeEntry.isBillable);
      setDescription(editingTimeEntry.description || '');
    } else {
      setClientId(clients[0]?.id || '');
      setProjectId('');
      setDate(new Date().toISOString().split('T')[0]);
      setHours('2');
      setMinutes('0');
      setHourlyRate(settings.defaultHourlyRate?.toString() || '65');
      setIsBillable(true);
      setDescription('');
    }
  }, [editingTimeEntry, isOpen, clients, settings]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];
  const clientTasks = tasks.filter((t) => t.clientId === clientId);
  const selectedTask = tasks.find((t) => t.id === projectId);

  const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60;
  const billableAmount = isBillable ? Number(((totalSeconds / 3600) * Number(hourlyRate)).toFixed(2)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSeconds <= 0) return;

    if (editingTimeEntry) {
      updateTimeEntry(editingTimeEntry.id, {
        clientId: selectedClient?.id || 'c-general',
        clientName: selectedClient?.fullName || 'General Client',
        projectId: projectId || 'p-manual',
        projectName: selectedTask?.name || 'Manual Consulting Session',
        date,
        durationSeconds: totalSeconds,
        hourlyRate: Number(hourlyRate) || 0,
        isBillable,
        billableAmount,
        description: description.trim() || 'Manual time entry',
      });
    } else {
      addTimeEntry({
        clientId: selectedClient?.id || 'c-general',
        clientName: selectedClient?.fullName || 'General Client',
        projectId: projectId || 'p-manual',
        projectName: selectedTask?.name || 'Manual Consulting Session',
        date,
        startTime: new Date(`${date}T09:00:00`).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: totalSeconds,
        hourlyRate: Number(hourlyRate) || 0,
        isBillable,
        billableAmount,
        description: description.trim() || 'Manual time logged',
        invoiceId: null,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingTimeEntry ? 'Edit Time Entry Session' : 'Manual Time Entry'}
            </h2>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Client *</label>
            <select
              required
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProjectId('');
                const cl = clients.find((c) => c.id === e.target.value);
                if (cl?.hourlyRate) setHourlyRate(cl.hourlyRate.toString());
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.companyName || c.clientSource})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Associated Project / Task</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">General Consulting Work</option>
              {clientTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.platform})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Logged</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-800">Billable Session</span>
              <p className="text-[10px] text-slate-500">Calculated value: ${billableAmount}</p>
            </div>
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="What specific tasks or milestones were worked on during this session?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors"
            >
              <Save size={14} />
              <span>{editingTimeEntry ? 'Save Changes' : 'Save Time Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
