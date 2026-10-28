import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, Calendar, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Invoice } from '../../types';
import { formatCurrency } from '../../services/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTask?: Task | null;
  targetInvoice?: Invoice | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  targetTask,
  targetInvoice,
}) => {
  const { clients, tasks, invoices, addPayment } = useApp();

  const [clientId, setClientId] = useState(
    targetInvoice?.clientId || targetTask?.clientId || clients[0]?.id || ''
  );
  const [projectId, setProjectId] = useState(targetInvoice?.projectId || targetTask?.id || '');
  const [invoiceId, setInvoiceId] = useState(targetInvoice?.id || '');
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState(
    targetInvoice?.currency || targetTask?.currency || 'USD'
  );
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // Sync state when props change
  useEffect(() => {
    if (targetInvoice) {
      setClientId(targetInvoice.clientId);
      setProjectId(targetInvoice.projectId || '');
      setInvoiceId(targetInvoice.id);
      setCurrency(targetInvoice.currency);
      setAmount(targetInvoice.balanceDue.toString());
    } else if (targetTask) {
      setClientId(targetTask.clientId);
      setProjectId(targetTask.id);
      setCurrency(targetTask.currency);
      const remaining = Math.max(0, targetTask.projectPrice - (targetTask.amountPaid || 0));
      setAmount(remaining.toString());
    }
  }, [targetInvoice, targetTask]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientTasks = tasks.filter((t) => t.clientId === clientId);
  const clientInvoices = invoices.filter((inv) => inv.clientId === clientId && inv.balanceDue > 0);

  const selectedTask = tasks.find((t) => t.id === projectId);
  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || Number(amount) <= 0) return;

    addPayment({
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      projectId: projectId || undefined,
      projectName: selectedTask?.name,
      invoiceId: invoiceId || undefined,
      invoiceNumber: selectedInvoice?.invoiceNumber,
      date: paymentDate,
      amount: Number(amount),
      currency,
      paymentMethod,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Record Client Payment</h2>
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
                setInvoiceId('');
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Related Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">No specific project</option>
                {clientTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Related Invoice</label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  const found = invoices.find((inv) => inv.id === e.target.value);
                  if (found) {
                    setAmount(found.balanceDue.toString());
                    setCurrency(found.currency);
                  }
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">No specific invoice</option>
                {clientInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} (${inv.balanceDue} due)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Amount *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                {['USD', 'USDT', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="bank_transfer">Bank Wire / ACH</option>
                <option value="wise">Wise</option>
                <option value="crypto">Crypto / USDT</option>
                <option value="paypal">PayPal</option>
                <option value="upwork">Upwork Escrow</option>
                <option value="fiverr">Fiverr Clearance</option>
                <option value="payoneer">Payoneer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. Wire confirmation #48921"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Confirm Payment Recorded
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
