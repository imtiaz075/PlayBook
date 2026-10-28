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

export type ClientStatus = 'active' | 'inactive' | 'closed' | 'archived';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type GoalType = 'income' | 'projects_count' | 'work_hours' | 'new_clients' | 'savings' | 'learning' | 'custom';

export type MeasurementMethod = 'milestones' | 'numeric_auto' | 'manual';

export interface Client {
  id: string;
  fullName: string;
  companyName?: string;
  clientSource: string; // Fiverr, Upwork, LinkedIn, etc.
  phone?: string;
  email: string;
  website?: string;
  address?: string;
  country: string;
  preferredCurrency: string;
  hourlyRate: number;
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
  startTime: string; // ISO
  endTime: string; // ISO
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
  type: GoalType;
  targetDate: string; // YYYY-MM-DD
  targetValue: number;
  currentActualValue: number;
  measurementMethod: MeasurementMethod;
  priority: Priority;
  notes?: string;
  isCompleted: boolean;
  milestones: GoalMilestone[];
  createdAt: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number;
  icon?: string;
  isArchived: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurrenceCadence?: 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  categoryName: string;
  renewalDate: string; // YYYY-MM-DD
  recurrence: 'monthly' | 'quarterly' | 'yearly';
  reminderDaysBefore: number;
  status: 'active' | 'cancelled';
  notes?: string;
}

export interface SavingsTarget {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes?: string;
}

export interface UserSettings {
  freelancerName: string;
  freelancerEmail: string;
  freelancerTitle: string;
  companyName: string;
  businessAddress: string;
  phone: string;
  taxId: string;
  paymentInstructions: string;
  defaultCurrency: string;
  defaultHourlyRate: number;
  platformFees: Record<string, number>;
  notificationPreferences: {
    inApp: boolean;
    browser: boolean;
    sound: boolean;
    deadlineWarningHours: number;
  };
  monthlyEarningsGoal: number;
}

export interface ActiveTimer {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null; // Date.now() timestamp
  accumulatedSeconds: number;
  lastResumedTime: number | null;
  projectId: string;
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
  workdayStartTime: number | null; // Date.now() timestamp when workday started
  targetWorkMinutes: number; // e.g., 180, 240, 360, 480 or custom
  targetBreakMinutes: number; // e.g., 15, 30, 60, 120 or custom
  currentIntervalStartTime: number | null; // start timestamp of current active work interval
  accumulatedWorkSeconds: number; // total active work seconds accumulated before current interval
  currentBreakStartTime: number | null; // start timestamp of current break interval
  accumulatedBreakSeconds: number; // total break seconds accumulated
  workSessionsCount: number; // count of work sessions completed
  breaksCount: number; // count of breaks taken
  pausedAt: number | null; // timestamp when paused
  previousStatusBeforePause?: WorkdayStatus;
  workIntervalAlerted: boolean;
  breakOverdueAlerted: boolean;
}

export interface WorkdaySummary {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
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
  reminderIntervalHours: number; // default 2 hours
  lastAlertTimestamp: number;
  dismissedItemIds: string[];
}

