import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { WalletActionHeader } from "@/components/wallet/WalletActionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { prepareAmountForCommissionCalculation, processCommissionResult } from "@/utils/commissionCurrencyHelper";

interface Provider {
  id: number;
  name: string;
  icon: string;
  description: string;
  currencyCode?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface Denomination {
  id?: string;
  value: number;
  displayValue?: string;
}

interface CommissionData {
  original_amount: number;
  commission_value: number;
  commission_type: string;
  commission_rate: number;
  final_amount: number;
  reloadly_amount: number;
}

const Airtime = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { walletBalance } = useWalletContext();
  const { selectedCurrency, formatCurrency, convertAmount, getExchangeRate } = useCurrency();
  
  const [step, setStep] = useState<"provider" | "amount" | "phone" | "review" | "success">("provider");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [denominationsLoading, setDenominationsLoading] = useState(false);
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);

  // Fetch operators on component mount
  useEffect(() => {
    const fetchOperators = async () => {
      if (!user || !session) return;

      try {
        const token = session?.access_token;
        const countryCode = 'NG'; // Default to Nigeria

        const response = await fetch(`/api/reloadly/operators/${countryCode}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('API returned non-JSON response');
        }

        const result = await response.json();
        if (result.success && result.operators) {
          const mappedProviders = result.operators.map((op: any) => ({
            id: op.id,
            name: op.name,
            icon: '🟡',
            description: op.name,
            currencyCode: op.destinationCurrencyCode || 'NGN',
            minAmount: op.minAmount,
            maxAmount: op.maxAmount
          }));
          setProviders(mappedProviders);
          if (mappedProviders.length > 0) {
            setSelectedProvider(mappedProviders[0]);
            fetchDenominations(mappedProviders[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch operators:', error);
        toast.error('Failed to load service providers');
        setProviders([]);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchOperators();
  }, [user, session]);

  // Fetch denominations when provider changes
  const fetchDenominations = async (operatorId: number) => {
    setDenominationsLoading(true);
    try {
      const token = session?.access_token;
      const response = await fetch(`/api/reloadly/operators/${operatorId}/denominations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.denominations && Array.isArray(result.denominations)) {
          const sortedDenominations = result.denominations
            .map((d: any) => ({
              id: d.id || d.value,
              value: typeof d === 'object' ? d.value : d,
              displayValue: typeof d === 'object' ? d.displayValue : d
            }))
            .sort((a: Denomination, b: Denomination) => a.value - b.value);
          setDenominations(sortedDenominations);
        }
      }
    } catch (error) {
      console.error('Failed to fetch denominations:', error);
      setDenominations([]);
    } finally {
      setDenominationsLoading(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setCustomAmount("");
    fetchDenominations(provider.id);
    setStep("amount");
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const token = session?.access_token;

      const response = await fetch('/api/reloadly/airtime/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operatorId: selectedProvider?.id,
          amount: parseFloat(customAmount),
          recipientPhone: phoneNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        setStep("success");
        toast.success('Airtime purchase successful!');
      } else {
        toast.error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const numAmount = parseFloat(customAmount) || 0;
  const canProceed = selectedProvider && numAmount > 0 && phoneNumber.length >= 10;

  if (step === "success") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Airtime Purchase" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Purchase Successful!</h2>
            <p className="text-gray-600">
              {formatCurrency(numAmount)} sent to {selectedProvider?.name} {phoneNumber}
            </p>
            <Button onClick={() => navigate("/app/wallet")} className="w-full mt-6">
              Back to Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <WalletActionHeader title="Buy Airtime" subtitle="Send credit to any network" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {formatCurrency(walletBalance?.total || 0)}
              </p>
              {selectedCurrency && (
                <p className="text-xs text-gray-500 mt-2">
                  Currency: {selectedCurrency.flag} {selectedCurrency.code}
                </p>
              )}
            </CardContent>
          </Card>

          {step === "provider" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Select Network</h3>
              {providersLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading providers...
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No providers available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider)}
                      className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                      <div className="text-3xl mb-2">{provider.icon}</div>
                      <p className="font-semibold text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{provider.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "amount" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setStep("provider")}
                className="text-blue-600"
              >
                ← Change Network
              </Button>
              <h3 className="text-sm font-semibold text-gray-900">Enter Amount</h3>
              
              {/* Suggested Denominations */}
              {!denominationsLoading && denominations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Suggested amounts:</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {denominations.slice(0, 6).map((denom) => {
                      const displayValue = typeof denom.value === 'number' ? denom.value : parseFloat(denom.value);
                      return (
                        <button
                          key={denom.id}
                          onClick={() => setCustomAmount(displayValue.toString())}
                          className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                            parseFloat(customAmount) === displayValue
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-900"
                          }`}
                        >
                          {selectedProvider?.currencyCode === selectedCurrency?.code 
                            ? `${selectedProvider?.currencyCode} ${displayValue.toLocaleString()}`
                            : formatCurrency(convertAmount(displayValue, selectedProvider?.currencyCode || 'NGN', selectedCurrency?.code || 'USD'))
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Amount Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Or enter custom amount ({selectedCurrency?.code})
                </label>
                <Input
                  type="number"
                  placeholder={`Enter amount in ${selectedCurrency?.code}`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="text-lg"
                  min="0"
                  step="0.01"
                />
                {selectedProvider?.minAmount && selectedProvider?.maxAmount && (
                  <p className="text-xs text-gray-600">
                    Min: {formatCurrency(convertAmount(selectedProvider.minAmount, selectedProvider.currencyCode || 'NGN', selectedCurrency?.code || 'USD'))} - 
                    Max: {formatCurrency(convertAmount(selectedProvider.maxAmount, selectedProvider.currencyCode || 'NGN', selectedCurrency?.code || 'USD'))}
                  </p>
                )}
              </div>

              {customAmount && (
                <Button
                  onClick={() => setStep("phone")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Continue
                </Button>
              )}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setStep("amount")}
                className="text-blue-600"
              >
                ← Back
              </Button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              {canProceed && (
                <Button
                  onClick={async () => {
                    try {
                      const token = session?.access_token;
                      const response = await fetch('/api/commission/calculate', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          service_type: 'airtime',
                          amount: numAmount,
                          operator_id: selectedProvider?.id
                        })
                      });

                      const result = await response.json();
                      if (result.success) {
                        setCommissionData(result.data);
                        setStep("review");
                      } else {
                        toast.error('Failed to calculate price');
                      }
                    } catch (error) {
                      console.error('Error calculating commission:', error);
                      toast.error('Failed to calculate price');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Continue
                </Button>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setStep("phone")}
                className="text-blue-600"
              >
                ← Back
              </Button>
              <Card className="border-0 shadow-sm bg-blue-50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold">{selectedProvider?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">{formatCurrency(numAmount)}</span>
                  </div>

                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total to Pay</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(commissionData?.final_amount || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Airtime;
