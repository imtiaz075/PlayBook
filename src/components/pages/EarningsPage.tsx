import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Plus,
  RefreshCw,
  Building,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { Payment } from '../../types';
import { InfoTooltip } from '../common/Tooltip';

interface EarningsPageProps {
  onOpenRecordPayment: () => void;
  onOpenClientDetails: (clientId: string) => void;
}

export const EarningsPage: React.FC<EarningsPageProps> = ({
  onOpenRecordPayment,
  onOpenClientDetails,
}) => {
  const {
    payments,
    tasks,
    invoices,
    clients,
    settings,
    displayCurrency,
    setDisplayCurrency,
    ratesData,
    refreshExchangeRates,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [currencyRefreshing, setCurrencyRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  // Handle currency refresh
  const handleRefreshRates = async () => {
    setCurrencyRefreshing(true);
    await refreshExchangeRates();
    setTimeout(() => setCurrencyRefreshing(false), 500);
  };

  // Filter payments by timeframe
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (timeframe === 'this_month') return p.date.startsWith(currentMonthPrefix);
      if (timeframe === 'last_month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const lastMonthPrefix = d.toISOString().substring(0, 7);
        return p.date.startsWith(lastMonthPrefix);
      }
      return true;
    });
  }, [payments, timeframe, currentMonthPrefix]);

  // Financial Calculations
  const paymentsReceived = filteredPayments.reduce(
    (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
    0
  );

  // Invoiced Revenue for current period
  const invoicedRevenue = invoices
    .filter((inv) => (timeframe === 'this_month' ? inv.issueDate.startsWith(currentMonthPrefix) : true))
    .reduce(
      (sum, inv) => sum + convertCurrency(inv.total, inv.currency, displayCurrency, ratesData.rates),
      0
    );

  // Outstanding Client Payments
  const outstandingClientPayments = tasks.reduce((sum, t) => {
    const bal = Math.max(0, t.projectPrice - (t.amountPaid || 0));
    return sum + convertCurrency(bal, t.currency, displayCurrency, ratesData.rates);
  }, 0);

  // Expected Platform Payouts (pending clearance)
  const expectedPlatformPayouts = tasks
    .filter((t) => t.status === 'completed' && t.payoutStatus === 'pending')
    .reduce((sum, t) => {
      const fee = (t.projectPrice * t.platformFeePercentage) / 100;
      const net = t.projectPrice - fee;
      return sum + convertCurrency(net, t.currency, displayCurrency, ratesData.rates);
    }, 0);

  // Gross Project Value for tasks completed or created in period
  const grossProjectsValue = tasks.reduce(
    (sum, t) => sum + convertCurrency(t.projectPrice, t.currency, displayCurrency, ratesData.rates),
    0
  );

  // Total Platform Fees
  const totalPlatformFees = tasks.reduce((sum, t) => {
    const fee = (t.projectPrice * t.platformFeePercentage) / 100;
    return sum + convertCurrency(fee, t.currency, displayCurrency, ratesData.rates);
  }, 0);

  const netProjectEarnings = grossProjectsValue - totalPlatformFees;

  // Monthly Earnings Goal Progress
  const targetMonthlyGoal = settings.monthlyEarningsGoal || 6000;
  const currentMonthCash = payments
    .filter((p) => p.date.startsWith(currentMonthPrefix))
    .reduce(
      (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
      0
    );
  const goalPercentage = Math.min(100, Math.round((currentMonthCash / targetMonthlyGoal) * 100));
  const remainingNeeded = Math.max(0, targetMonthlyGoal - currentMonthCash);

  // Earnings by Client
  const clientEarnings = useMemo(() => {
    const clientMap: Record<
      string,
      { clientId: string; name: string; billed: number; received: number; balance: number }
    > = {};

    clients.forEach((c) => {
      clientMap[c.id] = {
        clientId: c.id,
        name: c.fullName,
        billed: 0,
        received: 0,
        balance: 0,
      };
    });

    tasks.forEach((t) => {
      if (!clientMap[t.clientId]) {
        clientMap[t.clientId] = {
          clientId: t.clientId,
          name: t.clientName,
          billed: 0,
          received: 0,
          balance: 0,
        };
      }
      const convertedPrice = convertCurrency(t.projectPrice, t.currency, displayCurrency, ratesData.rates);
      const convertedPaid = convertCurrency(t.amountPaid || 0, t.currency, displayCurrency, ratesData.rates);
      clientMap[t.clientId].billed += convertedPrice;
      clientMap[t.clientId].received += convertedPaid;
      clientMap[t.clientId].balance += Math.max(0, convertedPrice - convertedPaid);
    });

    return Object.values(clientMap).sort((a, b) => b.received - a.received);
  }, [clients, tasks, displayCurrency, ratesData.rates]);

  // Earnings by Platform
  const platformEarnings = useMemo(() => {
    const map: Record<string, { gross: number; fees: number; net: number }> = {};
    tasks.forEach((t) => {
      if (!map[t.platform]) {
        map[t.platform] = { gross: 0, fees: 0, net: 0 };
      }
      const gross = convertCurrency(t.projectPrice, t.currency, displayCurrency, ratesData.rates);
      const fee = (gross * t.platformFeePercentage) / 100;
      map[t.platform].gross += gross;
      map[t.platform].fees += fee;
      map[t.platform].net += gross - fee;
    });
    return Object.entries(map);
  }, [tasks, displayCurrency, ratesData.rates]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Earnings
          </h1>
          <InfoTooltip content="Real cashflow tracking, platform fee reconciliations, and payout clearances." />
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Rates */}
          <button
            onClick={handleRefreshRates}
            disabled={currencyRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            title="Refresh exchange rates"
          >
            <RefreshCw size={14} className={currencyRefreshing ? 'animate-spin' : ''} />
            <span>Update Rates</span>
          </button>

          <button
            onClick={onOpenRecordPayment}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Currency & Timeframe Selector Bar */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Display Currency:</span>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {['USD', 'USDT', 'EUR', 'GBP', 'PKR', 'INR', 'BDT', 'AED', 'SAR', 'CAD', 'AUD'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            (Original transactions preserved; converted using current rates)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setTimeframe('this_month')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              timeframe === 'this_month'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('last_month')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              timeframe === 'last_month'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              timeframe === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-emerald-600 font-semibold">Cash Deposited</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(paymentsReceived, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">actual received cash</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-indigo-600 font-semibold">Invoiced Revenue</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(invoicedRevenue, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">billed in invoices</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-amber-600 font-semibold">Pending Client Balances</span>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(outstandingClientPayments, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">unpaid project work</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <span className="text-xs text-purple-600 font-semibold">Platform Clearances</span>
          <p className="text-2xl font-bold text-purple-700 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(expectedPlatformPayouts, displayCurrency)}
          </p>
          <span className="text-[10px] text-slate-400">pending platform releases</span>
        </div>
      </div>

      {/* C. Monthly Goal Progress Bar Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Monthly Earnings Target Progress</h2>
            <p className="text-xs text-slate-500">
              Target: {formatCurrency(targetMonthlyGoal, displayCurrency)} · Received so far:{' '}
              {formatCurrency(currentMonthCash, displayCurrency)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {goalPercentage}%
            </span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${goalPercentage}%` }}
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
          <span>{formatCurrency(currentMonthCash, displayCurrency)} collected</span>
          <span>{formatCurrency(remainingNeeded, displayCurrency)} needed to reach target</span>
        </div>
      </div>

      {/* Platform & Client Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings by Client */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Earnings by Client</h3>
            <p className="text-xs text-slate-500">Ranked by total payments received</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4 text-right">Agreed</th>
                  <th className="py-2.5 px-4 text-right">Received</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientEarnings.slice(0, 6).map((c) => (
                  <tr key={c.clientId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => onOpenClientDetails(c.clientId)}
                        className="hover:text-indigo-600 hover:underline text-left truncate block max-w-[140px]"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(c.billed, displayCurrency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-600">
                      {formatCurrency(c.received, displayCurrency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                      {formatCurrency(c.balance, displayCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings by Platform */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Earnings by Platform</h3>
          </div>

          <div className="p-4 space-y-3">
            {platformEarnings.map(([platName, stats]) => (
              <div key={platName} className="p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-150 hover:border-slate-300 hover:shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{platName}</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                    Net: {formatCurrency(stats.net, displayCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Gross: {formatCurrency(stats.gross, displayCurrency)}</span>
                  <span className="text-rose-600 font-mono">
                    Fees: -{formatCurrency(stats.fees, displayCurrency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Payment History Ledger</h2>
          </div>
          <button
            onClick={onOpenRecordPayment}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            + Record New Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Client & Project</th>
                <th className="py-3 px-5">Invoice Reference</th>
                <th className="py-3 px-5">Payment Method</th>
                <th className="py-3 px-5 text-right">Original Amount</th>
                <th className="py-3 px-5 text-right">Converted ({displayCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No payments recorded for this timeframe. Click "+ Record Payment" to log funds.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const converted = convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono tabular-nums text-slate-600">
                        {p.date}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p.clientName}</p>
                        {p.projectName && (
                          <p className="text-[11px] text-slate-500">{p.projectName}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                        {p.invoiceNumber || 'Direct Payment'}
                      </td>
                      <td className="py-3.5 px-5 uppercase text-[10px] font-semibold text-slate-600">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-semibold text-slate-800">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-bold text-emerald-600">
                        {formatCurrency(converted, displayCurrency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
