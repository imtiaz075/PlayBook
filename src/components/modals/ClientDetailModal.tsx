import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  FileText,
  CreditCard,
  Plus,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currency';
import { Task, Invoice } from '../../types';

interface ClientDetailModalProps {
  clientId: string | null;
  onClose: () => void;
  onOpenNewTaskWithClient: (clientId: string) => void;
  onOpenRecordPaymentWithClient: (clientId: string) => void;
  onOpenCreateInvoiceWithClient: (clientId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  clientId,
  onClose,
  onOpenNewTaskWithClient,
  onOpenRecordPaymentWithClient,
  onOpenCreateInvoiceWithClient,
}) => {
  const { clients, tasks, payments, invoices, timeEntries, startTimer, updateClient } = useApp();
  const [activeTab, setActiveTab] = useState<'projects' | 'invoices' | 'payments' | 'time'>('projects');

  if (!clientId) return null;
  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  // Connected client records
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const clientPayments = payments.filter((p) => p.clientId === client.id);
  const clientInvoices = invoices.filter((inv) => inv.clientId === client.id);
  const clientTimeEntries = timeEntries.filter((te) => te.clientId === client.id);

  // Financial reconciliations
  const agreedTotal = clientTasks.reduce((sum, t) => sum + t.projectPrice, 0);
  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingBalance = Math.max(0, agreedTotal - totalPaid);
  const totalTrackedSeconds = clientTimeEntries.reduce((sum, te) => sum + te.durationSeconds, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                {client.clientSource}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                  client.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {client.status}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{client.fullName}</h2>
            {client.companyName && (
              <p className="text-xs text-slate-400 mt-0.5">{client.companyName}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startTimer(undefined, client.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
              title="Start Timer for this client"
            >
              <Play size={13} fill="currentColor" className="text-emerald-600" />
              <span>Start Timer</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <button
            onClick={() => onOpenNewTaskWithClient(client.id)}
            className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
          >
            <Plus size={13} className="text-indigo-600" />
            <span>Add Project</span>
          </button>
          <button
            onClick={() => onOpenRecordPaymentWithClient(client.id)}
            className="flex items-center gap-1 px-3 py-1.5 font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg shadow-2xs"
          >
            <DollarSign size={13} className="text-emerald-600" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => onOpenCreateInvoiceWithClient(client.id)}
            className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
          >
            <FileText size={13} className="text-indigo-600" />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={() =>
              updateClient(client.id, {
                status: client.status === 'active' ? 'closed' : 'active',
              })
            }
            className="ml-auto text-slate-500 hover:text-slate-800"
          >
            {client.status === 'active' ? 'Close Client' : 'Reactivate Client'}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact Details & Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">
                Contact Information
              </h3>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-slate-600 font-mono">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{client.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-500">
                <span>Preferred Currency: <strong className="text-slate-800">{client.preferredCurrency}</strong></span>
                <span>Rate: <strong className="text-slate-800">${client.hourlyRate}/h</strong></span>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">
                Financial Summary
              </h3>
              <div className="flex justify-between items-center text-slate-600">
                <span>Agreed Total Value</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(agreedTotal, client.preferredCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>Total Payments Received</span>
                <span className="font-bold font-mono tabular-nums">
                  {formatCurrency(totalPaid, client.preferredCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-700 font-semibold pt-1 border-t border-slate-200">
                <span>Outstanding Balance</span>
                <span className="font-bold font-mono tabular-nums">
                  {formatCurrency(outstandingBalance, client.preferredCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pt-1">
                <span>Total Focus Time Logged</span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">
                  {(totalTrackedSeconds / 3600).toFixed(1)} hrs
                </span>
              </div>
            </div>
          </div>

          {/* Connected Tabs */}
          <div>
            <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeTab === 'projects'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Projects ({clientTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Invoices ({clientInvoices.length})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Payments ({clientPayments.length})
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeTab === 'time'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Time Sessions ({clientTimeEntries.length})
              </button>
            </div>

            <div className="pt-4">
              {activeTab === 'projects' && (
                <div className="space-y-2">
                  {clientTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No projects created yet.</p>
                  ) : (
                    clientTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{t.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-semibold uppercase">
                              {t.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatCurrency(t.projectPrice, t.currency)} · Deadline: {t.deadline}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-emerald-600">
                            Paid: {formatCurrency(t.amountPaid || 0, t.currency)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="space-y-2">
                  {clientInvoices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No invoices issued yet.</p>
                  ) : (
                    clientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold font-mono text-indigo-600">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-200">
                            {inv.status}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">Due: {inv.dueDate}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(inv.total, inv.currency)}
                          </p>
                          <p className="text-[10px] text-amber-700">
                            Balance: {formatCurrency(inv.balanceDue, inv.currency)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-2">
                  {clientPayments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No payments recorded yet.</p>
                  ) : (
                    clientPayments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono text-slate-500">{p.date}</span>
                          <span className="ml-2 font-semibold text-slate-800 uppercase text-[10px]">
                            {p.paymentMethod}
                          </span>
                          {p.notes && <p className="text-[11px] text-slate-500 mt-0.5">{p.notes}</p>}
                        </div>
                        <span className="font-bold font-mono text-emerald-600 text-sm">
                          +{formatCurrency(p.amount, p.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'time' && (
                <div className="space-y-2">
                  {clientTimeEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No time logged yet.</p>
                  ) : (
                    clientTimeEntries.map((te) => (
                      <div
                        key={te.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono text-slate-500">{te.date}</span>
                          <span className="ml-2 font-semibold text-slate-800">{te.projectName}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{te.description}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-slate-900">
                            {(te.durationSeconds / 3600).toFixed(2)} hrs
                          </p>
                          <p className="text-[10px] text-emerald-600">
                            {formatCurrency(te.billableAmount, 'USD')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
