export type BudgetType = 'business' | 'personal' | 'home';

export const BUDGET_TYPE_OPTIONS: { value: BudgetType; label: string; shortLabel: string }[] = [
  { value: 'business', label: 'Business Budget', shortLabel: 'Business' },
  { value: 'personal', label: 'Personal Budget', shortLabel: 'Personal' },
  { value: 'home', label: 'Home Budget', shortLabel: 'Home' },
];

export const BUSINESS_BUDGET_CATEGORIES = [
  'Team & Contractors',
  'Salaries & Payroll',
  'Bonuses & Incentives',
  'Allowances & Perks',
  'Software & Subscriptions',
  'Office & Workspace',
  'Marketing & Advertising',
  'Equipment & Hardware',
  'Internet & Business Phone',
  'Taxes & Legal',
  'Travel & Client Meetings',
  'Education & Training',
  'Bank & Transaction Fees',
  'Business Expenses',
  'Other Business',
];

export const PERSONAL_BUDGET_CATEGORIES = [
  'Personal Savings & Investments',
  'Food & Dining',
  'Personal Care & Wellness',
  'Health & Medical',
  'Clothing & Shopping',
  'Transportation & Fuel',
  'Personal Mobile & Internet',
  'Entertainment & Leisure',
  'Education & Courses',
  'Gifts & Charity',
  'Debt & Loan Payments',
  'Other Personal',
];

export const HOME_BUDGET_CATEGORIES = [
  'Rent & Housing',
  'Home Utilities (Electricity, Gas, Water)',
  'Food & Groceries',
  'Home Internet & Cable',
  'Home Maintenance & Repairs',
  'Household Staff & Help',
  'Family & Household',
  'Home Appliances & Furniture',
  'Home Security & Insurance',
  'Other Home',
];

export const ALL_BUDGET_CATEGORIES = Array.from(
  new Set([
    ...BUSINESS_BUDGET_CATEGORIES,
    ...PERSONAL_BUDGET_CATEGORIES,
    ...HOME_BUDGET_CATEGORIES,
  ])
);

export const INCOME_SOURCES_BY_TYPE: Record<BudgetType, string[]> = {
  business: [
    'Client Project Payment',
    'Monthly Retainer',
    'Consulting Fee',
    'Product / SaaS Revenue',
    'Business Capital Injection',
    'Affiliate / Commission',
    'Other Business Income',
  ],
  personal: [
    'Freelance Profit Draw',
    'Salary / Paycheck',
    'Bonus / Incentive',
    'Investment / Dividend',
    'Side Hustle',
    'Gift / Refund',
    'Other Personal Income',
  ],
  home: [
    'Household Contribution',
    'Family Allowance',
    'Rental Income',
    'Shared Bills Reimbursement',
    'Home Savings Transfer',
    'Other Home Income',
  ],
};

export function getCategoriesForBudgetType(type: BudgetType): string[] {
  if (type === 'business') return BUSINESS_BUDGET_CATEGORIES;
  if (type === 'personal') return PERSONAL_BUDGET_CATEGORIES;
  return HOME_BUDGET_CATEGORIES;
}

export function normalizeCategoryName(str: string): string {
  return (str || '').toLowerCase().replace(/\s*&\s*/g, ' and ').trim();
}

const BUSINESS_SET = new Set(BUSINESS_BUDGET_CATEGORIES.map(normalizeCategoryName));
const PERSONAL_SET = new Set(PERSONAL_BUDGET_CATEGORIES.map(normalizeCategoryName));
const HOME_SET = new Set(HOME_BUDGET_CATEGORIES.map(normalizeCategoryName));

export function inferBudgetTypeFromCategory(categoryName: string): BudgetType {
  const norm = normalizeCategoryName(categoryName);
  if (BUSINESS_SET.has(norm)) return 'business';
  if (HOME_SET.has(norm)) return 'home';
  if (PERSONAL_SET.has(norm)) return 'personal';

  if (
    norm.includes('team') ||
    norm.includes('salar') ||
    norm.includes('bonus') ||
    norm.includes('allowance') ||
    norm.includes('allounce') ||
    norm.includes('software') ||
    norm.includes('business') ||
    norm.includes('marketing') ||
    norm.includes('office') ||
    norm.includes('tax') ||
    norm.includes('equipment') ||
    norm.includes('hardware') ||
    norm.includes('contractor')
  ) {
    return 'business';
  }
  if (
    norm.includes('home') ||
    norm.includes('rent') ||
    norm.includes('housing') ||
    norm.includes('grocer') ||
    norm.includes('utilit') ||
    norm.includes('household') ||
    norm.includes('family') ||
    norm.includes('electric') ||
    norm.includes('maintenance')
  ) {
    return 'home';
  }
  if (
    norm.includes('personal') ||
    norm.includes('dining') ||
    norm.includes('health') ||
    norm.includes('medical') ||
    norm.includes('entertainment') ||
    norm.includes('saving') ||
    norm.includes('debt') ||
    norm.includes('clothing') ||
    norm.includes('transport') ||
    norm.includes('education')
  ) {
    return 'personal';
  }
  return 'business';
}
