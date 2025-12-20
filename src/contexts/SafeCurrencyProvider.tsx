import React, { Component, ReactNode, createContext, useContext } from "react";
import type { Currency } from '@/config/currencies';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/config/currencies';

interface SafeCurrencyProviderState {
  hasError: boolean;
  error?: Error;
  CurrencyProvider?: any;
}

interface SafeCurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: string;
}

// Create a fallback context for when real provider fails
interface FallbackCurrencyContextType {
  selectedCurrency: Currency | null;
  userCurrency: Currency | null;
  isLoading: boolean;
  error: Error | null;
  exchangeRates: Map<string, number>;
  autoDetectEnabled: boolean;
  detectedCountry: string | null;
  detectedCurrency: Currency | null;
  lastUpdated: Date | null;
  setCurrency: (currencyCode: string) => Promise<void>;
  setUserCurrency: (currency: Currency | string) => Promise<void>;
  toggleAutoDetect: (enabled: boolean) => Promise<void>;
  convertAmount: (amount: number, fromCode: string, toCode: string) => number;
  convert: (amount: number, fromCode: string, toCode: string, options?: any) => any;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  getExchangeRate: (fromCode: string, toCode: string) => number | null;
  getSupportedCurrencies: () => Currency[];
  getCurrenciesByCategory: (category: any) => Currency[];
  refreshExchangeRates: () => Promise<void>;
  refreshRates: () => Promise<void>;
}

const FallbackCurrencyContext = createContext<FallbackCurrencyContextType | null>(null);

const defaultCurrency = SUPPORTED_CURRENCIES.find((c: Currency) => c.code === DEFAULT_CURRENCY) || SUPPORTED_CURRENCIES[0];

const fallbackContextValue: FallbackCurrencyContextType = {
  selectedCurrency: defaultCurrency || null,
  userCurrency: defaultCurrency || null,
  isLoading: false,
  error: null,
  exchangeRates: new Map(),
  autoDetectEnabled: false,
  detectedCountry: null,
  detectedCurrency: null,
  lastUpdated: null,
  setCurrency: async () => {},
  setUserCurrency: async () => {},
  toggleAutoDetect: async () => {},
  convertAmount: (amount: number) => amount,
  convert: (amount: number) => ({ amount, rate: 1, timestamp: new Date(), formattedAmount: amount.toString() }),
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  getExchangeRate: () => 1,
  getSupportedCurrencies: () => SUPPORTED_CURRENCIES as Currency[],
  getCurrenciesByCategory: () => [],
  refreshExchangeRates: async () => {},
  refreshRates: async () => {},
};

export const useCurrencyFallback = () => {
  const context = useContext(FallbackCurrencyContext);
  return context || fallbackContextValue;
};

// Minimal fallback component when currency provider fails
class FallbackCurrencyProvider extends Component<{ children: ReactNode }> {
  render() {
    return (
      <FallbackCurrencyContext.Provider value={fallbackContextValue}>
        {this.props.children}
      </FallbackCurrencyContext.Provider>
    );
  }
}

class SafeCurrencyProvider extends Component<
  SafeCurrencyProviderProps,
  SafeCurrencyProviderState
> {
  private mounted = false;

  constructor(props: SafeCurrencyProviderProps) {
    super(props);
    this.state = { hasError: false, CurrencyProvider: undefined };
  }

  componentDidMount() {
    this.mounted = true;
    this.loadCurrencyProvider();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  async loadCurrencyProvider() {
    try {
      if (!this.state.CurrencyProvider && this.mounted) {
        const module = await import("./CurrencyContext");
        if (this.mounted) {
          this.setState({ CurrencyProvider: module.CurrencyProvider });
        }
      }
    } catch (error) {
      console.error("Failed to load CurrencyProvider:", error);
      if (this.mounted) {
        this.setState({ hasError: true, error: error as Error });
      }
    }
  }

  static getDerivedStateFromError(error: Error): SafeCurrencyProviderState {
    console.error("CurrencyProvider Error caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("CurrencyProvider Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn(
        "Using fallback currency provider due to error:",
        this.state.error,
      );
      return (
        <FallbackCurrencyProvider>{this.props.children}</FallbackCurrencyProvider>
      );
    }

    if (!this.state.CurrencyProvider) {
      return (
        <FallbackCurrencyProvider>{this.props.children}</FallbackCurrencyProvider>
      );
    }

    try {
      const CurrencyProvider = this.state.CurrencyProvider;
      return (
        <CurrencyProvider defaultCurrency={this.props.defaultCurrency}>
          {this.props.children}
        </CurrencyProvider>
      );
    } catch (error) {
      console.error("Error in CurrencyProvider render:", error);
      return (
        <FallbackCurrencyProvider>{this.props.children}</FallbackCurrencyProvider>
      );
    }
  }
}

export default SafeCurrencyProvider;
