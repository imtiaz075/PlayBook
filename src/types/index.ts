export type PlatformType =
  | 'Fiverr'
  | 'Upwork'
  | 'Freelancer.com'
  | 'PeoplePerHour'
  | 'Guru'
  | 'LinkedIn'
  | 'Direct Clients'
  | 'Other'
  | string;

export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type ClientStatus = 'active' | 'closed' | 'archived';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type GoalCategory =
  | 'learning'
  | 'achievements'
  | 'career'
  | 'personal'
  | 'custom'
  | string;

export type MeasurementMethod = 'milestones' | 'numeric_auto' | 'manual';

export interface CompanyProfile {
  businessName: string;
  businessLogo?: string;
  address?: string;
  email?: string;
  phone?: string;
  taxRegistrationNumber?: string;
  website?: string;
  defaultCurrency: string;
  paymentInstructions?: string;
  bankDetails?: string;
  defaultInvoiceNotes?: string;
  defaultInvoiceTerms?: string;
}

export interface Client {
  id: string;
  fullName: string; // Required
  companyName?: string;
  clientSource: string; // Fiverr, Upwork, LinkedIn, etc.
  email?: string; // Optional
  phone?: string; // Optional
  website?: string;
  address?: string;
  country?: string;
  preferredCurrency: string;
  pricingType: 'hourly' | 'fixed'; // Pricing type selector
  hourlyRate?: number;
  fixedAgreedAmount?: number;
  agreedPaymentTerms?: string;
  totalDealValue?: number;
  notes?: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  platform: PlatformType;
  deadline: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm optional specific due time
  startDate?: string;
  priority: Priority;
  status: TaskStatus;
  priceType: 'fixed' | 'hourly';
  projectPrice: number; // in project currency
  currency: string;
  hourlyRate?: number;
  estimatedHours?: number;
  notes?: string;
  deadlineAlertEnabled: boolean;
  recurringReminder?: 'none' | 'daily' | 'weekly';
  platformFeePercentage: number; // e.g. 20 for Fiverr, 15 for Upwork, 0 for Direct
  amountPaid: number;
  totalTimeTrackedSeconds: number;
  completedAt?: string;
  payoutExpectedDate?: string;
  payoutStatus?: 'pending' | 'cleared' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO or HH:mm
  endTime: string; // ISO or HH:mm
  durationSeconds: number;
  hourlyRate: number;
  isBillable: boolean;
  billableAmount: number;
  description: string;
  invoiceId?: string | null; // null if not invoiced yet
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  timeEntryId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientAddress?: string;
  projectId?: string;
  projectName?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountRate: number; // percentage
  discountAmount: number;
  taxRate: number; // percentage
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes?: number;
  type: 'activity' | 'reminder';
  notes?: string;
  isCompleted: boolean;
  alertAtTime: boolean;
  advanceReminderMinutes: number; // 0, 15, 30, 60, 1440
  repeatSetting: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
  targetValue?: number;
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  customCategoryName?: string;
  description?: string;
  reason?: string;
  startDate?: string;
  targetDate: string; // YYYY-MM-DD
  priority: Priority;
  measurementMethod: MeasurementMethod;
  targetValue?: number;
  currentActualValue: number;
  progressPercentage: number;
  notes?: string;
  achievementsLog?: { date: string; note: string }[];
  reminderSettings?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  isCompleted: boolean;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number;
  currency: string;
  color: string;
  iconName: string;
}

export interface BudgetCategoryAllocation {
  category: string;
  plannedAmount: number;
}

export interface PlanBudget {
  id: string;
  name: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  currency: string;
  totalPlannedBudget: number;
  categoryAllocations: BudgetCategoryAllocation[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  isCustomCategory?: boolean;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  budgetId?: string;
  isRecurring: boolean;
  recurrenceFrequency?: 'weekly' | 'monthly' | 'yearly';
  nextRenewalDate?: string;
  notes?: string;
  receiptAttachment?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  category: string;
  renewalDate: string; // YYYY-MM-DD
  autoRenew: boolean;
  reminderDaysBefore: number;
  status: 'active' | 'cancelled' | 'paused';
  createdAt: string;
}

export interface SavingsTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string;
  notes?: string;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  userEmail: string;
  businessName: string;
  defaultCurrency: string;
  defaultHourlyRate: number;
  platformFees: Record<string, number>; // e.g. { Fiverr: 20, Upwork: 15 }
  notificationPreferences: {
    email: boolean;
    browser: boolean;
    sound: boolean;
    leadTimeHours: number;
  };
}

export interface ActiveTimer {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null; // Date.now() timestamp
  accumulatedSeconds: number; // accumulated time before current pause/resume
  lastResumedTime: number | null; // Date.now() timestamp when timer was last resumed
  projectId: string; // associated task/project ID
  clientId: string;
  projectName: string;
  clientName: string;
  hourlyRate: number;
  description: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  linkPage?: string;
  itemId?: string;
}

export type WorkdayStatus = 'idle' | 'working' | 'on_break' | 'paused' | 'completed';

export interface WorkdayState {
  status: WorkdayStatus;
  workdayStartTime: number | null;
  targetWorkMinutes: number;
  targetBreakMinutes: number;
  currentIntervalStartTime: number | null;
  accumulatedWorkSeconds: number;
  currentBreakStartTime: number | null;
  accumulatedBreakSeconds: number;
  workSessionsCount: number;
  breaksCount: number;
  pausedAt: number | null;
  previousStatusBeforePause?: WorkdayStatus;
  workIntervalAlerted: boolean;
  breakOverdueAlerted: boolean;
}

export interface PersonalWorkSession {
  id: string;
  date: string; // YYYY-MM-DD (local calendar day)
  startTime: string; // formatted display time e.g. "09:30 AM" or ISO
  endTime: string | null; // formatted display time e.g. "10:15 AM", or null if in progress
  startTimestamp: number; // millisecond epoch
  endTimestamp: number | null; // millisecond epoch
  durationSeconds: number; // calculated seconds
  status: 'in_progress' | 'completed' | 'paused';
  notes?: string;
  createdAt: string;
}

export interface WorkdaySummary {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalElapsedSeconds: number;
  activeWorkSeconds: number;
  totalBreakSeconds: number;
  sessionsCount: number;
  breaksCount: number;
  plannedWorkMinutes: number;
  actualWorkMinutes: number;
  status: 'completed' | 'ended_early';
  notes?: string;
  createdAt: string;
}

export interface NeedsAttentionSettings {
  recurringReminderEnabled: boolean;
  reminderIntervalHours: number;
  lastAlertTimestamp: number;
  dismissedItemIds: string[];
}
