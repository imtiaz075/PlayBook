import React, { useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { SettingsModal } from './components/layout/SettingsModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { TimerSummaryModal } from './components/layout/TimerSummaryModal';
import { WorkdaySummaryModal } from './components/common/WorkdaySummaryModal';

// Pages
import { DashboardPage } from './components/pages/DashboardPage';
import { TodayPage } from './components/pages/TodayPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { TasksPage } from './components/pages/TasksPage';
import { TimeTrackerPage } from './components/pages/TimeTrackerPage';
import { ContactsPage } from './components/pages/ContactsPage';
import { EarningsPage } from './components/pages/EarningsPage';
import { GoalsPage } from './components/pages/GoalsPage';
import { BudgetPage } from './components/pages/BudgetPage';
import { ReportsPage } from './components/pages/ReportsPage';

// Modals
import { InvoiceModal } from './components/modals/InvoiceModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { TaskModal } from './components/modals/TaskModal';
import { ScheduleModal } from './components/modals/ScheduleModal';
import { ContactModal } from './components/modals/ContactModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { SubscriptionModal } from './components/modals/SubscriptionModal';
import { GoalModal } from './components/modals/GoalModal';
import { ManualTimeModal } from './components/modals/ManualTimeModal';
import { ClientDetailModal } from './components/modals/ClientDetailModal';

import { Task, Invoice, Client } from './types';

const MainAppContent: React.FC = () => {
  const {
    activePage,
    workdaySummary,
    workdaySummaryOpen,
    setWorkdaySummaryOpen,
    saveWorkdaySummaryNotes,
  } = useApp();

  // Navigation & responsive states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal visibility states
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState<{
    clientId: string;
    clientName: string;
    projectId?: string;
    projectName?: string;
    durationHours?: number;
    hourlyRate?: number;
    amount?: number;
  } | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetTask, setPaymentTargetTask] = useState<Task | null>(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialClientId, setTaskInitialClientId] = useState<string | undefined>(undefined);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [manualTimeModalOpen, setManualTimeModalOpen] = useState(false);

  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  // Modal Handlers
  const handleOpenCreateInvoice = () => {
    setInvoicePrefill(null);
    setInvoiceModalOpen(true);
  };

  const handleOpenCreateInvoiceWithData = (data: {
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    durationHours: number;
    hourlyRate: number;
    amount: number;
  }) => {
    setInvoicePrefill(data);
    setInvoiceModalOpen(true);
  };

  const handleOpenCreateInvoiceWithTask = (task: Task) => {
    setInvoicePrefill({
      clientId: task.clientId,
      clientName: task.clientName,
      projectId: task.id,
      projectName: task.name,
      amount: task.projectPrice,
      durationHours: Number((task.totalTimeTrackedSeconds / 3600).toFixed(1)) || 1,
      hourlyRate: task.hourlyRate,
    });
    setInvoiceModalOpen(true);
  };

  const handleOpenRecordPayment = () => {
    setPaymentTargetTask(null);
    setPaymentTargetInvoice(null);
    setPaymentModalOpen(true);
  };

  const handleOpenRecordPaymentWithTask = (task: Task) => {
    setPaymentTargetTask(task);
    setPaymentTargetInvoice(null);
    setPaymentModalOpen(true);
  };

  const handleOpenRecordPaymentWithInvoice = (invoice: Invoice) => {
    setPaymentTargetInvoice(invoice);
    setPaymentTargetTask(null);
    setPaymentModalOpen(true);
  };

  const handleOpenNewTask = (clientId?: string) => {
    setTaskInitialClientId(clientId);
    setTaskModalOpen(true);
  };

  const handleOpenNewSchedule = () => {
    setScheduleModalOpen(true);
  };

  const handleOpenClientDetails = (clientId: string) => {
    setDetailClientId(clientId);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onOpenCreateInvoice={handleOpenCreateInvoice}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenNewTask={() => handleOpenNewTask()}
              onOpenNewSchedule={handleOpenNewSchedule}
            />
          )}

          {activePage === 'today' && (
            <TodayPage
              onOpenNewTask={() => handleOpenNewTask()}
              onOpenNewSchedule={handleOpenNewSchedule}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenClientDetails={handleOpenClientDetails}
            />
          )}

          {activePage === 'schedule' && (
            <SchedulePage onOpenNewSchedule={handleOpenNewSchedule} />
          )}

          {activePage === 'tasks' && (
            <TasksPage
              onOpenNewTask={() => handleOpenNewTask()}
              onOpenRecordPaymentWithTask={handleOpenRecordPaymentWithTask}
              onOpenCreateInvoiceWithTask={handleOpenCreateInvoiceWithTask}
              onOpenClientDetails={handleOpenClientDetails}
            />
          )}

          {activePage === 'time' && (
            <TimeTrackerPage
              onOpenCreateInvoice={handleOpenCreateInvoice}
              onOpenManualTimeModal={() => setManualTimeModalOpen(true)}
              onOpenRecordPaymentWithInvoice={handleOpenRecordPaymentWithInvoice}
            />
          )}

          {activePage === 'contacts' && (
            <ContactsPage
              onOpenNewContact={() => setContactModalOpen(true)}
              onOpenClientDetails={handleOpenClientDetails}
              onOpenNewTaskWithClient={(client) => handleOpenNewTask(client.id)}
            />
          )}

          {activePage === 'earnings' && (
            <EarningsPage
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenClientDetails={handleOpenClientDetails}
            />
          )}

          {activePage === 'goals' && (
            <GoalsPage onOpenNewGoal={() => setGoalModalOpen(true)} />
          )}

          {activePage === 'budget' && (
            <BudgetPage
              onOpenNewExpense={() => setExpenseModalOpen(true)}
              onOpenNewSubscription={() => setSubscriptionModalOpen(true)}
            />
          )}

          {activePage === 'reports' && <ReportsPage />}
        </main>
      </div>

      {/* Global Layer Modals */}
      <QuickAddModal />
      <SettingsModal />
      <NotificationDrawer />
      <TimerSummaryModal onOpenCreateInvoiceWithData={handleOpenCreateInvoiceWithData} />

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        prefillData={invoicePrefill}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        targetTask={paymentTargetTask}
        targetInvoice={paymentTargetInvoice}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initialClientId={taskInitialClientId}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
      />

      <ManualTimeModal
        isOpen={manualTimeModalOpen}
        onClose={() => setManualTimeModalOpen(false)}
      />

      <ClientDetailModal
        clientId={detailClientId}
        onClose={() => setDetailClientId(null)}
        onOpenNewTaskWithClient={(cId) => handleOpenNewTask(cId)}
        onOpenRecordPaymentWithClient={(cId) => {
          setDetailClientId(null);
          handleOpenRecordPayment();
        }}
        onOpenCreateInvoiceWithClient={(cId) => {
          setDetailClientId(null);
          handleOpenCreateInvoice();
        }}
      />

      <WorkdaySummaryModal
        summary={workdaySummary}
        isOpen={workdaySummaryOpen}
        onClose={() => setWorkdaySummaryOpen(false)}
        onSaveNotes={saveWorkdaySummaryNotes}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
      <SpeedInsights />
    </AppProvider>
  );
}

export default App;
