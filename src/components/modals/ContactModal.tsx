import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { CURRENCY_SYMBOLS } from '../../services/currency';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient?: Client | null;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, editingClient }) => {
  const { addClient, updateClient, deleteClient } = useApp();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientSource, setClientSource] = useState('Upwork');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('United States');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [pricingType, setPricingType] = useState<'hourly' | 'fixed'>('hourly');
  const [hourlyRate, setHourlyRate] = useState('65');
  const [fixedAgreedAmount, setFixedAgreedAmount] = useState('1500');
  const [agreedPaymentTerms, setAgreedPaymentTerms] = useState('Net 14');
  const [totalDealValue, setTotalDealValue] = useState('1500');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'closed' | 'archived'>('active');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setFullName(editingClient.fullName || '');
      setCompanyName(editingClient.companyName || '');
      setClientSource(editingClient.clientSource || 'Upwork');
      setEmail(editingClient.email || '');
      setPhone(editingClient.phone || '');
      setWebsite(editingClient.website || '');
      setAddress(editingClient.address || '');
      setCountry(editingClient.country || 'United States');
      setPreferredCurrency(editingClient.preferredCurrency || 'USD');
      setPricingType(editingClient.pricingType || 'hourly');
      setHourlyRate(editingClient.hourlyRate ? String(editingClient.hourlyRate) : '65');
      setFixedAgreedAmount(editingClient.fixedAgreedAmount ? String(editingClient.fixedAgreedAmount) : '1500');
      setAgreedPaymentTerms(editingClient.agreedPaymentTerms || 'Net 14');
      setTotalDealValue(editingClient.totalDealValue ? String(editingClient.totalDealValue) : '');
      setNotes(editingClient.notes || '');
      setStatus(editingClient.status || 'active');
    } else {
      setFullName('');
      setCompanyName('');
      setClientSource('Upwork');
      setEmail('');
      setPhone('');
      setWebsite('');
      setAddress('');
      setCountry('United States');
      setPreferredCurrency('USD');
      setPricingType('hourly');
      setHourlyRate('65');
      setFixedAgreedAmount('1500');
      setAgreedPaymentTerms('Net 14');
      setTotalDealValue('1500');
      setNotes('');
      setStatus('active');
    }
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const parsedHourly = Number(hourlyRate);
    const resolvedClientHourlyRate =
      pricingType === 'hourly'
        ? (parsedHourly > 0 ? parsedHourly : 50)
        : (editingClient?.hourlyRate && Number(editingClient.hourlyRate) > 0
            ? Number(editingClient.hourlyRate)
            : undefined);

    if (editingClient) {
      updateClient(editingClient.id, {
        fullName: fullName.trim(),
        companyName: companyName.trim() || undefined,
        clientSource,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        country,
        preferredCurrency,
        pricingType,
        hourlyRate: resolvedClientHourlyRate,
        fixedAgreedAmount: pricingType === 'fixed' ? Number(fixedAgreedAmount) || 0 : undefined,
        agreedPaymentTerms: agreedPaymentTerms.trim() || undefined,
        totalDealValue: Number(totalDealValue) || undefined,
        notes: notes.trim() || undefined,
        status,
      });
    } else {
      addClient({
        fullName: fullName.trim(),
        companyName: companyName.trim() || undefined,
        clientSource,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        country,
        preferredCurrency,
        pricingType,
        hourlyRate: resolvedClientHourlyRate,
        fixedAgreedAmount: pricingType === 'fixed' ? Number(fixedAgreedAmount) || 0 : undefined,
        agreedPaymentTerms: agreedPaymentTerms.trim() || undefined,
        totalDealValue: Number(totalDealValue) || undefined,
        notes: notes.trim() || undefined,
        status,
      });
    }

    onClose();
  };

  const handleDeleteProfile = () => {
    if (editingClient) {
      deleteClient(editingClient.id);
      setConfirmDeleteOpen(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingClient ? 'Edit Client Profile' : 'Add New Client / Contact'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name / Contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jason Scott"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Scott Design Co"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Source / Platform</label>
              <select
                value={clientSource}
                onChange={(e) => setClientSource(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Upwork', 'Fiverr', 'LinkedIn', 'Freelancer.com', 'PeoplePerHour', 'Guru', 'Direct Clients', 'Referral', 'Other'].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="jason@scottdesign.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="+1 555 0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country / Region</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing Type Selector */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Pricing Agreement Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPricingType('hourly')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    pricingType === 'hourly'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hourly Rate
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('fixed')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    pricingType === 'fixed'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Fixed Price
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Currency</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {['USD', 'PKR', 'USDT', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'BDT', 'AED', 'SAR'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {pricingType === 'hourly' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Hourly Rate ({CURRENCY_SYMBOLS[preferredCurrency] || preferredCurrency}/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Agreed Fixed Amount ({CURRENCY_SYMBOLS[preferredCurrency] || preferredCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fixedAgreedAmount}
                    onChange={(e) => setFixedAgreedAmount(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={agreedPaymentTerms}
                onChange={(e) => setAgreedPaymentTerms(e.target.value)}
                placeholder="e.g. Net 14 or Milestone Escrow"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'closed' | 'archived')}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Billing Address</label>
            <input
              type="text"
              placeholder="123 Market St, San Francisco, CA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes & Preferences</label>
            <textarea
              rows={2}
              placeholder="Communication channels, timezone, special requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            {editingClient ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Profile</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>{editingClient ? 'Save Changes' : 'Save Client'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Confirm Delete Profile Modal */}
        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Delete Client Profile</h3>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{fullName}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs cursor-pointer"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
