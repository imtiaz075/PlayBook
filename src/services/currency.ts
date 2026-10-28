// Live exchange rate service with persistent local fallback and manual overrides

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isCustom?: boolean;
}

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  USDT: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  PKR: 278.5,
  INR: 83.2,
  BDT: 117.5,
  AED: 3.67,
  SAR: 3.75,
  SGD: 1.34,
  JPY: 154.5,
  CNY: 7.23,
  TRY: 34.2,
  BRL: 5.65,
};

const STORAGE_KEY = 'freelanceos_exchange_rates';

export function getStoredRates(): ExchangeRatesData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        base: 'USD',
        rates: { ...DEFAULT_RATES, ...parsed.rates, USDT: 1.0 },
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        isCustom: parsed.isCustom || false,
      };
    }
  } catch (err) {
    console.warn('Failed to parse stored rates:', err);
  }
  return {
    base: 'USD',
    rates: DEFAULT_RATES,
    lastUpdated: new Date().toISOString(),
    isCustom: false,
  };
}

export function saveRates(data: ExchangeRatesData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save rates:', err);
  }
}

export async function fetchLiveRates(): Promise<{ success: boolean; data: ExchangeRatesData; message?: string }> {
  try {
    // Open Exchange Rates open API
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    const json = await response.json();
    if (json && json.rates) {
      const mergedRates: Record<string, number> = {
        ...DEFAULT_RATES,
        ...json.rates,
        USDT: 1.0, // Stablecoin pegged 1:1 to USD
      };
      const data: ExchangeRatesData = {
        base: 'USD',
        rates: mergedRates,
        lastUpdated: new Date().toISOString(),
        isCustom: false,
      };
      saveRates(data);
      return { success: true, data };
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    const fallback = getStoredRates();
    return {
      success: false,
      data: fallback,
      message: (err as Error).message || 'Network error fetching exchange rates. Loaded cached rates.',
    };
  }
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  USDT: 'USDT',
  EUR: '€',
  GBP: '£',
  PKR: '₨',
  INR: '₹',
  BDT: '৳',
  AED: 'AED',
  SAR: 'SAR',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'SG$',
  JPY: '¥',
  CNY: '¥',
  TRY: '₺',
  BRL: 'R$',
};

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  showSymbol: boolean = true
): string {
  const code = currencyCode.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const formattedNum = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!showSymbol) return formattedNum;
  if (code === 'USDT' || code === 'AED' || code === 'SAR') {
    return `${formattedNum} ${code}`;
  }
  return `${symbol}${formattedNum}`;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency.toUpperCase()] || 1.0;
  const toRate = rates[toCurrency.toUpperCase()] || 1.0;

  // Convert to USD base first, then to target currency
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}
