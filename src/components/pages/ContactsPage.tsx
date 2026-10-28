import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
  Trash2,
  Edit,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import { formatCurrency } from '../../services/currency';
import { InfoTooltip } from '../common/Tooltip';

interface ContactsPageProps {
  onOpenNewContact: () => void;
  onOpenClientDetails: (clientId: string) => void;
  onOpenNewTaskWithClient: (client: Client) => void;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({
  onOpenNewContact,
  onOpenClientDetails,
  onOpenNewTaskWithClient,
}) => {
  const { clients, tasks, payments, invoices, timeEntries, updateClient, deleteClient } = useApp();

  const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>('active');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Client filtering
  const filteredClients = clients.filter((c) => {
    if (statusTab === 'active' && c.status !== 'active') return false;
    if (statusTab === 'archived' && c.status === 'active') return false;
    if (sourceFilter !== 'all' && c.clientSource !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.clientSource.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Unique sources
  const sources = Array.from(new Set(clients.map((c) => c.clientSource)));

  // Global metrics across all clients
  const activeClientsCount = clients.filter((c) => c.status === 'active').length;
  const activeProjectsCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

  const totalOutstandingBalance = tasks.reduce((sum, t) => {
    const bal = Math.max(0, t.projectPrice - (t.amountPaid || 0));
    return sum + bal;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Clients
          </h1>
          <InfoTooltip content="Client relationships, deal values, payment history, and communication channels." />
        </div>

        <button
          onClick={onOpenNewContact}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-slate-500">Active Clients</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {activeClientsCount}
          </p>
          <span className="text-[10px] text-slate-400">currently collaborating</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-indigo-600 font-medium">Active Deliverables</span>
          <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
            {activeProjectsCount}
          </p>
          <span className="text-[10px] text-slate-400">across all clients</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-amber-600 font-medium">Outstanding Client Balances</span>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {formatCurrency(totalOutstandingBalance, 'USD')}
          </p>
          <span className="text-[10px] text-slate-400">pending payment collection</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
        {/* Tab Controls */}
        <div className="flex items-center gap-1 text-xs font-medium">
          <button
            onClick={() => setStatusTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusTab === 'active'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Active Clients
          </button>
          <button
            onClick={() => setStatusTab('archived')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusTab === 'archived'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Closed / Archived
          </button>
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusTab === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Clients
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Clients Grid (Strictly 2 columns on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-700">No matching clients found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add a new client or adjust your search filter.
            </p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientTasks = tasks.filter((t) => t.clientId === client.id);
            const activeCount = clientTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;
            const completedCount = clientTasks.filter((t) => t.status === 'completed').length;

            const clientPayments = payments.filter((p) => p.clientId === client.id);
            const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);

            const agreedTotal = clientTasks.reduce((sum, t) => sum + t.projectPrice, 0);
            const outstandingBalance = Math.max(0, agreedTotal - totalPaid);

            const trackedSeconds = timeEntries
              .filter((te) => te.clientId === client.id)
              .reduce((sum, te) => sum + te.durationSeconds, 0);

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md p-5 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {client.clientSource}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                        client.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Name & Company */}
                  <h3
                    onClick={() => onOpenClientDetails(client.id)}
                    className="text-base font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate"
                  >
                    {client.fullName}
                  </h3>
                  {client.companyName && (
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {client.companyName}
                    </p>
                  )}

                  {/* Contact Info Items */}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate font-mono">{client.phone}</span>
                      </div>
                    )}
                    {client.country && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{client.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Agreed Value</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(agreedTotal, client.preferredCurrency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Received</span>
                      <span className="font-bold text-emerald-600 font-mono tabular-nums">
                        {formatCurrency(totalPaid, client.preferredCurrency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Balance Owed</span>
                      <span className="font-bold text-amber-700 font-mono tabular-nums">
                        {formatCurrency(outstandingBalance, client.preferredCurrency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Hours Logged</span>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {(trackedSeconds / 3600).toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenClientDetails(client.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Full Profile</span>
                    <ExternalLink size={12} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenNewTaskWithClient(client)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      title="Add task for this client"
                    >
                      + Task
                    </button>
                    <button
                      onClick={() =>
                        updateClient(client.id, {
                          status: client.status === 'active' ? 'closed' : 'active',
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                      title={client.status === 'active' ? 'Close client (preserves records)' : 'Reactivate client'}
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
