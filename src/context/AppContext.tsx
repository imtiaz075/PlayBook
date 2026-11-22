import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Client,
  Task,
  TimeEntry,
  Invoice,
  Payment,
  ScheduleItem,
  Goal,
  BudgetCategory,
  Expense,
  Subscription,
  SavingsTarget,
  UserSettings,
  ActiveTimer,
  AppNotification,
  WorkdayState,
  WorkdayStatus,
  WorkdaySummary,
  PersonalWorkSession,
  NeedsAttentionSettings,
  CompanyProfile,
  PlanBudget,
  BudgetCategoryAllocation,
} from '../types';
import { getStoredRates, saveRates, fetchLiveRates, ExchangeRatesData } from '../services/currency';
import { playNotificationChime } from '../services/audio';
import { parseDeadlineTarget, TWELVE_HOURS_MS } from '../services/deadline';
import { useAuth } from './AuthContext';
import { loadUserWorkspace, saveUserWorkspace } from '../services/firebase';

// Initial default seed data ensuring immediate rich usability and testing
const SEED_CLIENTS: Client[] = [
  {
    id: 'c-1',
    fullName: 'Alex Vance',
    companyName: 'Apex Innovations',
    clientSource: 'Fiverr',
    email: 'alex.vance@apexinno.io',
    phone: '+1 415 892 0112',
    website: 'https://apexinno.io',
    address: '101 California St, San Francisco, CA',
    country: 'United States',
    preferredCurrency: 'USDT',
    pricingType: 'hourly',
    hourlyRate: 50,
    agreedPaymentTerms: 'Net 15 via Platform Escrow',
    totalDealValue: 1200,
    notes: 'Long-term client for React & TypeScript full-stack web applications.',
    status: 'active',
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-10-20T14:30:00.000Z',
  },
  {
    id: 'c-2',
    fullName: 'Sophia Martinez',
    companyName: 'Lumina Creative Agency',
    clientSource: 'Upwork',
    email: 'smartinez@luminacreative.co',
    phone: '+1 212 555 0198',
    website: 'https://luminacreative.co',
    address: '450 Lexington Ave, New York, NY',
    country: 'United States',
    preferredCurrency: 'USD',
    pricingType: 'hourly',
    hourlyRate: 65,
    agreedPaymentTerms: 'Milestone escrow approval on submission',
    totalDealValue: 3500,
    notes: 'High-touch branding and UI/UX design engineering.',
    status: 'active',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-10-25T11:20:00.000Z',
  },
  {
    id: 'c-3',
    fullName: 'Marcus Sterling',
    companyName: 'Sterling Global Capital',
    clientSource: 'Direct Clients',
    email: 'marcus@sterlingcapital.com',
    phone: '+44 20 7946 0912',
    website: 'https://sterlingcapital.com',
    address: '30 St Mary Axe, London, UK',
    country: 'United Kingdom',
    preferredCurrency: 'USD',
    pricingType: 'hourly',
    hourlyRate: 85,
    agreedPaymentTerms: '50% advance, 50% on completion via wire',
    totalDealValue: 5000,
    notes: 'Direct client. 0% platform fee. Very reliable wire payments.',
    status: 'active',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-10-26T16:00:00.000Z',
  },
  {
    id: 'c-4',
    fullName: 'Elena Rostova',
    companyName: 'Nordic Digital Media',
    clientSource: 'LinkedIn',
    email: 'elena@nordicdigital.se',
    country: 'Sweden',
    preferredCurrency: 'EUR',
    pricingType: 'fixed',
    hourlyRate: 60,
    totalDealValue: 1800,
    status: 'active',
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-24T09:00:00.000Z',
  },
];

const getUpcomingDeadline = (hoursFromNow: number) => {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  const dateStr = d.toISOString().split('T')[0];
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date: dateStr, time: timeStr };
};

const SEED_TASKS: Task[] = [
  {
    id: 't-urgent',
    name: 'Apex API Production Security Verification',
    clientId: 'c-1',
    clientName: 'Alex Vance',
    platform: 'Fiverr',
    deadline: getUpcomingDeadline(6).date,
    dueTime: getUpcomingDeadline(6).time,
    startDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    status: 'in_progress',
    priceType: 'fixed',
    projectPrice: 350,
    currency: 'USDT',
    platformFeePercentage: 20,
    amountPaid: 0,
    totalTimeTrackedSeconds: 3600,
    deadlineAlertEnabled: true,
    notes: 'Urgent security verification audit due in 6 hours.',
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
  },
  {
    id: 't-1',
    name: 'Fiverr Webhook Integration & API Testing',
    clientId: 'c-1',
    clientName: 'Alex Vance',
    platform: 'Fiverr',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startDate: '2026-10-20',
    priority: 'high',
    status: 'in_progress',
    priceType: 'fixed',
    projectPrice: 100,
    currency: 'USDT',
    platformFeePercentage: 20,
    amountPaid: 0,
    totalTimeTrackedSeconds: 7200,
    deadlineAlertEnabled: true,
    notes: 'Fiverr project worth 100 USDT with 20% fee produces 80 USDT net.',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
  },
  {
    id: 't-2',
    name: 'Lumina Brand Dashboard Refactor',
    clientId: 'c-2',
    clientName: 'Sophia Martinez',
    platform: 'Upwork',
    deadline: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    startDate: '2026-10-10',
    priority: 'high',
    status: 'open',
    priceType: 'fixed',
    projectPrice: 800,
    currency: 'USD',
    platformFeePercentage: 15,
    amountPaid: 500,
    totalTimeTrackedSeconds: 14400,
    deadlineAlertEnabled: true,
    notes: 'Overdue deadline. 500 paid, 300 balance remaining.',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-27T08:00:00.000Z',
  },
  {
    id: 't-3',
    name: 'Sterling Capital Financial Portal',
    clientId: 'c-3',
    clientName: 'Marcus Sterling',
    platform: 'Direct Clients',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    startDate: '2026-10-12',
    priority: 'medium',
    status: 'in_progress',
    priceType: 'hourly',
    hourlyRate: 85,
    projectPrice: 2550,
    currency: 'USD',
    platformFeePercentage: 0,
    amountPaid: 1200,
    totalTimeTrackedSeconds: 36000,
    deadlineAlertEnabled: true,
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-26T12:00:00.000Z',
  },
  {
    id: 't-4',
    name: 'Mobile App Wireframes & Interactive Prototype',
    clientId: 'c-4',
    clientName: 'Elena Rostova',
    platform: 'LinkedIn',
    deadline: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    startDate: '2026-10-05',
    priority: 'medium',
    status: 'completed',
    priceType: 'fixed',
    projectPrice: 600,
    currency: 'EUR',
    platformFeePercentage: 0,
    amountPaid: 600,
    totalTimeTrackedSeconds: 28800,
    completedAt: '2026-10-24T15:00:00.000Z',
    payoutExpectedDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    payoutStatus: 'pending',
    deadlineAlertEnabled: false,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-24T15:00:00.000Z',
  },
];

const SEED_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'te-1',
    clientId: 'c-3',
    projectId: 't-3',
    projectName: 'Sterling Capital Financial Portal',
    clientName: 'Marcus Sterling',
    date: new Date().toISOString().split('T')[0],
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date().toISOString(),
    durationSeconds: 10800,
    hourlyRate: 85,
    isBillable: true,
    billableAmount: 255,
    description: 'Built multi-currency transaction ledger table with filtering and sorting.',
    invoiceId: null,
    createdAt: '2026-10-27T12:00:00.000Z',
  },
  {
    id: 'te-2',
    clientId: 'c-1',
    projectId: 't-1',
    projectName: 'Fiverr Webhook Integration & API Testing',
    clientName: 'Alex Vance',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    startTime: '2026-10-26T14:00:00.000Z',
    endTime: '2026-10-26T16:00:00.000Z',
    durationSeconds: 7200,
    hourlyRate: 50,
    isBillable: true,
    billableAmount: 100,
    description: 'Automated webhook payloads validation and signature verification.',
    invoiceId: null,
    createdAt: '2026-10-26T16:00:00.000Z',
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    clientId: 'c-2',
    clientName: 'Sophia Martinez',
    clientEmail: 'smartinez@luminacreative.co',
    clientCompany: 'Lumina Creative Agency',
    clientAddress: '450 Lexington Ave, New York, NY',
    projectId: 't-2',
    projectName: 'Lumina Brand Dashboard Refactor',
    issueDate: '2026-10-15',
    dueDate: '2026-10-30',
    currency: 'USD',
    lineItems: [
      {
        id: 'li-1',
        description: 'Sprint 1 UI Component Refactor & Design System Tokens',
        quantity: 1,
        unitPrice: 800,
        amount: 800,
      },
    ],
    subtotal: 800,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 800,
    amountPaid: 500,
    balanceDue: 300,
    status: 'partially_paid',
    paymentTerms: 'Payment due within 15 days via Upwork Escrow or direct transfer.',
    notes: 'Initial milestone released ($500). Remaining $300 due upon final acceptance.',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    clientId: 'c-4',
    clientName: 'Elena Rostova',
    clientEmail: 'elena@nordicdigital.se',
    clientCompany: 'Nordic Digital Media',
    projectId: 't-4',
    projectName: 'Mobile App Wireframes & Interactive Prototype',
    issueDate: '2026-10-24',
    dueDate: '2026-11-08',
    currency: 'EUR',
    lineItems: [
      {
        id: 'li-2',
        description: 'Complete Figma UI wireframe specifications and prototype user testing',
        quantity: 1,
        unitPrice: 600,
        amount: 600,
      },
    ],
    subtotal: 600,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 600,
    amountPaid: 600,
    balanceDue: 0,
    status: 'paid',
    paymentTerms: 'Paid in full via Bank Wire.',
    createdAt: '2026-10-24T15:00:00.000Z',
    updatedAt: '2026-10-25T11:00:00.000Z',
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'p-1',
    clientId: 'c-2',
    clientName: 'Sophia Martinez',
    projectId: 't-2',
    projectName: 'Lumina Brand Dashboard Refactor',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    date: '2026-10-22',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'upwork',
    notes: 'First milestone approved and released by Sophia.',
    createdAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'p-2',
    clientId: 'c-4',
    clientName: 'Elena Rostova',
    projectId: 't-4',
    projectName: 'Mobile App Wireframes & Interactive Prototype',
    invoiceId: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    date: '2026-10-25',
    amount: 600,
    currency: 'EUR',
    paymentMethod: 'bank_transfer',
    notes: 'Full payment received in EUR.',
    createdAt: '2026-10-25T11:00:00.000Z',
  },
  {
    id: 'p-3',
    clientId: 'c-3',
    clientName: 'Marcus Sterling',
    projectId: 't-3',
    projectName: 'Sterling Capital Financial Portal',
    date: '2026-10-12',
    amount: 1200,
    currency: 'USD',
    paymentMethod: 'wise',
    notes: 'Upfront deposit for project kickoff.',
    createdAt: '2026-10-12T11:00:00.000Z',
  },
];

const SEED_SCHEDULES: ScheduleItem[] = [
  {
    id: 's-urgent',
    title: 'Emergency Client Sync & Code Review',
    date: getUpcomingDeadline(3).date,
    startTime: getUpcomingDeadline(3).time,
    durationMinutes: 30,
    type: 'activity',
    notes: 'Critical code review before production release.',
    isCompleted: false,
    alertAtTime: true,
    advanceReminderMinutes: 15,
    repeatSetting: 'none',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's-1',
    title: 'Client Sprint Alignment with Sophia Martinez',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    endTime: '11:45',
    durationMinutes: 45,
    type: 'activity',
    notes: 'Review overdue UI deliverables and finalize acceptance scope.',
    isCompleted: false,
    alertAtTime: true,
    advanceReminderMinutes: 15,
    repeatSetting: 'weekly',
    createdAt: '2026-10-20T08:00:00.000Z',
  },
  {
    id: 's-2',
    title: 'Deliver Fiverr Webhook Milestone Submission',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:30',
    type: 'reminder',
    notes: 'Upload build zip and post walkthrough video to Fiverr buyer order page.',
    isCompleted: false,
    alertAtTime: true,
    advanceReminderMinutes: 30,
    repeatSetting: 'none',
    createdAt: '2026-10-22T09:00:00.000Z',
  },
  {
    id: 's-3',
    title: 'Weekly Expense & Invoice Reconciliation',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '17:00',
    durationMinutes: 30,
    type: 'activity',
    notes: 'Review pending receipts and check bank balances.',
    isCompleted: false,
    alertAtTime: true,
    advanceReminderMinutes: 0,
    repeatSetting: 'weekly',
    createdAt: '2026-10-15T12:00:00.000Z',
  },
];

const SEED_GOALS: Goal[] = [
  {
    id: 'g-1',
    name: 'October Target',
    category: 'achievements',
    targetDate: '2026-10-31',
    targetValue: 6000,
    currentActualValue: 4050,
    progressPercentage: 67.5,
    measurementMethod: 'numeric_auto',
    priority: 'high',
    isCompleted: false,
    status: 'in_progress',
    notes: 'Monthly earnings target',
    milestones: [
      { id: 'm-1', title: 'Reach $2,000 earned', targetDate: '2026-10-10', isCompleted: true },
      { id: 'm-2', title: 'Reach $4,000 earned', targetDate: '2026-10-20', isCompleted: true },
      { id: 'm-3', title: 'Close remaining pending contracts ($6,000)', targetDate: '2026-10-31', isCompleted: false },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'g-2',
    name: 'Q4 Projects Target',
    category: 'career',
    targetDate: '2026-12-31',
    targetValue: 6,
    currentActualValue: 3,
    progressPercentage: 50,
    measurementMethod: 'milestones',
    priority: 'medium',
    isCompleted: false,
    status: 'in_progress',
    notes: 'Client projects delivery',
    milestones: [
      { id: 'm-4', title: 'Deliver Nordic Digital Media prototype', targetDate: '2026-10-24', isCompleted: true },
      { id: 'm-5', title: 'Deliver Apex Fiverr Webhook integration', targetDate: '2026-10-29', isCompleted: false },
      { id: 'm-6', title: 'Deliver Lumina Brand Dashboard', targetDate: '2026-11-15', isCompleted: false },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'g-3',
    name: 'Hours Target',
    category: 'learning',
    targetDate: '2026-10-31',
    targetValue: 100,
    currentActualValue: 72,
    progressPercentage: 72,
    measurementMethod: 'numeric_auto',
    priority: 'medium',
    isCompleted: false,
    status: 'in_progress',
    notes: 'Billable work hours',
    milestones: [],
    createdAt: '2026-10-01T08:00:00.000Z',
  },
];

const SEED_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: 'cat-1', name: 'Software & Subscriptions', monthlyLimit: 300, currency: 'USD', color: '#6366f1', iconName: 'Folder' },
  { id: 'cat-2', name: 'Business Expenses & Hardware', monthlyLimit: 500, currency: 'USD', color: '#10b981', iconName: 'Laptop' },
  { id: 'cat-3', name: 'Rent and Housing', monthlyLimit: 1400, currency: 'USD', color: '#f59e0b', iconName: 'Home' },
  { id: 'cat-4', name: 'Food and Groceries', monthlyLimit: 600, currency: 'USD', color: '#ef4444', iconName: 'ShoppingBag' },
  { id: 'cat-5', name: 'Internet and Mobile', monthlyLimit: 120, currency: 'USD', color: '#8b5cf6', iconName: 'Wifi' },
  { id: 'cat-6', name: 'Health & Insurance', monthlyLimit: 250, currency: 'USD', color: '#ec4899', iconName: 'Heart' },
  { id: 'cat-7', name: 'Education & Courses', monthlyLimit: 150, currency: 'USD', color: '#06b6d4', iconName: 'BookOpen' },
  { id: 'cat-8', name: 'Taxes Reserve', monthlyLimit: 1000, currency: 'USD', color: '#64748b', iconName: 'DollarSign' },
  { id: 'cat-9', name: 'Savings Target', monthlyLimit: 1200, currency: 'USD', color: '#14b8a6', iconName: 'PiggyBank' },
  { id: 'cat-10', name: 'Entertainment', monthlyLimit: 200, currency: 'USD', color: '#f97316', iconName: 'Film' },
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'e-1',
    title: 'GitHub Copilot & GitHub Team',
    amount: 25,
    currency: 'USD',
    category: 'Software & Subscriptions',
    date: '2026-10-05',
    paymentMethod: 'Credit Card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    notes: 'Essential developer tooling.',
    createdAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'e-2',
    title: 'Vercel Pro & Cloudflare Hosting',
    amount: 40,
    currency: 'USD',
    category: 'Software & Subscriptions',
    date: '2026-10-10',
    paymentMethod: 'Credit Card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    notes: 'Client staging domains and CDN.',
    createdAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'e-3',
    title: 'Figma Organization Seat',
    amount: 45,
    currency: 'USD',
    category: 'Software & Subscriptions',
    date: '2026-10-12',
    paymentMethod: 'Credit Card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    createdAt: '2026-10-12T09:00:00.000Z',
  },
  {
    id: 'e-4',
    title: 'Ergonomic Mechanical Keyboard & Wrist Rest',
    amount: 185,
    currency: 'USD',
    category: 'Business Expenses & Hardware',
    date: '2026-10-18',
    paymentMethod: 'Debit Card',
    isRecurring: false,
    notes: 'Productivity equipment upgrade.',
    createdAt: '2026-10-18T14:00:00.000Z',
  },
  {
    id: 'e-5',
    title: 'High-Speed Fiber Internet (1 Gbps)',
    amount: 85,
    currency: 'USD',
    category: 'Internet and Mobile',
    date: '2026-10-02',
    paymentMethod: 'Direct Debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    createdAt: '2026-10-02T08:00:00.000Z',
  },
];

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    name: 'GitHub Team & Copilot',
    cost: 25,
    currency: 'USD',
    category: 'Software & Subscriptions',
    billingCycle: 'monthly',
    renewalDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    autoRenew: true,
    reminderDaysBefore: 3,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'sub-2',
    name: 'Figma Professional',
    cost: 45,
    currency: 'USD',
    category: 'Software & Subscriptions',
    billingCycle: 'monthly',
    renewalDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    autoRenew: true,
    reminderDaysBefore: 2,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'sub-3',
    name: 'JetBrains All Products Pack',
    cost: 249,
    currency: 'USD',
    category: 'Software & Subscriptions',
    billingCycle: 'yearly',
    renewalDate: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
    autoRenew: true,
    reminderDaysBefore: 7,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

const SEED_ID_SET = new Set<string>([
  ...SEED_CLIENTS.map((c) => c.id),
  ...SEED_TASKS.map((t) => t.id),
  ...SEED_TIME_ENTRIES.map((te) => te.id),
  ...SEED_INVOICES.map((inv) => inv.id),
  ...SEED_PAYMENTS.map((p) => p.id),
  ...SEED_SCHEDULES.map((s) => s.id),
  ...SEED_GOALS.map((g) => g.id),
  ...SEED_BUDGET_CATEGORIES.map((b) => b.id),
  ...SEED_EXPENSES.map((e) => e.id),
  ...SEED_SUBSCRIPTIONS.map((sub) => sub.id),
  'pb-1',
]);

const SEED_SETTINGS: UserSettings = {
  userName: 'Sarah Jenkins',
  userEmail: 'sarah.jenkins.dev@gmail.com',
  businessName: 'Jenkins Digital Studio',
  defaultCurrency: 'USD',
  defaultHourlyRate: 75,
  platformFees: {
    Fiverr: 20,
    Upwork: 15,
    'Freelancer.com': 10,
    PeoplePerHour: 15,
    Guru: 9,
    LinkedIn: 0,
    'Direct Clients': 0,
    Other: 5,
  },
  notificationPreferences: {
    email: true,
    browser: true,
    sound: true,
    leadTimeHours: 24,
  },
};

interface AppContextType {
  // Navigation
  activePage: string;
  setActivePage: (page: string) => void;

  // Data Collections
  clients: Client[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  payments: Payment[];
  schedules: ScheduleItem[];
  goals: Goal[];
  budgetCategories: BudgetCategory[];
  expenses: Expense[];
  subscriptions: Subscription[];
  savingsTargets: SavingsTarget[];
  settings: UserSettings;

  // Company Profile & Plan Budgets
  companyProfile: CompanyProfile;
  updateCompanyProfile: (updates: Partial<CompanyProfile>) => void;
  companyProfileModalOpen: boolean;
  setCompanyProfileModalOpen: (open: boolean) => void;

  planBudgets: PlanBudget[];
  addPlanBudget: (budgetData: Omit<PlanBudget, 'id' | 'createdAt'>) => PlanBudget;
  updatePlanBudget: (id: string, updates: Partial<PlanBudget>) => void;
  deletePlanBudget: (id: string) => void;
  planBudgetModalOpen: boolean;
  setPlanBudgetModalOpen: (open: boolean) => void;

  expenseModalOpen: boolean;
  setExpenseModalOpen: (open: boolean) => void;

  // Exchange Rates & Currency
  ratesData: ExchangeRatesData;
  displayCurrency: string;
  setDisplayCurrency: (curr: string) => void;
  refreshExchangeRates: () => Promise<void>;
  updateCustomRates: (newRates: Record<string, number>) => void;

  // Timer State
  activeTimer: ActiveTimer;
  startTimer: (projectId?: string, clientId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  clearActiveTimer: () => void;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  timerSeconds: number;
  formatTimerTime: (seconds: number) => string;

  // Timer Completion Popup
  completedSessionSummary: {
    visible: boolean;
    durationSeconds: number;
    billableValue: number;
    projectName: string;
    clientName: string;
    projectId: string;
    clientId: string;
    hourlyRate: number;
  } | null;
  dismissCompletedSessionSummary: () => void;

  // Quick Add Modal & Sub-Modals
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'alert' | 'success', linkPage?: string, itemId?: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // CRUD Operations
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'amountPaid' | 'totalTimeTrackedSeconds'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => TimeEntry;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  addSchedule: (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'isCompleted'>) => ScheduleItem;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleComplete: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'isCompleted' | 'currentActualValue'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addBudgetCategory: (category: Omit<BudgetCategory, 'id'>) => BudgetCategory;
  updateBudgetCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteBudgetCategory: (id: string) => void;

  addSubscription: (sub: Omit<Subscription, 'id'>) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Working Hours Timer
  workdayState: WorkdayState;
  startWorkday: () => void;
  pauseWorkday: () => void;
  resumeWorkday: () => void;
  startBreak: () => void;
  resumeFromBreak: () => void;
  skipBreak: () => void;
  endWorkday: () => void;
  updateWorkdayConfig: (targetWorkMinutes: number, targetBreakMinutes: number) => void;
  workdaySummary: WorkdaySummary | null;
  workdaySummaryOpen: boolean;
  setWorkdaySummaryOpen: (open: boolean) => void;
  saveWorkdaySummaryNotes: (id: string, notes: string) => void;
  workdayHistory: WorkdaySummary[];

  // Personal Working Sessions (Strictly separate from Client-Billing Timer)
  personalSessions: PersonalWorkSession[];
  activePersonalSession: PersonalWorkSession | null;
  getPersonalDailyTotalSeconds: (targetDateStr?: string) => number;
  getPersonalWeeklyTotalSeconds: (referenceDate?: Date) => number;
  getPersonalMonthlyTotalSeconds: (targetMonthStr?: string) => number;
  calculateSessionSecondsForDay: (session: PersonalWorkSession, targetDateStr: string, currentTimestamp?: number) => number;
  deletePersonalSession: (id: string) => void;

  // Needs Attention Recurring Reminders
  needsAttentionSettings: NeedsAttentionSettings;
  updateNeedsAttentionSettings: (settings: Partial<NeedsAttentionSettings>) => void;
  dismissAttentionItem: (id: string) => void;

  // Search & Global state
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Workspace Backup & Cross-Domain Recovery
  exportWorkspaceJSON: () => string;
  importWorkspaceJSON: (jsonStr: string) => boolean;
  restoreEmergencyBackup: () => boolean;
  hasEmergencyBackup: boolean;
  retryCloudSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Owner-aware, non-destructive collection merger:
 * - Never re-injects demo SEED_* items into an existing cloud workspace when localStorage is fresh/unowned.
 * - Preserves genuinely user-created local/offline records and newer updates.
 * - Respects user deletions via deletedIds tombstones.
 */
function mergeCollections<T extends { id?: string; updatedAt?: string; createdAt?: string }>(
  cloudList: T[] | undefined,
  localList: T[],
  options: {
    treatLocalAsUserOwned: boolean;
    deletedIds: Set<string>;
  }
): T[] {
  const { treatLocalAsUserOwned, deletedIds } = options;

  // If cloud has this collection and local storage only held default SEED_* data (or belonged to a different user),
  // trust the cloud collection verbatim (even if empty []) so deleted demo items never resurrect!
  if (Array.isArray(cloudList) && !treatLocalAsUserOwned) {
    return cloudList;
  }

  // If cloud does not have this field at all yet, keep user-owned local items or seed defaults
  if (!Array.isArray(cloudList)) {
    return Array.isArray(localList)
      ? localList.filter((item) => !item?.id || !deletedIds.has(item.id))
      : [];
  }

  if (!Array.isArray(localList) || localList.length === 0) {
    return cloudList.filter((item) => !item?.id || !deletedIds.has(item.id));
  }

  const map = new Map<string, T>();

  // 1. Seed with cloud items (excluding anything explicitly deleted locally)
  for (const item of cloudList) {
    if (item && item.id && !deletedIds.has(item.id)) {
      map.set(item.id, item);
    }
  }

  // 2. Merge user-owned local items
  for (const item of localList) {
    if (!item || !item.id || deletedIds.has(item.id)) continue;

    if (!map.has(item.id)) {
      // Never resurrect untouched default SEED_* items that the user already deleted from their cloud workspace
      if (SEED_ID_SET.has(item.id)) continue;
      map.set(item.id, item);
    } else {
      const cloudItem = map.get(item.id)!;
      const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
      if (localTime > cloudTime) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values());
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setSyncStatus, setSyncError, setLastSyncedAt } = useAuth();

  // Navigation
  const [activePage, setActivePage] = useState<string>('dashboard');

  // Persistence helpers
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(`freelanceos_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveStored = <T,>(key: string, value: T) => {
    try {
      localStorage.setItem(`freelanceos_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    }
  };

  // Tab-session flag (captured before setting so we know if this is a fresh window/app-update vs in-tab refresh)
  const isSameTabSessionRef = useRef<boolean>(false);
  if (typeof window !== 'undefined' && !isSameTabSessionRef.current) {
    try {
      isSameTabSessionRef.current = sessionStorage.getItem('freelanceos_tab_active') === '1';
    } catch {}
  }

  useEffect(() => {
    try {
      sessionStorage.setItem('freelanceos_tab_active', '1');
    } catch {}
  }, []);

  // Detect whether localStorage already contained non-seed user data before this boot (across ALL collections)
  const initialHasCustomLocalDataRef = useRef<boolean>(false);
  if (typeof window !== 'undefined' && !initialHasCustomLocalDataRef.current) {
    try {
      const owner = localStorage.getItem('freelanceos_owner_uid');
      const dirty = localStorage.getItem('freelanceos_local_dirty') === 'true';
      if (owner || dirty) {
        initialHasCustomLocalDataRef.current = true;
      } else {
        const legacyKeys = [
          'freelanceos_tasks',
          'freelanceos_clients',
          'freelanceos_plan_budgets',
          'freelanceos_budget_categories',
          'freelanceos_expenses',
          'freelanceos_subscriptions',
          'freelanceos_invoices',
          'freelanceos_payments',
          'freelanceos_schedules',
          'freelanceos_goals',
          'freelanceos_time_entries',
          'freelanceos_personal_sessions',
          'freelanceos_workday_history',
        ];
        const hasAnyNonSeedItem = legacyKeys.some((storageKey) => {
          const raw = localStorage.getItem(storageKey);
          if (!raw) return false;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) && parsed.some((item: any) => item?.id && !SEED_ID_SET.has(item.id));
        });
        if (hasAnyNonSeedItem) {
          initialHasCustomLocalDataRef.current = true;
          localStorage.setItem('freelanceos_owner_uid', 'local');
          localStorage.setItem('freelanceos_local_dirty', 'true');
        }
      }
    } catch {}
  }

  const currentUidRef = useRef<string | null>(currentUser?.uid || null);
  currentUidRef.current = currentUser?.uid || null;

  const markLocalEdit = useCallback((deletedId?: string) => {
    try {
      const uid = currentUidRef.current;
      const existingOwner = localStorage.getItem('freelanceos_owner_uid');
      if (uid && !uid.startsWith('local-user-')) {
        localStorage.setItem('freelanceos_owner_uid', uid);
      } else if (!existingOwner) {
        localStorage.setItem('freelanceos_owner_uid', 'local');
      }
      localStorage.setItem('freelanceos_local_dirty', 'true');
      localStorage.setItem('freelanceos_local_updated_at', new Date().toISOString());

      if (deletedId) {
        const rawDeleted = localStorage.getItem('freelanceos_deleted_ids');
        const arr: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
        if (!arr.includes(deletedId)) {
          const next = [...arr, deletedId].slice(-500);
          localStorage.setItem('freelanceos_deleted_ids', JSON.stringify(next));
        }
      }
    } catch (err) {
      console.warn('Could not record local edit metadata:', err);
    }
  }, []);

  // User Settings state declared early
  const [settings, setSettings] = useState<UserSettings>(() => loadStored('settings', SEED_SETTINGS));

  // State collections
  const [clients, setClients] = useState<Client[]>(() => loadStored('clients', SEED_CLIENTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadStored('tasks', SEED_TASKS));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadStored('time_entries', SEED_TIME_ENTRIES));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStored('invoices', SEED_INVOICES));
  const [payments, setPayments] = useState<Payment[]>(() => loadStored('payments', SEED_PAYMENTS));
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => loadStored('schedules', SEED_SCHEDULES));
  const [goals, setGoals] = useState<Goal[]>(() => loadStored('goals', SEED_GOALS));
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(() => loadStored('budget_categories', SEED_BUDGET_CATEGORIES));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', SEED_EXPENSES));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadStored('subscriptions', SEED_SUBSCRIPTIONS));
  const [savingsTargets] = useState<SavingsTarget[]>(() => loadStored('savings_targets', []));
  const [personalSessions, setPersonalSessions] = useState<PersonalWorkSession[]>(() =>
    loadStored('personal_sessions', [])
  );

  useEffect(() => {
    saveStored('personal_sessions', personalSessions);
  }, [personalSessions]);

  const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
    businessName: 'Apex Digital Studios',
    address: '101 Innovation Blvd, Suite 400, San Francisco, CA 94107',
    email: 'billing@apexdigital.io',
    phone: '+1 (415) 892-0112',
    taxRegistrationNumber: 'US-EIN 12-3456789',
    website: 'https://apexdigital.io',
    defaultCurrency: 'USD',
    paymentInstructions: 'Payment due within 15 days via Direct Wire Transfer or USDT Escrow.',
    bankDetails: 'Bank: Chase Bank · Account: 9876543210 · Routing: 121000358 · SWIFT: CHASUS33',
    defaultInvoiceNotes: 'Thank you for choosing Apex Digital Studios for your project!',
    defaultInvoiceTerms: 'Net 15 Days',
  };

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() =>
    loadStored('company_profile', DEFAULT_COMPANY_PROFILE)
  );

  useEffect(() => {
    saveStored('company_profile', companyProfile);
  }, [companyProfile]);

  const updateCompanyProfile = useCallback((updates: Partial<CompanyProfile>) => {
    markLocalEdit();
    setCompanyProfile((prev: CompanyProfile) => ({ ...prev, ...updates }));
  }, [markLocalEdit]);

  const DEFAULT_PLAN_BUDGETS: PlanBudget[] = [
    {
      id: 'pb-1',
      name: 'Q4 Master Operating Budget',
      period: 'quarterly',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      currency: 'USD',
      totalPlannedBudget: 3500,
      categoryAllocations: [
        { category: 'Rent and Housing', plannedAmount: 1200 },
        { category: 'Food and Groceries', plannedAmount: 500 },
        { category: 'Software and Subscriptions', plannedAmount: 300 },
        { category: 'Internet and Mobile', plannedAmount: 150 },
        { category: 'Savings', plannedAmount: 1000 },
        { category: 'Business Expenses', plannedAmount: 350 },
      ],
      notes: 'Quarterly planned budget allocations across operating categories.',
      createdAt: '2026-10-01T10:00:00.000Z',
    },
  ];

  const [planBudgets, setPlanBudgets] = useState<PlanBudget[]>(() =>
    loadStored('plan_budgets', DEFAULT_PLAN_BUDGETS)
  );

  useEffect(() => {
    saveStored('plan_budgets', planBudgets);
  }, [planBudgets]);

  const addPlanBudget = useCallback((budgetData: Omit<PlanBudget, 'id' | 'createdAt'>): PlanBudget => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newBudget: PlanBudget = {
      ...budgetData,
      id: `pb-${Date.now()}`,
      createdAt: now,
    };
    setPlanBudgets((prev: PlanBudget[]) => [newBudget, ...prev]);
    return newBudget;
  }, [markLocalEdit]);

  const updatePlanBudget = useCallback((id: string, updates: Partial<PlanBudget>) => {
    markLocalEdit();
    setPlanBudgets((prev: PlanBudget[]) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );
  }, [markLocalEdit]);

  const deletePlanBudget = useCallback((id: string) => {
    markLocalEdit(id);
    setPlanBudgets((prev: PlanBudget[]) => prev.filter((b) => b.id !== id));
  }, [markLocalEdit]);

  // Modals & Panels
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [companyProfileModalOpen, setCompanyProfileModalOpen] = useState(false);
  const [planBudgetModalOpen, setPlanBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Currency & Rates
  const [ratesData, setRatesData] = useState<ExchangeRatesData>(() => getStoredRates());
  const [displayCurrency, setDisplayCurrencyState] = useState<string>(() => {
    return localStorage.getItem('freelanceos_display_currency') || settings.defaultCurrency || 'USD';
  });

  const setDisplayCurrency = (curr: string) => {
    setDisplayCurrencyState(curr);
    localStorage.setItem('freelanceos_display_currency', curr);
  };

  const refreshExchangeRates = useCallback(async () => {
    const res = await fetchLiveRates();
    setRatesData(res.data);
  }, []);

  const updateCustomRates = useCallback((newRates: Record<string, number>) => {
    const updated: ExchangeRatesData = {
      base: 'USD',
      rates: { ...ratesData.rates, ...newRates, USDT: 1.0 },
      lastUpdated: new Date().toISOString(),
      isCustom: true,
    };
    saveRates(updated);
    setRatesData(updated);
  }, [ratesData]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored('notifications', [
    {
      id: 'n-1',
      title: 'Task Overdue: Lumina Brand Dashboard Refactor',
      message: 'Deadline was yesterday. Immediate attention recommended.',
      type: 'alert',
      timestamp: new Date().toISOString(),
      read: false,
      linkPage: 'tasks',
      itemId: 't-2',
    },
    {
      id: 'n-2',
      title: 'Upcoming Client Alignment Meeting',
      message: 'Client meeting with Sophia Martinez scheduled for 11:00 AM today.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      linkPage: 'schedule',
      itemId: 's-1',
    },
  ]));

  const addNotification = useCallback((
    title: string,
    message: string,
    type: 'info' | 'warning' | 'alert' | 'success' = 'info',
    linkPage?: string,
    itemId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      linkPage,
      itemId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (settings.notificationPreferences.sound) {
      playNotificationChime(type === 'alert' ? 'alert' : 'chime');
    }

    if (
      settings.notificationPreferences.browser &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, { body: message, icon: '/favicon.ico' });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  }, [settings.notificationPreferences]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Save changes to localStorage
  useEffect(() => saveStored('clients', clients), [clients]);
  useEffect(() => saveStored('tasks', tasks), [tasks]);
  useEffect(() => saveStored('time_entries', timeEntries), [timeEntries]);
  useEffect(() => saveStored('invoices', invoices), [invoices]);
  useEffect(() => saveStored('payments', payments), [payments]);
  useEffect(() => saveStored('schedules', schedules), [schedules]);
  useEffect(() => saveStored('goals', goals), [goals]);
  useEffect(() => saveStored('budget_categories', budgetCategories), [budgetCategories]);
  useEffect(() => saveStored('expenses', expenses), [expenses]);
  useEffect(() => saveStored('subscriptions', subscriptions), [subscriptions]);
  useEffect(() => saveStored('settings', settings), [settings]);
  useEffect(() => saveStored('notifications', notifications), [notifications]);

  // Active Timer Persistence (never auto-runs across fresh window/updates or past days)
  const [activeTimer, setActiveTimer] = useState<ActiveTimer>(() => {
    const defaultTimer: ActiveTimer = {
      isRunning: false,
      isPaused: false,
      startTime: null,
      accumulatedSeconds: 0,
      lastResumedTime: null,
      projectId: '',
      clientId: '',
      projectName: '',
      clientName: '',
      hourlyRate: 50,
      description: '',
    };
    const stored = loadStored('active_timer', defaultTimer);
    if (!stored || typeof stored !== 'object') return defaultTimer;

    if (stored.isRunning && !stored.isPaused) {
      const todayStr = new Date().toISOString().split('T')[0];
      const startDateStr = stored.startTime ? new Date(stored.startTime).toISOString().split('T')[0] : todayStr;
      let isSameTab = false;
      let lastHeartbeat = 0;
      try {
        isSameTab = sessionStorage.getItem('freelanceos_tab_active') === '1';
        lastHeartbeat = Number(localStorage.getItem('freelanceos_timer_heartbeat') || 0);
      } catch {}

      // If opened in a fresh window/update OR from a past day, pause cleanly instead of auto-running
      if (!isSameTab || startDateStr !== todayStr) {
        const refTs = lastHeartbeat && stored.lastResumedTime && lastHeartbeat >= stored.lastResumedTime
          ? lastHeartbeat
          : (stored.lastResumedTime || Date.now());
        const boundedAdded = stored.lastResumedTime
          ? Math.max(0, Math.min(8 * 3600, Math.floor((refTs - stored.lastResumedTime) / 1000)))
          : 0;
        return {
          ...stored,
          isPaused: true,
          accumulatedSeconds: (stored.accumulatedSeconds || 0) + boundedAdded,
          lastResumedTime: null,
        };
      }
    }
    return stored;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (activeTimer.isRunning && !activeTimer.isPaused && activeTimer.lastResumedTime) {
      const added = Math.floor((Date.now() - activeTimer.lastResumedTime) / 1000);
      return activeTimer.accumulatedSeconds + added;
    }
    return activeTimer.accumulatedSeconds || 0;
  });

  // Timer ticker based on timestamps
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer.isRunning && !activeTimer.isPaused && activeTimer.lastResumedTime) {
      interval = setInterval(() => {
        const added = Math.floor((Date.now() - (activeTimer.lastResumedTime || Date.now())) / 1000);
        setElapsedSeconds(activeTimer.accumulatedSeconds + added);
      }, 1000);
    } else {
      setElapsedSeconds(activeTimer.accumulatedSeconds);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  useEffect(() => {
    saveStored('active_timer', activeTimer);
  }, [activeTimer]);

  // Completed Timer Session Summary popup state
  const [completedSessionSummary, setCompletedSessionSummary] = useState<{
    visible: boolean;
    durationSeconds: number;
    billableValue: number;
    projectName: string;
    clientName: string;
    projectId: string;
    clientId: string;
    hourlyRate: number;
  } | null>(null);

  const startTimer = useCallback((projectId?: string, clientId?: string) => {
    let pName = 'General Work Session';
    let cName = 'General Client';
    let resolvedClientId = clientId || '';
    const defaultRate = settings.defaultHourlyRate > 0 ? settings.defaultHourlyRate : 50;
    let rate = defaultRate;

    if (projectId) {
      const foundTask = tasks.find((t) => t.id === projectId);
      if (foundTask) {
        pName = foundTask.name;
        cName = foundTask.clientName;
        resolvedClientId = foundTask.clientId || resolvedClientId;
        const foundClient = clients.find((c) => c.id === resolvedClientId);

        if (foundTask.priceType === 'hourly' && typeof foundTask.hourlyRate === 'number' && foundTask.hourlyRate > 0) {
          rate = foundTask.hourlyRate;
        } else if (foundClient && typeof foundClient.hourlyRate === 'number' && foundClient.hourlyRate > 0) {
          rate = foundClient.hourlyRate;
        } else if (typeof foundTask.hourlyRate === 'number' && foundTask.hourlyRate > 0) {
          rate = foundTask.hourlyRate;
        }
      }
    } else if (resolvedClientId) {
      const foundClient = clients.find((c) => c.id === resolvedClientId);
      if (foundClient) {
        pName = `${foundClient.fullName} — Hourly Work`;
        cName = foundClient.fullName;
        if (typeof foundClient.hourlyRate === 'number' && foundClient.hourlyRate > 0) {
          rate = foundClient.hourlyRate;
        }
      }
    }

    const now = Date.now();
    setActiveTimer({
      isRunning: true,
      isPaused: false,
      startTime: now,
      accumulatedSeconds: 0,
      lastResumedTime: now,
      projectId: projectId || '',
      clientId: resolvedClientId,
      projectName: pName,
      clientName: cName,
      hourlyRate: rate,
      description: `Working on ${pName}`,
    });
    setElapsedSeconds(0);
    addNotification('Timer Started', `Tracking session for ${pName} ($${rate}/hr)`, 'info');
  }, [tasks, clients, settings.defaultHourlyRate, addNotification]);

  const pauseTimer = useCallback(() => {
    if (!activeTimer.isRunning || activeTimer.isPaused || !activeTimer.lastResumedTime) return;
    const added = Math.floor((Date.now() - activeTimer.lastResumedTime) / 1000);
    const newTotal = activeTimer.accumulatedSeconds + added;
    setActiveTimer((prev) => ({
      ...prev,
      isPaused: true,
      accumulatedSeconds: newTotal,
      lastResumedTime: null,
    }));
    setElapsedSeconds(newTotal);
  }, [activeTimer]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer.isRunning || !activeTimer.isPaused) return;
    const now = Date.now();
    setActiveTimer((prev) => ({
      ...prev,
      isPaused: false,
      lastResumedTime: now,
    }));
  }, [activeTimer]);

  const stopTimer = useCallback(() => {
    if (!activeTimer.isRunning) return;

    let totalSecs = activeTimer.accumulatedSeconds;
    if (!activeTimer.isPaused && activeTimer.lastResumedTime) {
      totalSecs += Math.floor((Date.now() - activeTimer.lastResumedTime) / 1000);
    }

    if (totalSecs < 1) {
      totalSecs = 1;
    }

    const defaultRate = settings.defaultHourlyRate > 0 ? settings.defaultHourlyRate : 50;
    const rate = activeTimer.hourlyRate > 0 ? activeTimer.hourlyRate : defaultRate;
    const billableVal = Number(((totalSecs / 3600) * rate).toFixed(2));
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];

    const newEntry: TimeEntry = {
      id: `te-${Date.now()}`,
      clientId: activeTimer.clientId || 'c-general',
      projectId: activeTimer.projectId || 'p-general',
      projectName: activeTimer.projectName,
      clientName: activeTimer.clientName,
      date: todayStr,
      startTime: new Date(Date.now() - totalSecs * 1000).toISOString(),
      endTime: nowISO,
      durationSeconds: totalSecs,
      hourlyRate: rate,
      isBillable: true,
      billableAmount: billableVal,
      description: activeTimer.description || `Tracked session on ${activeTimer.projectName}`,
      invoiceId: null,
      createdAt: nowISO,
    };

    markLocalEdit();
    setTimeEntries((prev) => [newEntry, ...prev]);

    if (activeTimer.projectId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTimer.projectId
            ? { ...t, totalTimeTrackedSeconds: (t.totalTimeTrackedSeconds || 0) + totalSecs, updatedAt: nowISO }
            : t
        )
      );
    }

    setCompletedSessionSummary({
      visible: true,
      durationSeconds: totalSecs,
      billableValue: billableVal,
      projectName: activeTimer.projectName,
      clientName: activeTimer.clientName,
      projectId: activeTimer.projectId,
      clientId: activeTimer.clientId,
      hourlyRate: rate,
    });

    setActiveTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      accumulatedSeconds: 0,
      lastResumedTime: null,
      projectId: '',
      clientId: '',
      projectName: '',
      clientName: '',
      hourlyRate: defaultRate,
      description: '',
    });
    setElapsedSeconds(0);

    if (settings.notificationPreferences.sound) {
      playNotificationChime('complete');
    }
  }, [activeTimer, settings.defaultHourlyRate, settings.notificationPreferences.sound, markLocalEdit]);

  const clearActiveTimer = useCallback(() => {
    const defaultRate = settings.defaultHourlyRate > 0 ? settings.defaultHourlyRate : 50;
    setActiveTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      accumulatedSeconds: 0,
      lastResumedTime: null,
      projectId: '',
      clientId: '',
      projectName: '',
      clientName: '',
      hourlyRate: defaultRate,
      description: '',
    });
    setElapsedSeconds(0);
  }, [settings.defaultHourlyRate]);

  const dismissCompletedSessionSummary = useCallback(() => {
    setCompletedSessionSummary(null);
  }, []);

  const formatTimerTime = useCallback((secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // ==========================================
  // WORKING HOURS TIMER & DAILY WORKDAY STATE
  // ==========================================
  const DEFAULT_WORKDAY_STATE: WorkdayState = {
    status: 'idle',
    workdayStartTime: null,
    targetWorkMinutes: 240,
    targetBreakMinutes: 15,
    currentIntervalStartTime: null,
    accumulatedWorkSeconds: 0,
    currentBreakStartTime: null,
    accumulatedBreakSeconds: 0,
    workSessionsCount: 0,
    breaksCount: 0,
    pausedAt: null,
    workIntervalAlerted: false,
    breakOverdueAlerted: false,
  };

  const [workdayState, setWorkdayState] = useState<WorkdayState>(() => {
    const stored = loadStored('workday_timer_state', DEFAULT_WORKDAY_STATE);
    if (!stored || typeof stored !== 'object') return DEFAULT_WORKDAY_STATE;

    if (stored.status === 'working' || stored.status === 'on_break') {
      const todayStr = new Date().toISOString().split('T')[0];
      const startDateStr = stored.workdayStartTime
        ? new Date(stored.workdayStartTime).toISOString().split('T')[0]
        : todayStr;
      let isSameTab = false;
      let lastHeartbeat = 0;
      try {
        isSameTab = sessionStorage.getItem('freelanceos_tab_active') === '1';
        lastHeartbeat = Number(localStorage.getItem('freelanceos_timer_heartbeat') || 0);
      } catch {}

      if (!isSameTab || startDateStr !== todayStr) {
        if (startDateStr !== todayStr) {
          // New day: start workday timer clean and idle
          return {
            ...DEFAULT_WORKDAY_STATE,
            targetWorkMinutes: stored.targetWorkMinutes || 240,
            targetBreakMinutes: stored.targetBreakMinutes || 15,
          };
        }
        // Fresh window/update on same day: pause cleanly instead of auto-running
        const refTs = lastHeartbeat && lastHeartbeat >= (stored.currentIntervalStartTime || stored.currentBreakStartTime || 0)
          ? lastHeartbeat
          : Date.now();
        let newAccWork = stored.accumulatedWorkSeconds || 0;
        let newAccBreak = stored.accumulatedBreakSeconds || 0;
        if (stored.status === 'working' && stored.currentIntervalStartTime) {
          newAccWork += Math.max(0, Math.min(8 * 3600, Math.floor((refTs - stored.currentIntervalStartTime) / 1000)));
        } else if (stored.status === 'on_break' && stored.currentBreakStartTime) {
          newAccBreak += Math.max(0, Math.min(4 * 3600, Math.floor((refTs - stored.currentBreakStartTime) / 1000)));
        }
        return {
          ...stored,
          previousStatusBeforePause: stored.status,
          status: 'paused',
          pausedAt: refTs,
          accumulatedWorkSeconds: newAccWork,
          currentIntervalStartTime: null,
          accumulatedBreakSeconds: newAccBreak,
          currentBreakStartTime: null,
        };
      }
    }
    return stored;
  });

  const [workdayHistory, setWorkdayHistory] = useState<WorkdaySummary[]>(() => {
    return loadStored('workday_history', []);
  });

  const [workdaySummary, setWorkdaySummary] = useState<WorkdaySummary | null>(null);
  const [workdaySummaryOpen, setWorkdaySummaryOpen] = useState(false);

  // Finalize any stale/orphaned in_progress personalSessions when workday timer is not actively working
  const finalizeOrphanedSessions = useCallback(
    (sessions: PersonalWorkSession[], isActivelyWorkingNow: boolean): PersonalWorkSession[] => {
      if (!Array.isArray(sessions)) return [];
      const todayStr = new Date().toISOString().split('T')[0];
      let lastHeartbeat = 0;
      try {
        lastHeartbeat = Number(localStorage.getItem('freelanceos_timer_heartbeat') || 0);
      } catch {}

      return sessions.map((s) => {
        if (s.status !== 'in_progress') return s;
        const isPastDay = s.date && s.date !== todayStr;
        if (!isActivelyWorkingNow || isPastDay) {
          const fallbackEnd =
            lastHeartbeat && lastHeartbeat >= s.startTimestamp
              ? lastHeartbeat
              : Math.min(Date.now(), s.startTimestamp + 60 * 1000);
          const safeEnd = Math.max(s.startTimestamp + 1000, fallbackEnd);
          const duration = Math.max(1, Math.min(12 * 3600, Math.floor((safeEnd - s.startTimestamp) / 1000)));
          return {
            ...s,
            endTime: new Date(safeEnd).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            endTimestamp: safeEnd,
            durationSeconds: duration,
            status: 'completed',
          };
        }
        return s;
      });
    },
    []
  );

  // Clean up any orphaned in_progress personal sessions on mount if workdayState isn't actively working
  useEffect(() => {
    const isWorking = workdayState.status === 'working';
    setPersonalSessions((prev) => {
      const hasOrphan = prev.some(
        (s) => s.status === 'in_progress' && (!isWorking || s.date !== new Date().toISOString().split('T')[0])
      );
      if (!hasOrphan) return prev;
      return finalizeOrphanedSessions(prev, isWorking);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat timestamp while any timer is actively running so stale recovery never inflates elapsed hours
  useEffect(() => {
    const anyRunning =
      (activeTimer.isRunning && !activeTimer.isPaused) ||
      workdayState.status === 'working' ||
      workdayState.status === 'on_break';
    if (!anyRunning) return;

    const writeHeartbeat = () => {
      try {
        localStorage.setItem('freelanceos_timer_heartbeat', String(Date.now()));
      } catch {}
    };
    writeHeartbeat();
    const hb = setInterval(writeHeartbeat, 5000);
    return () => clearInterval(hb);
  }, [activeTimer.isRunning, activeTimer.isPaused, workdayState.status]);

  useEffect(() => {
    saveStored('workday_timer_state', workdayState);
  }, [workdayState]);

  useEffect(() => {
    saveStored('workday_history', workdayHistory);
  }, [workdayHistory]);

  // ==========================================
  // CLOUD DATABASE SYNC (UNIQUE USER ID)
  // ==========================================
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const isCloudLoadedRef = useRef(false);
  isCloudLoadedRef.current = isCloudLoaded;

  const [hasEmergencyBackup, setHasEmergencyBackup] = useState<boolean>(() => {
    try {
      return !!(
        localStorage.getItem('freelanceos_workspace_emergency_backup') ||
        localStorage.getItem('freelanceos_workspace_emergency_backup_prev')
      );
    } catch {
      return false;
    }
  });

  // Always hold the latest workspace snapshot in a ref for instant flush on pagehide/reload
  const latestWorkspaceRef = useRef({
    clients,
    tasks,
    planBudgets,
    budgetCategories,
    timeEntries,
    invoices,
    payments,
    schedules,
    goals,
    expenses,
    subscriptions,
    companyProfile,
    workdayHistory,
    personalSessions,
    settings,
  });
  latestWorkspaceRef.current = {
    clients,
    tasks,
    planBudgets,
    budgetCategories,
    timeEntries,
    invoices,
    payments,
    schedules,
    goals,
    expenses,
    subscriptions,
    companyProfile,
    workdayHistory,
    personalSessions,
    settings,
  };

  const workdayStatusRef = useRef(workdayState.status);
  workdayStatusRef.current = workdayState.status;

  const syncInProgressRef = useRef(false);

  const performCloudSync = useCallback(async (uid: string, isCancelledCheck?: () => boolean) => {
    if (!uid || uid.startsWith('local-user-')) {
      setIsCloudLoaded(true);
      setSyncStatus('idle');
      setSyncError(null);
      return;
    }
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    try {
      setSyncStatus('syncing');
      setSyncError(null);

      const snapshot = latestWorkspaceRef.current;

      // Preserve secondary emergency backup before updating primary pre-sync snapshot
      try {
        const existingBackup = localStorage.getItem('freelanceos_workspace_emergency_backup');
        if (existingBackup) {
          localStorage.setItem('freelanceos_workspace_emergency_backup_prev', existingBackup);
        }
        localStorage.setItem(
          'freelanceos_workspace_emergency_backup',
          JSON.stringify({ timestamp: new Date().toISOString(), ...snapshot })
        );
        setHasEmergencyBackup(true);
      } catch (e) {
        console.warn('Could not store pre-sync snapshot:', e);
      }

      const cloudData = await loadUserWorkspace(uid);
      if (isCancelledCheck?.()) return;

      // Determine whether localStorage holds genuine user-owned data for this user (or offline local-mode work)
      let storedOwner: string | null = null;
      let localDirty = false;
      let deletedIds = new Set<string>();
      try {
        storedOwner = localStorage.getItem('freelanceos_owner_uid');
        localDirty = localStorage.getItem('freelanceos_local_dirty') === 'true';
        const rawDeleted = localStorage.getItem('freelanceos_deleted_ids');
        if (rawDeleted) {
          const parsed = JSON.parse(rawDeleted);
          if (Array.isArray(parsed)) deletedIds = new Set(parsed);
        }
      } catch {}

      const belongsToAnotherAccount = Boolean(storedOwner && storedOwner !== 'local' && storedOwner !== uid);
      const hasNonSeedLocalRecords = !belongsToAnotherAccount && [
        snapshot.tasks,
        snapshot.clients,
        snapshot.planBudgets,
        snapshot.budgetCategories,
        snapshot.expenses,
        snapshot.subscriptions,
        snapshot.invoices,
        snapshot.payments,
        snapshot.schedules,
        snapshot.goals,
        snapshot.timeEntries,
        snapshot.personalSessions,
        snapshot.workdayHistory,
      ].some((arr) => Array.isArray(arr) && arr.some((item: any) => item?.id && !SEED_ID_SET.has(item.id)));

      const treatLocalAsUserOwned =
        (storedOwner === uid && localDirty) ||
        (storedOwner === 'local' && localDirty) ||
        initialHasCustomLocalDataRef.current ||
        hasNonSeedLocalRecords;

      if (cloudData) {
        const mergeOpts = { treatLocalAsUserOwned, deletedIds };

        const mergedTasks = mergeCollections(cloudData.tasks, snapshot.tasks, mergeOpts);
        const mergedClients = mergeCollections(cloudData.clients, snapshot.clients, mergeOpts);
        const mergedPlanBudgets = mergeCollections(cloudData.planBudgets, snapshot.planBudgets, mergeOpts);
        const mergedBudgetCategories = mergeCollections(cloudData.budgetCategories, snapshot.budgetCategories, mergeOpts);
        const mergedTimeEntries = mergeCollections(cloudData.timeEntries, snapshot.timeEntries, mergeOpts);
        const mergedInvoices = mergeCollections(cloudData.invoices, snapshot.invoices, mergeOpts);
        const mergedPayments = mergeCollections(cloudData.payments, snapshot.payments, mergeOpts);
        const mergedSchedules = mergeCollections(cloudData.schedules, snapshot.schedules, mergeOpts);
        const mergedGoals = mergeCollections(cloudData.goals, snapshot.goals, mergeOpts);
        const mergedExpenses = mergeCollections(cloudData.expenses, snapshot.expenses, mergeOpts);
        const mergedSubscriptions = mergeCollections(cloudData.subscriptions, snapshot.subscriptions, mergeOpts);
        const rawMergedPersonalSessions = mergeCollections(cloudData.personalSessions, snapshot.personalSessions, mergeOpts);
        const mergedPersonalSessions = finalizeOrphanedSessions(
          rawMergedPersonalSessions,
          workdayStatusRef.current === 'working'
        );
        const mergedWorkdayHistory = mergeCollections(cloudData.workdayHistory, snapshot.workdayHistory, mergeOpts);
        const resolvedCompanyProfile = cloudData.companyProfile || snapshot.companyProfile;
        const resolvedSettings = cloudData.settings
          ? { ...snapshot.settings, ...cloudData.settings }
          : snapshot.settings;

        setTasks(mergedTasks);
        setClients(mergedClients);
        setPlanBudgets(mergedPlanBudgets);
        setBudgetCategories(mergedBudgetCategories);
        setTimeEntries(mergedTimeEntries);
        setInvoices(mergedInvoices);
        setPayments(mergedPayments);
        setSchedules(mergedSchedules);
        setGoals(mergedGoals);
        setExpenses(mergedExpenses);
        setSubscriptions(mergedSubscriptions);
        setPersonalSessions(mergedPersonalSessions);
        setWorkdayHistory(mergedWorkdayHistory);
        if (resolvedCompanyProfile) setCompanyProfile(resolvedCompanyProfile);
        if (resolvedSettings) setSettings(resolvedSettings);

        const hadOrphanedSessionsCleaned =
          rawMergedPersonalSessions.length !== mergedPersonalSessions.length ||
          rawMergedPersonalSessions.some((s, idx) => s.status !== mergedPersonalSessions[idx]?.status);

        // Only push back to Firestore if we merged local edits, cleaned orphaned sessions, or cloud lacked planBudgets
        const needsBackfill =
          treatLocalAsUserOwned ||
          hadOrphanedSessionsCleaned ||
          !Array.isArray(cloudData.planBudgets);

        if (needsBackfill) {
          await saveUserWorkspace(uid, {
            clients: mergedClients,
            tasks: mergedTasks,
            planBudgets: mergedPlanBudgets,
            budgetCategories: mergedBudgetCategories,
            timeEntries: mergedTimeEntries,
            invoices: mergedInvoices,
            payments: mergedPayments,
            schedules: mergedSchedules,
            goals: mergedGoals,
            expenses: mergedExpenses,
            subscriptions: mergedSubscriptions,
            companyProfile: resolvedCompanyProfile,
            workdayHistory: mergedWorkdayHistory,
            personalSessions: mergedPersonalSessions,
            settings: resolvedSettings,
          });
        }
      } else {
        // First time sign-in for this user ID: write initial state to Firestore
        await saveUserWorkspace(uid, snapshot);
      }

      try {
        localStorage.setItem('freelanceos_owner_uid', uid);
        localStorage.setItem('freelanceos_local_dirty', 'false');
        localStorage.removeItem('freelanceos_deleted_ids');
        initialHasCustomLocalDataRef.current = false;
      } catch {}

      setSyncStatus('synced');
      setSyncError(null);
      setLastSyncedAt(new Date().toLocaleTimeString());
      setIsCloudLoaded(true);
    } catch (err: any) {
      console.error('Error synchronizing cloud workspace:', err);
      setSyncStatus('error');
      setSyncError(err?.message || 'Unable to reach cloud database');
    } finally {
      syncInProgressRef.current = false;
    }
  }, [setSyncStatus, setSyncError, setLastSyncedAt]);

  // Sync from cloud on login
  useEffect(() => {
    let isCancelled = false;
    if (!currentUser?.uid) {
      setIsCloudLoaded(false);
      return;
    }
    performCloudSync(currentUser.uid, () => isCancelled);
    return () => {
      isCancelled = true;
    };
  }, [currentUser?.uid, performCloudSync]);

  const retryCloudSync = useCallback(async () => {
    if (!currentUser?.uid) return;
    await performCloudSync(currentUser.uid);
  }, [currentUser?.uid, performCloudSync]);

  // Auto-retry cloud sync if connection comes back online while in error state
  useEffect(() => {
    const handleOnline = () => {
      if (currentUidRef.current && !currentUidRef.current.startsWith('local-user-') && !isCloudLoadedRef.current) {
        performCloudSync(currentUidRef.current);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [performCloudSync]);

  // Immediate flush helper for pagehide / visibilitychange / beforeunload
  const flushCloudSave = useCallback(async () => {
    const uid = currentUidRef.current;
    if (!uid || uid.startsWith('local-user-') || !isCloudLoadedRef.current) return;
    try {
      setSyncStatus('syncing');
      await saveUserWorkspace(uid, latestWorkspaceRef.current);
      try {
        localStorage.setItem('freelanceos_owner_uid', uid);
        localStorage.setItem('freelanceos_local_dirty', 'false');
      } catch {}
      setSyncStatus('synced');
      setSyncError(null);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Cloud flush save failed:', err);
      setSyncStatus('error');
      setSyncError(err?.message || 'Cloud save failed');
    }
  }, [setSyncStatus, setSyncError, setLastSyncedAt]);

  useEffect(() => {
    const onVisibilityOrHide = () => {
      if (document.visibilityState === 'hidden') {
        flushCloudSave();
      }
    };
    const onPageHide = () => {
      flushCloudSave();
    };
    document.addEventListener('visibilitychange', onVisibilityOrHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityOrHide);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
    };
  }, [flushCloudSave]);

  // Automatically save workspace changes under unique user ID (fast 450ms debounce)
  useEffect(() => {
    if (!currentUser?.uid || currentUser.uid.startsWith('local-user-') || !isCloudLoaded) return;

    const timeout = setTimeout(async () => {
      await flushCloudSave();
    }, 450);

    return () => clearTimeout(timeout);
  }, [
    currentUser?.uid,
    isCloudLoaded,
    flushCloudSave,
    clients,
    tasks,
    planBudgets,
    budgetCategories,
    timeEntries,
    invoices,
    payments,
    schedules,
    goals,
    expenses,
    subscriptions,
    companyProfile,
    workdayHistory,
    personalSessions,
    settings,
  ]);

  // ==========================================
  // PERSONAL WORKING SESSIONS & ACCURATE TOTALS
  // ==========================================
  const formatSessionClock = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const calculateSessionSecondsForDay = useCallback(
    (session: PersonalWorkSession, targetDateStr: string, currentTimestamp?: number): number => {
      if (!session || !session.startTimestamp) return 0;

      const [y, m, d] = targetDateStr.split('-').map(Number);
      if (!y || !m || !d) return 0;

      const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
      const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();

      const sessionStart = session.startTimestamp;
      const sessionEnd = session.endTimestamp
        ? session.endTimestamp
        : session.status === 'in_progress'
        ? currentTimestamp || Date.now()
        : session.startTimestamp;

      if (sessionEnd <= sessionStart) return 0;

      const overlapStart = Math.max(sessionStart, dayStart);
      const overlapEnd = Math.min(sessionEnd, dayEnd);

      if (overlapEnd > overlapStart) {
        return Math.floor((overlapEnd - overlapStart) / 1000);
      }
      return 0;
    },
    []
  );

  const getPersonalDailyTotalSeconds = useCallback(
    (targetDateStr?: string): number => {
      const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
      const now = Date.now();
      let total = 0;
      for (const session of personalSessions) {
        total += calculateSessionSecondsForDay(session, dateStr, now);
      }
      return total;
    },
    [personalSessions, calculateSessionSecondsForDay]
  );

  const getPersonalWeeklyTotalSeconds = useCallback(
    (referenceDate?: Date): number => {
      const ref = referenceDate || new Date();
      const d = new Date(ref);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      const weekStartTs = d.getTime();
      const weekEndTs = weekStartTs + 7 * 86400000;

      const now = Date.now();
      let total = 0;
      for (const s of personalSessions) {
        const sStart = s.startTimestamp;
        const sEnd = s.endTimestamp || (s.status === 'in_progress' ? now : s.startTimestamp);
        const overlapStart = Math.max(sStart, weekStartTs);
        const overlapEnd = Math.min(sEnd, weekEndTs);
        if (overlapEnd > overlapStart) {
          total += Math.floor((overlapEnd - overlapStart) / 1000);
        }
      }
      return total;
    },
    [personalSessions]
  );

  const getPersonalMonthlyTotalSeconds = useCallback(
    (targetMonthStr?: string): number => {
      const monthStr = targetMonthStr || new Date().toISOString().substring(0, 7);
      const [y, m] = monthStr.split('-').map(Number);
      if (!y || !m) return 0;
      const monthStartTs = new Date(y, m - 1, 1, 0, 0, 0, 0).getTime();
      const monthEndTs = new Date(y, m, 1, 0, 0, 0, 0).getTime();

      const now = Date.now();
      let total = 0;
      for (const s of personalSessions) {
        const sStart = s.startTimestamp;
        const sEnd = s.endTimestamp || (s.status === 'in_progress' ? now : s.startTimestamp);
        const overlapStart = Math.max(sStart, monthStartTs);
        const overlapEnd = Math.min(sEnd, monthEndTs);
        if (overlapEnd > overlapStart) {
          total += Math.floor((overlapEnd - overlapStart) / 1000);
        }
      }
      return total;
    },
    [personalSessions]
  );

  const activePersonalSession = useMemo(() => {
    return personalSessions.find((s) => s.status === 'in_progress') || null;
  }, [personalSessions]);

  const deletePersonalSession = useCallback((id: string) => {
    markLocalEdit(id);
    setPersonalSessions((prev) => prev.filter((s) => s.id !== id));
  }, [markLocalEdit]);

  const startWorkday = useCallback(() => {
    markLocalEdit();
    const now = Date.now();
    const todayStr = new Date(now).toISOString().split('T')[0];

    // Ensure only one active personal session is created
    setPersonalSessions((prev) => {
      const alreadyActive = prev.find((s) => s.status === 'in_progress');
      if (alreadyActive) {
        return prev;
      }
      const newSession: PersonalWorkSession = {
        id: `pws-${now}-${Math.random().toString(36).substring(2, 7)}`,
        date: todayStr,
        startTime: formatSessionClock(now),
        endTime: null,
        startTimestamp: now,
        endTimestamp: null,
        durationSeconds: 0,
        status: 'in_progress',
        createdAt: new Date(now).toISOString(),
      };
      return [newSession, ...prev];
    });

    setWorkdayState((prev) => {
      const todayCompletedSeconds = personalSessions
        .filter((s) => s.status === 'completed' && s.date === todayStr)
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      return {
        ...prev,
        status: 'working',
        workdayStartTime: prev.workdayStartTime || now,
        currentIntervalStartTime: now,
        accumulatedWorkSeconds: todayCompletedSeconds,
        currentBreakStartTime: null,
        workSessionsCount: prev.workSessionsCount + 1,
        pausedAt: null,
        workIntervalAlerted: false,
        breakOverdueAlerted: false,
      };
    });

    addNotification('Personal Timer Started', 'Personal working session started.', 'info', 'today');
  }, [personalSessions, addNotification, markLocalEdit]);

  const pauseWorkday = useCallback(() => {
    markLocalEdit();
    const now = Date.now();

    // Close the in_progress session and save its duration permanently
    setPersonalSessions((prev) =>
      prev.map((s) => {
        if (s.status === 'in_progress') {
          const duration = Math.max(1, Math.floor((now - s.startTimestamp) / 1000));
          return {
            ...s,
            endTime: formatSessionClock(now),
            endTimestamp: now,
            durationSeconds: duration,
            status: 'completed',
          };
        }
        return s;
      })
    );

    setWorkdayState((prev) => {
      if (prev.status !== 'working' && prev.status !== 'on_break') return prev;

      let newAccWork = prev.accumulatedWorkSeconds;
      let newAccBreak = prev.accumulatedBreakSeconds;

      if (prev.status === 'working' && prev.currentIntervalStartTime) {
        newAccWork += Math.max(0, Math.floor((now - prev.currentIntervalStartTime) / 1000));
      } else if (prev.status === 'on_break' && prev.currentBreakStartTime) {
        newAccBreak += Math.max(0, Math.floor((now - prev.currentBreakStartTime) / 1000));
      }

      return {
        ...prev,
        previousStatusBeforePause: prev.status,
        status: 'paused',
        pausedAt: now,
        accumulatedWorkSeconds: newAccWork,
        currentIntervalStartTime: null,
        accumulatedBreakSeconds: newAccBreak,
        currentBreakStartTime: null,
      };
    });
  }, [markLocalEdit]);

  const resumeWorkday = useCallback(() => {
    if (workdayState.status !== 'paused') return;
    markLocalEdit();
    const now = Date.now();
    const todayStr = new Date(now).toISOString().split('T')[0];
    const targetStatus = workdayState.previousStatusBeforePause === 'on_break' ? 'on_break' : 'working';

    if (targetStatus === 'working') {
      setPersonalSessions((sessions) => {
        if (sessions.some((s) => s.status === 'in_progress')) return sessions;
        const newSession: PersonalWorkSession = {
          id: `pws-${now}-${Math.random().toString(36).substring(2, 7)}`,
          date: todayStr,
          startTime: formatSessionClock(now),
          endTime: null,
          startTimestamp: now,
          endTimestamp: null,
          durationSeconds: 0,
          status: 'in_progress',
          createdAt: new Date(now).toISOString(),
        };
        return [newSession, ...sessions];
      });
    }

    setWorkdayState((prev) => {
      if (prev.status !== 'paused') return prev;
      return {
        ...prev,
        status: targetStatus,
        pausedAt: null,
        currentIntervalStartTime: targetStatus === 'working' ? now : null,
        currentBreakStartTime: targetStatus === 'on_break' ? now : null,
        workSessionsCount:
          targetStatus === 'working' ? prev.workSessionsCount + 1 : prev.workSessionsCount,
      };
    });
  }, [workdayState.status, workdayState.previousStatusBeforePause, markLocalEdit]);

  const startBreak = useCallback(() => {
    markLocalEdit();
    const now = Date.now();

    // Close in_progress working session
    setPersonalSessions((prev) =>
      prev.map((s) => {
        if (s.status === 'in_progress') {
          const duration = Math.max(1, Math.floor((now - s.startTimestamp) / 1000));
          return {
            ...s,
            endTime: formatSessionClock(now),
            endTimestamp: now,
            durationSeconds: duration,
            status: 'completed',
          };
        }
        return s;
      })
    );

    setWorkdayState((prev) => {
      let newAccWork = prev.accumulatedWorkSeconds;
      if (prev.status === 'working' && prev.currentIntervalStartTime) {
        newAccWork += Math.max(0, Math.floor((now - prev.currentIntervalStartTime) / 1000));
      }

      return {
        ...prev,
        status: 'on_break',
        accumulatedWorkSeconds: newAccWork,
        currentIntervalStartTime: null,
        currentBreakStartTime: now,
        breaksCount: prev.breaksCount + 1,
        breakOverdueAlerted: false,
      };
    });
    addNotification(
      'Break Started',
      `Enjoy your ${workdayState.targetBreakMinutes} minute break!`,
      'info',
      'today'
    );
  }, [addNotification, workdayState.targetBreakMinutes, markLocalEdit]);

  const resumeFromBreak = useCallback(() => {
    markLocalEdit();
    const now = Date.now();
    const todayStr = new Date(now).toISOString().split('T')[0];

    // Start a fresh in_progress personal session
    setPersonalSessions((prev) => {
      if (prev.some((s) => s.status === 'in_progress')) return prev;
      const newSession: PersonalWorkSession = {
        id: `pws-${now}-${Math.random().toString(36).substring(2, 7)}`,
        date: todayStr,
        startTime: formatSessionClock(now),
        endTime: null,
        startTimestamp: now,
        endTimestamp: null,
        durationSeconds: 0,
        status: 'in_progress',
        createdAt: new Date(now).toISOString(),
      };
      return [newSession, ...prev];
    });

    setWorkdayState((prev) => {
      let newAccBreak = prev.accumulatedBreakSeconds;
      if (prev.status === 'on_break' && prev.currentBreakStartTime) {
        newAccBreak += Math.max(0, Math.floor((now - prev.currentBreakStartTime) / 1000));
      }

      return {
        ...prev,
        status: 'working',
        accumulatedBreakSeconds: newAccBreak,
        currentBreakStartTime: null,
        currentIntervalStartTime: now,
        workSessionsCount: prev.workSessionsCount + 1,
        workIntervalAlerted: false,
      };
    });
    addNotification('Break Completed', 'Welcome back! Focus session started.', 'info', 'today');
  }, [addNotification, markLocalEdit]);

  const skipBreak = useCallback(() => {
    markLocalEdit();
    const now = Date.now();
    const todayStr = new Date(now).toISOString().split('T')[0];

    // Start in_progress personal session
    setPersonalSessions((prev) => {
      if (prev.some((s) => s.status === 'in_progress')) return prev;
      const newSession: PersonalWorkSession = {
        id: `pws-${now}-${Math.random().toString(36).substring(2, 7)}`,
        date: todayStr,
        startTime: formatSessionClock(now),
        endTime: null,
        startTimestamp: now,
        endTimestamp: null,
        durationSeconds: 0,
        status: 'in_progress',
        createdAt: new Date(now).toISOString(),
      };
      return [newSession, ...prev];
    });

    setWorkdayState((prev) => {
      let newAccBreak = prev.accumulatedBreakSeconds;
      if (prev.status === 'on_break' && prev.currentBreakStartTime) {
        newAccBreak += Math.max(0, Math.floor((now - prev.currentBreakStartTime) / 1000));
      }

      return {
        ...prev,
        status: 'working',
        accumulatedBreakSeconds: newAccBreak,
        currentBreakStartTime: null,
        currentIntervalStartTime: now,
        workSessionsCount: prev.workSessionsCount + 1,
        workIntervalAlerted: false,
      };
    });
  }, [markLocalEdit]);

  const endWorkday = useCallback(() => {
    markLocalEdit();
    const now = Date.now();
    const todayStr = new Date(now).toISOString().split('T')[0];

    // Close any active session and save its duration
    setPersonalSessions((prev) =>
      prev.map((s) => {
        if (s.status === 'in_progress') {
          const duration = Math.max(1, Math.floor((now - s.startTimestamp) / 1000));
          return {
            ...s,
            endTime: formatSessionClock(now),
            endTimestamp: now,
            durationSeconds: duration,
            status: 'completed',
          };
        }
        return s;
      })
    );

    let finalActiveWork = workdayState.accumulatedWorkSeconds;
    let finalBreak = workdayState.accumulatedBreakSeconds;

    if (workdayState.status === 'working' && workdayState.currentIntervalStartTime) {
      finalActiveWork += Math.max(0, Math.floor((now - workdayState.currentIntervalStartTime) / 1000));
    } else if (workdayState.status === 'on_break' && workdayState.currentBreakStartTime) {
      finalBreak += Math.max(0, Math.floor((now - workdayState.currentBreakStartTime) / 1000));
    }

    const startTimestamp = workdayState.workdayStartTime || now;
    const totalElapsed = Math.max(0, Math.floor((now - startTimestamp) / 1000));

    const formatClockTime = (ts: number) => {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const summary: WorkdaySummary = {
      id: `ws-${Date.now()}`,
      date: todayStr,
      startTime: formatClockTime(startTimestamp),
      endTime: formatClockTime(now),
      totalElapsedSeconds: totalElapsed,
      activeWorkSeconds: finalActiveWork,
      totalBreakSeconds: finalBreak,
      sessionsCount: Math.max(1, workdayState.workSessionsCount),
      breaksCount: workdayState.breaksCount,
      plannedWorkMinutes: workdayState.targetWorkMinutes,
      actualWorkMinutes: Math.round(finalActiveWork / 60),
      status:
        finalActiveWork >= workdayState.targetWorkMinutes * 60 ? 'completed' : 'ended_early',
      createdAt: new Date().toISOString(),
    };

    setWorkdayHistory((prev) => [summary, ...prev]);
    setWorkdaySummary(summary);
    setWorkdaySummaryOpen(true);

    setWorkdayState((prev) => ({
      ...prev,
      status: 'completed',
      accumulatedWorkSeconds: finalActiveWork,
      currentIntervalStartTime: null,
      accumulatedBreakSeconds: finalBreak,
      currentBreakStartTime: null,
      pausedAt: null,
    }));

    if (settings.notificationPreferences.sound) {
      playNotificationChime('complete');
    }
    addNotification(
      'Workday Completed',
      `Great job today! Total active personal time: ${Math.round(finalActiveWork / 60)} minutes.`,
      'success',
      'today'
    );
  }, [workdayState, settings.notificationPreferences.sound, addNotification, markLocalEdit]);

  const updateWorkdayConfig = useCallback((targetWorkMinutes: number, targetBreakMinutes: number) => {
    setWorkdayState((prev) => ({
      ...prev,
      targetWorkMinutes,
      targetBreakMinutes,
    }));
  }, []);

  const saveWorkdaySummaryNotes = useCallback((id: string, notes: string) => {
    markLocalEdit();
    setWorkdayHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
    if (workdaySummary && workdaySummary.id === id) {
      setWorkdaySummary((prev) => (prev ? { ...prev, notes } : null));
    }
  }, [workdaySummary, markLocalEdit]);

  // Periodic check for Work Interval Completion and Break Overdue Alerts
  useEffect(() => {
    if (workdayState.status !== 'working' && workdayState.status !== 'on_break') return;

    const interval = setInterval(() => {
      const currentTime = Date.now();

      if (workdayState.status === 'working' && !workdayState.workIntervalAlerted) {
        let currentActive = workdayState.accumulatedWorkSeconds;
        if (workdayState.currentIntervalStartTime) {
          currentActive += Math.floor((currentTime - workdayState.currentIntervalStartTime) / 1000);
        }
        if (currentActive >= workdayState.targetWorkMinutes * 60) {
          if (settings.notificationPreferences.sound) {
            playNotificationChime('complete');
          }
          addNotification(
            'Work Interval Complete',
            'Your work interval is complete. Time to take a break.',
            'alert',
            'today'
          );
          setWorkdayState((prev) => ({ ...prev, workIntervalAlerted: true }));
        }
      }

      if (workdayState.status === 'on_break' && !workdayState.breakOverdueAlerted) {
        let breakElapsed = 0;
        if (workdayState.currentBreakStartTime) {
          breakElapsed = Math.floor((currentTime - workdayState.currentBreakStartTime) / 1000);
        }
        if (breakElapsed >= workdayState.targetBreakMinutes * 60) {
          if (settings.notificationPreferences.sound) {
            playNotificationChime('alert');
          }
          addNotification(
            'Break Ended',
            'Your break is over. Ready to get back to work?',
            'warning',
            'today'
          );
          setWorkdayState((prev) => ({ ...prev, breakOverdueAlerted: true }));
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [
    workdayState.status,
    workdayState.workIntervalAlerted,
    workdayState.breakOverdueAlerted,
    workdayState.accumulatedWorkSeconds,
    workdayState.currentIntervalStartTime,
    workdayState.targetWorkMinutes,
    workdayState.currentBreakStartTime,
    workdayState.targetBreakMinutes,
    settings.notificationPreferences.sound,
    addNotification,
  ]);

  // ==========================================
  // NEEDS ATTENTION RECURRING REMINDERS ENGINE
  // ==========================================
  const DEFAULT_ATTENTION_SETTINGS: NeedsAttentionSettings = {
    recurringReminderEnabled: true,
    reminderIntervalHours: 2,
    lastAlertTimestamp: 0,
    dismissedItemIds: [],
  };

  const [needsAttentionSettings, setNeedsAttentionSettings] = useState<NeedsAttentionSettings>(() => {
    return loadStored('attention_settings', DEFAULT_ATTENTION_SETTINGS);
  });

  useEffect(() => {
    saveStored('attention_settings', needsAttentionSettings);
  }, [needsAttentionSettings]);

  const updateNeedsAttentionSettings = useCallback((updates: Partial<NeedsAttentionSettings>) => {
    setNeedsAttentionSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const dismissAttentionItem = useCallback((id: string) => {
    setNeedsAttentionSettings((prev) => ({
      ...prev,
      dismissedItemIds: prev.dismissedItemIds.includes(id)
        ? prev.dismissedItemIds
        : [...prev.dismissedItemIds, id],
    }));
  }, []);

  // Recurring Attention Reminder Worker (Strict 12-Hour Deadline Window: 0 < diffMs <= 12 hours)
  useEffect(() => {
    if (!needsAttentionSettings.recurringReminderEnabled) return;

    const interval = setInterval(() => {
      const nowTs = Date.now();
      const intervalMs = needsAttentionSettings.reminderIntervalHours * 3600 * 1000;
      if (nowTs - needsAttentionSettings.lastAlertTimestamp < intervalMs) {
        return;
      }

      const dismissed = needsAttentionSettings.dismissedItemIds || [];

      const eligibleTasks = tasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (dismissed.includes(t.id)) return false;
        const target = parseDeadlineTarget(t.deadline, t.dueTime);
        const diff = target - nowTs;
        return diff > 0 && diff <= TWELVE_HOURS_MS;
      });

      const eligibleSchedules = schedules.filter((s) => {
        if (s.isCompleted) return false;
        if (dismissed.includes(s.id)) return false;
        const target = parseDeadlineTarget(s.date, s.startTime);
        const diff = target - nowTs;
        return diff > 0 && diff <= TWELVE_HOURS_MS;
      });

      const eligibleGoals = goals.filter((g) => {
        if (g.isCompleted) return false;
        if (dismissed.includes(g.id)) return false;
        const target = parseDeadlineTarget(g.targetDate);
        const diff = target - nowTs;
        return diff > 0 && diff <= TWELVE_HOURS_MS;
      });

      const eligibleMilestones = goals.flatMap((g) =>
        (g.milestones || []).filter((m) => {
          if (m.isCompleted) return false;
          if (dismissed.includes(m.id)) return false;
          const target = parseDeadlineTarget(m.targetDate);
          const diff = target - nowTs;
          return diff > 0 && diff <= TWELVE_HOURS_MS;
        })
      );

      const totalAttentionCount =
        eligibleTasks.length + eligibleSchedules.length + eligibleGoals.length + eligibleMilestones.length;

      if (totalAttentionCount > 0) {
        addNotification(
          'Attention Required',
          `You have ${totalAttentionCount} item${totalAttentionCount > 1 ? 's' : ''} with deadlines approaching within the next 12 hours.`,
          'alert',
          'dashboard'
        );
        if (settings.notificationPreferences.sound) {
          playNotificationChime('alert');
        }
        setNeedsAttentionSettings((prev) => ({ ...prev, lastAlertTimestamp: nowTs }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [
    needsAttentionSettings.recurringReminderEnabled,
    needsAttentionSettings.reminderIntervalHours,
    needsAttentionSettings.lastAlertTimestamp,
    needsAttentionSettings.dismissedItemIds,
    tasks,
    schedules,
    goals,
    settings.notificationPreferences.sound,
    addNotification,
  ]);

  // CRUD Implementations
  const addClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: `c-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setClients((prev) => [newClient, ...prev]);
    addNotification('Client Added', `${newClient.fullName} was created successfully.`, 'success', 'contacts', newClient.id);
    return newClient;
  }, [addNotification, markLocalEdit]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    markLocalEdit();
    const now = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c))
    );
  }, [markLocalEdit]);

  const deleteClient = useCallback((id: string) => {
    markLocalEdit(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, [markLocalEdit]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'amountPaid' | 'totalTimeTrackedSeconds'>): Task => {
    markLocalEdit();
    const now = new Date().toISOString();
    const feePct = taskData.platformFeePercentage ?? (settings.platformFees[taskData.platform] ?? 0);
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      platformFeePercentage: feePct,
      amountPaid: 0,
      totalTimeTrackedSeconds: 0,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);
    addNotification('Task Created', `Added task "${newTask.name}" under ${newTask.platform}.`, 'success', 'tasks', newTask.id);
    return newTask;
  }, [settings.platformFees, addNotification, markLocalEdit]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    markLocalEdit();
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
    );
  }, [markLocalEdit]);

  const deleteTask = useCallback((id: string) => {
    markLocalEdit(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [markLocalEdit]);

  const completeTask = useCallback((id: string) => {
    markLocalEdit();
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          let payoutDays = 0;
          if (t.platform === 'Fiverr') payoutDays = 15;
          else if (t.platform === 'Upwork') payoutDays = 5;

          const baseUpdate: Task = {
            ...t,
            status: 'completed',
            completedAt: now,
            updatedAt: now,
          };

          if (payoutDays > 0) {
            baseUpdate.payoutExpectedDate = new Date(Date.now() + 86400000 * payoutDays).toISOString().split('T')[0];
            baseUpdate.payoutStatus = 'pending';
          }

          return baseUpdate;
        }
        return t;
      })
    );
    addNotification('Task Completed', 'Great job! Task has been marked as complete.', 'success', 'tasks', id);
  }, [addNotification, markLocalEdit]);

  const addTimeEntry = useCallback((entryData: Omit<TimeEntry, 'id' | 'createdAt'>): TimeEntry => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newEntry: TimeEntry = {
      ...entryData,
      id: `te-${Date.now()}`,
      createdAt: now,
    };
    setTimeEntries((prev) => [newEntry, ...prev]);

    if (newEntry.projectId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newEntry.projectId
            ? { ...t, totalTimeTrackedSeconds: (t.totalTimeTrackedSeconds || 0) + newEntry.durationSeconds, updatedAt: now }
            : t
        )
      );
    }
    return newEntry;
  }, [markLocalEdit]);

  const updateTimeEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    markLocalEdit();
    setTimeEntries((prev) => prev.map((te) => (te.id === id ? { ...te, ...updates } : te)));
  }, [markLocalEdit]);

  const deleteTimeEntry = useCallback((id: string) => {
    markLocalEdit(id);
    setTimeEntries((prev) => prev.filter((te) => te.id !== id));
  }, [markLocalEdit]);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>): Invoice => {
    markLocalEdit();
    const now = new Date().toISOString();
    const count = invoices.length + 1;
    const invNum = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      createdAt: now,
      updatedAt: now,
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    const timeEntryIds = invoiceData.lineItems.map((li) => li.timeEntryId).filter(Boolean);
    if (timeEntryIds.length > 0) {
      setTimeEntries((prev) =>
        prev.map((te) => (timeEntryIds.includes(te.id) ? { ...te, invoiceId: newInvoice.id } : te))
      );
    }

    addNotification('Invoice Created', `Invoice ${newInvoice.invoiceNumber} for ${newInvoice.clientName} generated.`, 'success', 'time', newInvoice.id);
    return newInvoice;
  }, [invoices.length, addNotification, markLocalEdit]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    markLocalEdit();
    const now = new Date().toISOString();
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates, updatedAt: now } : inv)));
  }, [markLocalEdit]);

  const deleteInvoice = useCallback((id: string) => {
    markLocalEdit(id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setTimeEntries((prev) => prev.map((te) => (te.invoiceId === id ? { ...te, invoiceId: null } : te)));
  }, [markLocalEdit]);

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...paymentData,
      id: `p-${Date.now()}`,
      createdAt: now,
    };
    setPayments((prev) => [newPayment, ...prev]);

    if (newPayment.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === newPayment.invoiceId) {
            const newPaid = Number((inv.amountPaid + newPayment.amount).toFixed(2));
            const newBalance = Math.max(0, Number((inv.total - newPaid).toFixed(2)));
            const newStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid';
            return {
              ...inv,
              amountPaid: newPaid,
              balanceDue: newBalance,
              status: newStatus,
              updatedAt: now,
            };
          }
          return inv;
        })
      );
    }

    if (newPayment.projectId) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === newPayment.projectId) {
            const newPaid = Number(((t.amountPaid || 0) + newPayment.amount).toFixed(2));
            return {
              ...t,
              amountPaid: newPaid,
              updatedAt: now,
            };
          }
          return t;
        })
      );
    }

    addNotification('Payment Recorded', `Received ${paymentData.amount} ${paymentData.currency} from ${paymentData.clientName}.`, 'success', 'earnings', newPayment.id);
    return newPayment;
  }, [addNotification, markLocalEdit]);

  const updatePayment = useCallback((id: string, updates: Partial<Payment>) => {
    markLocalEdit();
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [markLocalEdit]);

  const deletePayment = useCallback((id: string) => {
    markLocalEdit(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, [markLocalEdit]);

  const addSchedule = useCallback((itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'isCompleted'>): ScheduleItem => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newItem: ScheduleItem = {
      ...itemData,
      id: `s-${Date.now()}`,
      isCompleted: false,
      createdAt: now,
    };
    setSchedules((prev) => [newItem, ...prev]);
    addNotification('Schedule Added', `Scheduled "${newItem.title}" for ${newItem.date} at ${newItem.startTime}.`, 'info', 'schedule', newItem.id);
    return newItem;
  }, [addNotification, markLocalEdit]);

  const updateSchedule = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    markLocalEdit();
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, [markLocalEdit]);

  const deleteSchedule = useCallback((id: string) => {
    markLocalEdit(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, [markLocalEdit]);

  const toggleScheduleComplete = useCallback((id: string) => {
    markLocalEdit();
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s))
    );
  }, [markLocalEdit]);

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'isCompleted' | 'currentActualValue'>): Goal => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      id: `g-${Date.now()}`,
      currentActualValue: 0,
      isCompleted: false,
      createdAt: now,
    };
    setGoals((prev) => [newGoal, ...prev]);
    addNotification('Goal Created', `New goal "${newGoal.name}" established.`, 'success', 'goals', newGoal.id);
    return newGoal;
  }, [addNotification, markLocalEdit]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    markLocalEdit();
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, [markLocalEdit]);

  const deleteGoal = useCallback((id: string) => {
    markLocalEdit(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [markLocalEdit]);

  const toggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    markLocalEdit();
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
          );
          const allCompleted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.isCompleted);
          return {
            ...g,
            milestones: updatedMilestones,
            isCompleted: allCompleted,
          };
        }
        return g;
      })
    );
  }, [markLocalEdit]);

  const addExpense = useCallback((expData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    markLocalEdit();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expData,
      id: `e-${Date.now()}`,
      createdAt: now,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    addNotification('Expense Logged', `Recorded ${newExpense.amount} ${newExpense.currency} for ${newExpense.title}.`, 'info', 'budget', newExpense.id);
    return newExpense;
  }, [addNotification, markLocalEdit]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    markLocalEdit();
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, [markLocalEdit]);

  const deleteExpense = useCallback((id: string) => {
    markLocalEdit(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [markLocalEdit]);

  const addBudgetCategory = useCallback((catData: Omit<BudgetCategory, 'id'>): BudgetCategory => {
    markLocalEdit();
    const newCat: BudgetCategory = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setBudgetCategories((prev) => [...prev, newCat]);
    return newCat;
  }, [markLocalEdit]);

  const updateBudgetCategory = useCallback((id: string, updates: Partial<BudgetCategory>) => {
    markLocalEdit();
    setBudgetCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [markLocalEdit]);

  const deleteBudgetCategory = useCallback((id: string) => {
    markLocalEdit(id);
    setBudgetCategories((prev) => prev.filter((c) => c.id !== id));
  }, [markLocalEdit]);

  const addSubscription = useCallback((subData: Omit<Subscription, 'id'>): Subscription => {
    markLocalEdit();
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}`,
    };
    setSubscriptions((prev) => [newSub, ...prev]);
    return newSub;
  }, [markLocalEdit]);

  const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
    markLocalEdit();
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, [markLocalEdit]);

  const deleteSubscription = useCallback((id: string) => {
    markLocalEdit(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }, [markLocalEdit]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    markLocalEdit();
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, [markLocalEdit]);

  // Background reminder checker
  useEffect(() => {
    const checkDeadlinesAndSchedules = () => {
      const today = new Date().toISOString().split('T')[0];

      tasks.forEach((t) => {
        if (t.status !== 'completed' && t.status !== 'cancelled' && t.deadline < today) {
          // Task overdue
        }
      });

      subscriptions.forEach((sub) => {
        if (sub.status === 'active') {
          const daysDiff = Math.ceil(
            (new Date(sub.renewalDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          if (daysDiff <= sub.reminderDaysBefore && daysDiff >= 0) {
            // Subscription renewal reminder
          }
        }
      });
    };

    checkDeadlinesAndSchedules();
    const interval = setInterval(checkDeadlinesAndSchedules, 60000);
    return () => clearInterval(interval);
  }, [tasks, subscriptions]);

  // Workspace Backup & Cross-Domain Recovery
  const exportWorkspaceJSON = useCallback((): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      planBudgets,
      budgetCategories,
      clients,
      timeEntries,
      invoices,
      payments,
      schedules,
      goals,
      expenses,
      subscriptions,
      companyProfile,
      workdayHistory,
      personalSessions,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  }, [
    tasks,
    planBudgets,
    budgetCategories,
    clients,
    timeEntries,
    invoices,
    payments,
    schedules,
    goals,
    expenses,
    subscriptions,
    companyProfile,
    workdayHistory,
    personalSessions,
    settings,
  ]);

  const importWorkspaceJSON = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      markLocalEdit();

      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.planBudgets)) setPlanBudgets(data.planBudgets);
      if (Array.isArray(data.budgetCategories)) setBudgetCategories(data.budgetCategories);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (Array.isArray(data.timeEntries)) setTimeEntries(data.timeEntries);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.schedules)) setSchedules(data.schedules);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.subscriptions)) setSubscriptions(data.subscriptions);
      if (data.companyProfile) setCompanyProfile(data.companyProfile);
      if (Array.isArray(data.workdayHistory)) setWorkdayHistory(data.workdayHistory);
      if (Array.isArray(data.personalSessions)) setPersonalSessions(data.personalSessions);
      if (data.settings) setSettings(data.settings);

      // Save imported state to Firestore if signed in
      if (currentUser?.uid && !currentUser.uid.startsWith('local-user-')) {
        saveUserWorkspace(currentUser.uid, {
          tasks: data.tasks || tasks,
          planBudgets: data.planBudgets || planBudgets,
          budgetCategories: data.budgetCategories || budgetCategories,
          clients: data.clients || clients,
          timeEntries: data.timeEntries || timeEntries,
          invoices: data.invoices || invoices,
          payments: data.payments || payments,
          schedules: data.schedules || schedules,
          goals: data.goals || goals,
          expenses: data.expenses || expenses,
          subscriptions: data.subscriptions || subscriptions,
          companyProfile: data.companyProfile || companyProfile,
          workdayHistory: data.workdayHistory || workdayHistory,
          personalSessions: data.personalSessions || personalSessions,
          settings: data.settings || settings,
        })
          .then(() => {
            try {
              localStorage.setItem('freelanceos_owner_uid', currentUser.uid);
              localStorage.setItem('freelanceos_local_dirty', 'false');
            } catch {}
          })
          .catch((err) => console.error('Save imported workspace error:', err));
      }

      addNotification('Workspace Imported', 'All tasks, budgets, invoices, and settings successfully restored.', 'success');
      return true;
    } catch (err) {
      console.error('Failed to import workspace JSON:', err);
      return false;
    }
  }, [
    currentUser?.uid,
    tasks,
    planBudgets,
    budgetCategories,
    clients,
    timeEntries,
    invoices,
    payments,
    schedules,
    goals,
    expenses,
    subscriptions,
    companyProfile,
    workdayHistory,
    personalSessions,
    settings,
    addNotification,
    markLocalEdit,
  ]);

  const restoreEmergencyBackup = useCallback((): boolean => {
    try {
      const raw =
        localStorage.getItem('freelanceos_workspace_emergency_backup') ||
        localStorage.getItem('freelanceos_workspace_emergency_backup_prev');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      markLocalEdit();

      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.planBudgets)) setPlanBudgets(data.planBudgets);
      if (Array.isArray(data.budgetCategories)) setBudgetCategories(data.budgetCategories);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (Array.isArray(data.timeEntries)) setTimeEntries(data.timeEntries);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.schedules)) setSchedules(data.schedules);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.subscriptions)) setSubscriptions(data.subscriptions);
      if (data.companyProfile) setCompanyProfile(data.companyProfile);
      if (Array.isArray(data.workdayHistory)) setWorkdayHistory(data.workdayHistory);
      if (Array.isArray(data.personalSessions)) setPersonalSessions(data.personalSessions);
      if (data.settings) setSettings(data.settings);

      addNotification('Backup Restored', 'Workspace snapshot restored successfully from pre-sync cache.', 'success');
      return true;
    } catch (e) {
      console.error('Failed to restore emergency backup:', e);
      return false;
    }
  }, [addNotification, markLocalEdit]);

  const value = useMemo(
    () => ({
      activePage,
      setActivePage,
      clients,
      tasks,
      timeEntries,
      invoices,
      payments,
      schedules,
      goals,
      budgetCategories,
      expenses,
      subscriptions,
      savingsTargets,
      settings,
      ratesData,
      displayCurrency,
      setDisplayCurrency,
      refreshExchangeRates,
      updateCustomRates,
      activeTimer,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      clearActiveTimer,
      elapsedSeconds,
      isTimerRunning: activeTimer.isRunning,
      timerSeconds: elapsedSeconds,
      formatTimerTime,
      completedSessionSummary,
      dismissCompletedSessionSummary,
      quickAddOpen,
      setQuickAddOpen,
      settingsOpen,
      setSettingsOpen,
      notificationDrawerOpen,
      setNotificationDrawerOpen,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      addClient,
      updateClient,
      deleteClient,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addPayment,
      updatePayment,
      deletePayment,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      toggleScheduleComplete,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleMilestone,
      addExpense,
      updateExpense,
      deleteExpense,
      addBudgetCategory,
      updateBudgetCategory,
      deleteBudgetCategory,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      updateSettings,
      workdayState,
      startWorkday,
      pauseWorkday,
      resumeWorkday,
      startBreak,
      resumeFromBreak,
      skipBreak,
      endWorkday,
      updateWorkdayConfig,
      workdaySummary,
      workdaySummaryOpen,
      setWorkdaySummaryOpen,
      saveWorkdaySummaryNotes,
      workdayHistory,
      personalSessions,
      activePersonalSession,
      getPersonalDailyTotalSeconds,
      getPersonalWeeklyTotalSeconds,
      getPersonalMonthlyTotalSeconds,
      calculateSessionSecondsForDay,
      deletePersonalSession,
      needsAttentionSettings,
      updateNeedsAttentionSettings,
      dismissAttentionItem,
      companyProfile,
      updateCompanyProfile,
      companyProfileModalOpen,
      setCompanyProfileModalOpen,
      planBudgets,
      addPlanBudget,
      updatePlanBudget,
      deletePlanBudget,
      planBudgetModalOpen,
      setPlanBudgetModalOpen,
      expenseModalOpen,
      setExpenseModalOpen,
      searchQuery,
      setSearchQuery,
      exportWorkspaceJSON,
      importWorkspaceJSON,
      restoreEmergencyBackup,
      hasEmergencyBackup,
      retryCloudSync,
    }),
    [
      activePage,
      clients,
      tasks,
      timeEntries,
      invoices,
      payments,
      schedules,
      goals,
      budgetCategories,
      expenses,
      subscriptions,
      savingsTargets,
      settings,
      ratesData,
      displayCurrency,
      refreshExchangeRates,
      updateCustomRates,
      activeTimer,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      clearActiveTimer,
      elapsedSeconds,
      completedSessionSummary,
      dismissCompletedSessionSummary,
      quickAddOpen,
      settingsOpen,
      notificationDrawerOpen,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      addClient,
      updateClient,
      deleteClient,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addPayment,
      updatePayment,
      deletePayment,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      toggleScheduleComplete,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleMilestone,
      addExpense,
      updateExpense,
      deleteExpense,
      addBudgetCategory,
      updateBudgetCategory,
      deleteBudgetCategory,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      updateSettings,
      workdayState,
      startWorkday,
      pauseWorkday,
      resumeWorkday,
      startBreak,
      resumeFromBreak,
      skipBreak,
      endWorkday,
      updateWorkdayConfig,
      workdaySummary,
      workdaySummaryOpen,
      saveWorkdaySummaryNotes,
      workdayHistory,
      personalSessions,
      activePersonalSession,
      getPersonalDailyTotalSeconds,
      getPersonalWeeklyTotalSeconds,
      getPersonalMonthlyTotalSeconds,
      calculateSessionSecondsForDay,
      deletePersonalSession,
      needsAttentionSettings,
      updateNeedsAttentionSettings,
      dismissAttentionItem,
      companyProfile,
      updateCompanyProfile,
      companyProfileModalOpen,
      planBudgets,
      addPlanBudget,
      updatePlanBudget,
      deletePlanBudget,
      planBudgetModalOpen,
      expenseModalOpen,
      searchQuery,
      exportWorkspaceJSON,
      importWorkspaceJSON,
      restoreEmergencyBackup,
      hasEmergencyBackup,
      retryCloudSync,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
