import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Download, DollarSign, Percent } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvoiceLineItem, Invoice, InvoiceStatus } from '../../types';
import { formatCurrency } from '../../services/currency';
import { generateInvoicePDF } from '../../services/pdfGenerator';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    clientId: string;
    clientName: string;
    projectId?: string;
    projectName?: string;
    durationHours?: number;
    hourlyRate?: number;
    amount?: number;
  } | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  prefillData,
}) => {
  const { clients, tasks, addInvoice, settings, companyProfile, setCompanyProfileModalOpen } = useApp();

  const [clientId, setClientId] = useState(prefillData?.clientId || clients[0]?.id || '');
  const [projectId, setProjectId] = useState(prefillData?.projectId || '');
  const [currency, setCurrency] = useState('USD');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<InvoiceStatus>('issued');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(
    companyProfile?.paymentInstructions || companyProfile?.defaultInvoiceTerms || 'Net 14'
  );
  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li-1',
      description: prefillData?.projectName
        ? `Professional Services - ${prefillData.projectName}`
        : 'Consulting & Software Development',
      quantity: prefillData?.durationHours || 1,
      unitPrice: prefillData?.hourlyRate || prefillData?.amount || 500,
      amount: prefillData?.amount || 500,
    },
  ]);

  // Sync prefillData when modal opens
  useEffect(() => {
    if (prefillData) {
      if (prefillData.clientId) setClientId(prefillData.clientId);
      if (prefillData.projectId) setProjectId(prefillData.projectId);
      if (prefillData.amount) {
        setLineItems([
          {
            id: `li-${Date.now()}`,
            description: prefillData.projectName
              ? `Services on ${prefillData.projectName} (${prefillData.durationHours || 1} hrs)`
              : 'Billable Focus Work Session',
            quantity: prefillData.durationHours || 1,
            unitPrice: prefillData.hourlyRate || prefillData.amount,
            amount: prefillData.amount,
          },
        ]);
      }
    }
  }, [prefillData]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientProjects = tasks.filter((t) => t.clientId === clientId);

  // Math calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = Number(((subtotal * discountRate) / 100).toFixed(2));
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = Number(((afterDiscount * taxRate) / 100).toFixed(2));
  const total = Number((afterDiscount + taxAmount).toFixed(2));

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, val: unknown) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        item.amount = Number((Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2));
      }
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        description: 'Additional Milestone / Feature',
        quantity: 1,
        unitPrice: 100,
        amount: 100,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const newInv = addInvoice({
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      clientEmail: selectedClient.email,
      clientCompany: selectedClient.companyName,
      clientAddress: selectedClient.address,
      companyProfile, // Snapshot of company issuer details
      projectId: projectId || undefined,
      projectName: tasks.find((t) => t.id === projectId)?.name,
      issueDate,
      dueDate,
      currency,
      lineItems,
      subtotal,
      discountRate,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      status,
      notes,
      paymentTerms,
    });

    // Generate and download PDF immediately
    generateInvoicePDF(newInv, settings, companyProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Create & Issue Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* My Company / Seller Profile Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0 text-sm">
                {companyProfile?.businessLogo ? (
                  <img
                    src={companyProfile.businessLogo}
                    alt="Logo"
                    className="w-full h-full object-contain p-0.5 rounded-lg"
                  />
                ) : (
                  (companyProfile?.businessName || companyProfile?.fullName || 'M')[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Issued By (Seller Details)
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {companyProfile?.businessName || companyProfile?.fullName || 'My Freelance Studio'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {[companyProfile?.email, companyProfile?.address, companyProfile?.taxRegistrationNumber]
                    .filter(Boolean)
                    .join(' · ') || 'No address configured'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompanyProfileModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              {companyProfile?.businessName || companyProfile?.fullName ? 'My Company' : 'Add My Company'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Client *</label>
              <select
                required
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Related Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">General (No specific project)</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Currency *</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['USD', 'USDT', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="issued">Issued</option>
                <option value="draft">Draft</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Itemized Line Items
              </span>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="Item description / milestone"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white w-full sm:w-auto"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-right font-mono"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                      className="w-24 text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-right font-mono"
                    />
                    <span className="w-24 text-right font-mono font-bold text-slate-900 text-xs">
                      {formatCurrency(item.amount, currency, false)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, Discount, Tax, Total */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <div className="flex items-center gap-2">
                <span>Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-14 text-xs px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono"
                />
              </div>
              <span className="font-mono text-rose-600">
                -{formatCurrency(discountAmount, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tax (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-14 text-xs px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono"
                />
              </div>
              <span className="font-mono text-slate-900">
                +{formatCurrency(taxAmount, currency)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Invoice Amount</span>
              <span className="font-mono text-indigo-700">
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Terms & Bank/Crypto Details
            </label>
            <textarea
              rows={2}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
            />
          </div>

          {/* Footer Submit */}
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              <Download size={14} />
              <span>Issue Invoice & Download PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
