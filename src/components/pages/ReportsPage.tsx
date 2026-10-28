import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { exportToExcel } from '../../services/excelGenerator';
import { generateReportPDF } from '../../services/pdfGenerator';
import { InfoTooltip } from '../common/Tooltip';

export const ReportsPage: React.FC = () => {
  const {
    tasks,
    timeEntries,
    payments,
    invoices,
    expenses,
    clients,
    schedules,
    goals,
    displayCurrency,
    ratesData,
    settings,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedDateDrilldown, setSelectedDateDrilldown] = useState<string | null>(null);

  // 1. Monthly Overview Calculations for Selected Month
  const monthTasks = tasks.filter((t) => t.createdAt.startsWith(selectedMonth));
  const monthCompletedTasks = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(selectedMonth)
  );

  const monthGrossValue = monthTasks.reduce(
    (sum, t) => sum + convertCurrency(t.projectPrice, t.currency, displayCurrency, ratesData.rates),
    0
  );

  const monthFees = monthTasks.reduce((sum, t) => {
    const fee = (t.projectPrice * t.platformFeePercentage) / 100;
    return sum + convertCurrency(fee, t.currency, displayCurrency, ratesData.rates);
  }, 0);

  const monthNetEarnings = monthGrossValue - monthFees;

  const monthPayments = payments.filter((p) => p.date.startsWith(selectedMonth));
  const monthCashReceived = monthPayments.reduce(
    (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
    0
  );

  const monthOutstanding = tasks.reduce((sum, t) => {
    const bal = Math.max(0, t.projectPrice - (t.amountPaid || 0));
    return sum + convertCurrency(bal, t.currency, displayCurrency, ratesData.rates);
  }, 0);

  const monthTimeEntries = timeEntries.filter((te) => te.date.startsWith(selectedMonth));
  const monthTotalSeconds = monthTimeEntries.reduce((sum, te) => sum + te.durationSeconds, 0);
  const monthBillableSeconds = monthTimeEntries
    .filter((te) => te.isBillable)
    .reduce((sum, te) => sum + te.durationSeconds, 0);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const monthTotalExpenses = monthExpenses.reduce(
    (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
    0
  );

  const monthNetCashFlow = monthCashReceived - monthTotalExpenses;
  const monthNewClients = clients.filter((c) => c.createdAt.startsWith(selectedMonth)).length;

  // 2. Day-by-Day Activity for Selected Month
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const dateCount = new Date(year, month, 0).getDate();

    return Array.from({ length: dateCount }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;

      const dayDoneTasks = tasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(dayStr)
      ).length;

      const dayHours = (
        timeEntries
          .filter((te) => te.date === dayStr)
          .reduce((sum, te) => sum + te.durationSeconds, 0) / 3600
      ).toFixed(1);

      const dayIncome = payments
        .filter((p) => p.date === dayStr)
        .reduce(
          (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
          0
        );

      const dayExp = expenses
        .filter((e) => e.date === dayStr)
        .reduce(
          (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
          0
        );

      return {
        date: dayStr,
        dayNum,
        dayDoneTasks,
        dayHours: Number(dayHours),
        dayIncome,
        dayExp,
      };
    });
  }, [selectedMonth, tasks, timeEntries, payments, expenses, displayCurrency, ratesData.rates]);

  // 3. Six-Month Performance Trends
  const sixMonthsTrends = useMemo(() => {
    const list = [];
    const baseDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const prefix = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const income = payments
        .filter((p) => p.date.startsWith(prefix))
        .reduce(
          (sum, p) => sum + convertCurrency(p.amount, p.currency, displayCurrency, ratesData.rates),
          0
        );

      const exp = expenses
        .filter((e) => e.date.startsWith(prefix))
        .reduce(
          (sum, e) => sum + convertCurrency(e.amount, e.currency, displayCurrency, ratesData.rates),
          0
        );

      const delivered = tasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(prefix)
      ).length;

      const hrs = (
        timeEntries
          .filter((te) => te.date.startsWith(prefix))
          .reduce((s, te) => s + te.durationSeconds, 0) / 3600
      ).toFixed(0);

      list.push({
        prefix,
        label,
        income,
        exp,
        delivered,
        hours: Number(hrs),
      });
    }
    return list;
  }, [payments, expenses, tasks, timeEntries, displayCurrency, ratesData.rates]);

  // 4. Performance Highlights & Data Insights
  const highestEarningClient = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      map[p.clientName] = (map[p.clientName] || 0) + p.amount;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [payments]);

  const mostProfitablePlatform = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      const fee = (t.projectPrice * t.platformFeePercentage) / 100;
      const net = t.projectPrice - fee;
      map[t.platform] = (map[t.platform] || 0) + net;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { platform: sorted[0][0], net: sorted[0][1] } : null;
  }, [tasks]);

  const topExpenseCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { category: sorted[0][0], amount: sorted[0][1] } : null;
  }, [monthExpenses]);

  // 5. Export Actions
  const handleExportExcel = () => {
    const tasksData = tasks.map((t) => ({
      Project: t.name,
      Client: t.clientName,
      Platform: t.platform,
      Deadline: t.deadline,
      Status: t.status,
      GrossPrice: t.projectPrice,
      Currency: t.currency,
      FeePct: t.platformFeePercentage,
      AmountPaid: t.amountPaid,
    }));

    const paymentsData = payments.map((p) => ({
      Date: p.date,
      Client: p.clientName,
      Project: p.projectName || '',
      Amount: p.amount,
      Currency: p.currency,
      Method: p.paymentMethod,
    }));

    const expensesData = expenses.map((e) => ({
      Date: e.date,
      Title: e.title,
      Category: e.category,
      Amount: e.amount,
      Currency: e.currency,
      PaymentMethod: e.paymentMethod,
    }));

    const timeData = timeEntries.map((te) => ({
      Date: te.date,
      Project: te.projectName,
      Client: te.clientName,
      Hours: (te.durationSeconds / 3600).toFixed(2),
      Rate: te.hourlyRate,
      BillableValue: te.billableAmount,
      IsInvoiced: te.invoiceId ? 'Yes' : 'No',
    }));

    exportToExcel(`FreelanceOS_Executive_Report_${selectedMonth}`, [
      { name: 'Projects & Tasks', data: tasksData },
      { name: 'Payments Received', data: paymentsData },
      { name: 'Expenses', data: expensesData },
      { name: 'Time Entries', data: timeData },
    ]);
  };

  const handleExportPDF = () => {
    const summary = [
      { label: 'Cash Deposited', value: formatCurrency(monthCashReceived, displayCurrency) },
      { label: 'Expenses Incurred', value: formatCurrency(monthTotalExpenses, displayCurrency) },
      { label: 'Net Cash Flow', value: formatCurrency(monthNetCashFlow, displayCurrency) },
      { label: 'Billable Hours', value: `${(monthBillableSeconds / 3600).toFixed(1)} hrs` },
    ];

    const tables = [
      {
        title: 'Delivered Projects & Tasks',
        headers: ['Project', 'Client', 'Platform', 'Gross Value', 'Status'],
        rows: monthTasks.map((t) => [
          t.name,
          t.clientName,
          t.platform,
          formatCurrency(t.projectPrice, t.currency),
          t.status,
        ]),
      },
      {
        title: 'Recorded Payments Received',
        headers: ['Date', 'Client', 'Project', 'Amount', 'Method'],
        rows: monthPayments.map((p) => [
          p.date,
          p.clientName,
          p.projectName || 'General',
          formatCurrency(p.amount, p.currency),
          p.paymentMethod,
        ]),
      },
      {
        title: 'Expenses Incurred',
        headers: ['Date', 'Title', 'Category', 'Amount'],
        rows: monthExpenses.map((e) => [
          e.date,
          e.title,
          e.category,
          formatCurrency(e.amount, e.currency),
        ]),
      },
    ];

    generateReportPDF(
      'PlayBook Performance Report',
      `Monthly Executive Summary for ${selectedMonth} (Currency: ${displayCurrency})`,
      summary,
      tables
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports
          </h1>
          <InfoTooltip content="Monthly executive performance summaries, PDF exports, and Excel workbooks." />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
            title="Download multi-tab Excel spreadsheet"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            title="Generate executive PDF report"
          >
            <Download size={14} />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* A. Monthly Overview Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Executive Reconciliation for {selectedMonth}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-700">
            Base: {displayCurrency}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Gross Contracts</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
              {formatCurrency(monthGrossValue, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-400">total agreed</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Net After Fees</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
              {formatCurrency(monthNetEarnings, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-400">deductions removed</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-semibold block">Cash Deposited</span>
            <p className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-0.5 truncate">
              {formatCurrency(monthCashReceived, displayCurrency)}
            </p>
            <span className="text-[10px] text-emerald-600">actual received</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-700 font-semibold block">Total Expenses</span>
            <p className="text-base font-bold text-rose-700 font-mono tabular-nums mt-0.5 truncate">
              {formatCurrency(monthTotalExpenses, displayCurrency)}
            </p>
            <span className="text-[10px] text-rose-600">spent in month</span>
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-indigo-700 font-semibold block">Net Cash Flow</span>
            <p
              className={`text-base font-bold font-mono tabular-nums mt-0.5 truncate ${
                monthNetCashFlow >= 0 ? 'text-indigo-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(monthNetCashFlow, displayCurrency)}
            </p>
            <span className="text-[10px] text-indigo-600">cash minus expenses</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Billable Hours</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {(monthBillableSeconds / 3600).toFixed(1)} hrs
            </p>
            <span className="text-[10px] text-slate-400">tracked time</span>
          </div>
        </div>
      </div>

      {/* D. Data-Driven Performance Highlights */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs border border-slate-800">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles size={14} className="text-amber-400" />
          <span>Automated Performance Highlights & Intelligence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white/10 rounded-lg border border-white/10">
            <span className="text-slate-400 block text-[11px]">Highest-Earning Client</span>
            <p className="text-sm font-bold text-white mt-1">
              {highestEarningClient ? highestEarningClient.name : 'N/A'}
            </p>
            <span className="text-emerald-400 font-mono tabular-nums">
              {highestEarningClient ? formatCurrency(highestEarningClient.amount, 'USD') : '$0'}
            </span>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10">
            <span className="text-slate-400 block text-[11px]">Most Profitable Platform</span>
            <p className="text-sm font-bold text-white mt-1">
              {mostProfitablePlatform ? mostProfitablePlatform.platform : 'Direct Work'}
            </p>
            <span className="text-indigo-300 font-mono tabular-nums">
              {mostProfitablePlatform ? formatCurrency(mostProfitablePlatform.net, 'USD') : '$0'} net
            </span>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10">
            <span className="text-slate-400 block text-[11px]">Highest Expense Category</span>
            <p className="text-sm font-bold text-white mt-1 truncate">
              {topExpenseCategory ? topExpenseCategory.category : 'Operations'}
            </p>
            <span className="text-rose-300 font-mono tabular-nums">
              {topExpenseCategory ? formatCurrency(topExpenseCategory.amount, 'USD') : '$0'}
            </span>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10">
            <span className="text-slate-400 block text-[11px]">Client Acquisition</span>
            <p className="text-sm font-bold text-white mt-1">{monthNewClients} new clients</p>
            <span className="text-slate-300">onboarded in {selectedMonth}</span>
          </div>
        </div>
      </div>

      {/* C. Six-Month Performance Trend Visuals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Six-Month Performance Trends</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {sixMonthsTrends.map((m) => (
            <div key={m.prefix} className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-center transition-all duration-150 hover:border-slate-300 hover:shadow-xs">
              <span className="text-xs font-bold text-slate-800 block">{m.label}</span>
              <div className="my-2 space-y-1">
                <div className="text-xs font-bold font-mono text-emerald-600 truncate">
                  +{formatCurrency(m.income, displayCurrency)}
                </div>
                <div className="text-[11px] font-mono text-rose-600 truncate">
                  -{formatCurrency(m.exp, displayCurrency)}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-1">
                {m.delivered} done · {m.hours}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* B. Day-by-Day Activity for Selected Month */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Day-by-Day Activity Log ({selectedMonth})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-center">Tasks Delivered</th>
                <th className="py-2.5 px-4 text-center">Tracked Hours</th>
                <th className="py-2.5 px-4 text-right">Cash Received</th>
                <th className="py-2.5 px-4 text-right">Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daysInMonth.map((day) => {
                const hasActivity =
                  day.dayDoneTasks > 0 || day.dayHours > 0 || day.dayIncome > 0 || day.dayExp > 0;
                return (
                  <tr
                    key={day.date}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      hasActivity ? 'bg-white' : 'bg-slate-50/30 opacity-60'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                      {day.date}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                      {day.dayDoneTasks > 0 ? (
                        <span className="font-bold text-emerald-600">+{day.dayDoneTasks}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                      {day.dayHours > 0 ? `${day.dayHours}h` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {day.dayIncome > 0 ? (
                        <span className="font-bold text-emerald-600">
                          +{formatCurrency(day.dayIncome, displayCurrency)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {day.dayExp > 0 ? (
                        <span className="text-rose-600">
                          -{formatCurrency(day.dayExp, displayCurrency)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
