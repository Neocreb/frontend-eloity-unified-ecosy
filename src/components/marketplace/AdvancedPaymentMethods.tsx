import React, { useState, useEffect } from "react";
import {
  Apple,
  Zap,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  recommended?: boolean;
  processingTime?: string;
}

interface AdvancedPaymentMethodsProps {
  amount: number;
  currency?: string;
  orderId: string;
  onPaymentSuccess?: (paymentId: string, method: string) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
}

interface PaymentState {
  method: string | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Advanced Payment Methods Component
 * Supports Apple Pay, Google Pay, PayPal, and traditional card payment
 * Handles payment processing and status management
 */
export const AdvancedPaymentMethods: React.FC<AdvancedPaymentMethodsProps> = ({
  amount,
  currency = "USD",
  orderId,
  onPaymentSuccess,
  onPaymentError,
  className,
}) => {
  const { toast } = useToast();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    method: null,
    loading: false,
    processing: false,
    error: null,
    success: false,
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  // Check payment method availability on mount
  useEffect(() => {
    checkPaymentMethodAvailability();
  }, []);

  const checkPaymentMethodAvailability = () => {
    // Check Apple Pay availability
    if (window.ApplePaySession) {
      const merchantIdentifier = process.env.VITE_APPLE_PAY_MERCHANT_ID || "";
      const validationUrl = `/api/validate-apple-pay`;

      const canMakePayment = ApplePaySession.canMakePayments();
      setApplePayAvailable(canMakePayment);
    }

    // Check Google Pay availability
    if (window.google?.payments?.api) {
      const client = new google.payments.api.PaymentsClient({
        environment: "PRODUCTION",
      });

      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA"],
            },
          },
        ],
      };

      client
        .isReadyToPay(isReadyToPayRequest)
        .then((response: any) => {
          setGooglePayAvailable(response.result);
        })
        .catch((err: any) => {
          console.error("Error checking Google Pay:", err);
          setGooglePayAvailable(false);
        });
    }
  };

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "apple-pay",
      name: "Apple Pay",
      icon: <Apple className="w-5 h-5" />,
      description: "Fast and secure payment with your Apple ID",
      available: applePayAvailable,
      recommended: true,
      processingTime: "Instant",
    },
    {
      id: "google-pay",
      name: "Google Pay",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      description: "Secure payment with your Google account",
      available: googlePayAvailable,
      processingTime: "Instant",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: (
        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          P
        </div>
      ),
      description: "Pay securely with your PayPal account",
      available: true,
      processingTime: "1-2 minutes",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard className="w-5 h-5 text-gray-600" />,
      description: "Visa, Mastercard, or American Express",
      available: true,
      processingTime: "1-3 minutes",
    },
  ];

  const handleApplePayment = async () => {
    try {
      setPaymentState((prev) => ({ ...prev, processing: true, error: null }));

      const paymentRequest = {
        countryCode: "US",
        currencyCode: currency,
        supportedNetworks: ["visa", "mastercard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: {
          label: "Purchase",
          amount: (amount / 100).toString(), // Convert cents to dollars
          type: "final",
        },
        requiredBillingContactFields: [
          "postalAddress",
          "email",
          "phone",
          "name",
        ],
        requiredShippingContactFields: ["postalAddress", "email", "phone"],
      };

      if (ApplePaySession.canMakePayments()) {
        const session = new ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = async (event) => {
          // Validate merchant
          const merchantValidationUrl = event.validationURL;
          try {
            const response = await fetch("/api/validate-apple-pay", {
              method: "POST",
              body: JSON.stringify({ validationUrl: merchantValidationUrl }),
            });
            const data = await response.json();
            session.completeMerchantValidation(data);
          } catch (error) {
            console.error("Merchant validation failed:", error);
            session.abort();
          }
        };

        session.onpaymentauthorized = async (event) => {
          // Process payment
          try {
            const response = await fetch("/api/process-apple-pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: event.payment.token,
                orderId,
                amount,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              session.completePayment(ApplePaySession.STATUS_SUCCESS);

              setPaymentState((prev) => ({
                ...prev,
                processing: false,
                success: true,
              }));

              toast({
                title: "Payment Successful",
                description: `Payment of ${currency} ${(amount / 100).toFixed(2)} processed successfully`,
              });

              if (onPaymentSuccess) {
                onPaymentSuccess(data.paymentId, "apple-pay");
              }
            } else {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              throw new Error("Payment processing failed");
            }
          } catch (error) {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            const errorMsg =
              error instanceof Error ? error.message : "Payment failed";
            setPaymentState((prev) => ({
              ...prev,
              processing: false,
              error: errorMsg,
            }));
            if (onPaymentError) {
              onPaymentError(errorMsg);
            }
          }
        };

        session.begin();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Apple Pay failed";
      setPaymentState((prev) => ({
        ...prev,
        processing: false,
        error: errorMsg,
      }));
      if (onPaymentError) {
        onPaymentError(errorMsg);
      }
    }
  };

  const handleGooglePayment = async () => {
    try {
      setPaymentState((prev) => ({ ...prev, processing: true, error: null }));

      if (!window.google?.payments?.api) {
        throw new Error("Google Pay not available");
      }

      const client = new google.payments.api.PaymentsClient({
        environment: "PRODUCTION",
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA"],
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "stripe",
                gatewayMerchantId: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
              },
            },
          },
        ],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: (amount / 100).toString(),
          currencyCode: currency,
        },
        merchantInfo: {
          merchantName: "Eloity Marketplace",
          merchantId: process.env.VITE_GOOGLE_PAY_MERCHANT_ID,
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION"],
      };

      const response = await client.loadPaymentData(paymentDataRequest);

      // Send payment token to your server for processing
      const processResponse = await fetch("/api/process-google-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentData: response,
          orderId,
          amount,
        }),
      });

      if (processResponse.ok) {
        const data = await processResponse.json();

        setPaymentState((prev) => ({
          ...prev,
          processing: false,
          success: true,
        }));

        toast({
          title: "Payment Successful",
          description: `Payment of ${currency} ${(amount / 100).toFixed(2)} processed successfully`,
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(data.paymentId, "google-pay");
        }
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Google Pay failed";
      setPaymentState((prev) => ({
        ...prev,
        processing: false,
        error: errorMsg,
      }));
      if (onPaymentError) {
        onPaymentError(errorMsg);
      }
    }
  };

  const handlePayPalPayment = async () => {
    try {
      setPaymentState((prev) => ({ ...prev, processing: true, error: null }));

      if (!window.paypal) {
        throw new Error("PayPal not available. Please refresh the page.");
      }

      // PayPal buttons should be handled via PayPal SDK integration
      // This is a placeholder for the actual PayPal flow
      const response = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: amount / 100,
          currency,
        }),
      });

      const data = await response.json();

      // Redirect to PayPal approval URL
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("Failed to create PayPal order");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "PayPal payment failed";
      setPaymentState((prev) => ({
        ...prev,
        processing: false,
        error: errorMsg,
      }));
      if (onPaymentError) {
        onPaymentError(errorMsg);
      }
    }
  };

  const handleCardPayment = async () => {
    try {
      // Validate card details
      if (
        !cardDetails.cardNumber ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv
      ) {
        throw new Error("Please fill in all card details");
      }

      setPaymentState((prev) => ({ ...prev, processing: true, error: null }));

      const response = await fetch("/api/process-card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          cardDetails,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setPaymentState((prev) => ({
          ...prev,
          processing: false,
          success: true,
        }));

        toast({
          title: "Payment Successful",
          description: `Payment of ${currency} ${(amount / 100).toFixed(2)} processed successfully`,
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(data.paymentId, "card");
        }
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Card payment failed";
      setPaymentState((prev) => ({
        ...prev,
        processing: false,
        error: errorMsg,
      }));
      if (onPaymentError) {
        onPaymentError(errorMsg);
      }
    }
  };

  const handlePayment = () => {
    switch (paymentState.method) {
      case "apple-pay":
        handleApplePayment();
        break;
      case "google-pay":
        handleGooglePayment();
        break;
      case "paypal":
        handlePayPalPayment();
        break;
      case "card":
        handleCardPayment();
        break;
      default:
        toast({
          title: "Error",
          description: "Please select a payment method",
          variant: "destructive",
        });
    }
  };

  if (paymentState.success) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Payment Successful</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your payment has been processed successfully.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Order ID: {orderId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Select Payment Method
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <RadioGroup
          value={paymentState.method || ""}
          onValueChange={(value) =>
            setPaymentState((prev) => ({ ...prev, method: value }))
          }
        >
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                "relative flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                paymentState.method === method.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300",
                !method.available && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (method.available) {
                  setPaymentState((prev) => ({
                    ...prev,
                    method: method.id,
                  }));
                }
              }}
            >
              <RadioGroupItem
                value={method.id}
                id={method.id}
                disabled={!method.available}
              />
              <Label
                htmlFor={method.id}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-700">{method.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {method.name}
                      {method.recommended && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs"
                        >
                          Recommended
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      {method.description}
                    </p>
                    {method.processingTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Processing time: {method.processingTime}
                      </p>
                    )}
                  </div>
                </div>
              </Label>
              {!method.available && (
                <Badge variant="outline" className="text-xs">
                  Not Available
                </Badge>
              )}
            </div>
          ))}
        </RadioGroup>

        {/* Card Details Form */}
        {paymentState.method === "card" && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Input
              placeholder="Cardholder Name"
              value={cardDetails.cardholderName}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  cardholderName: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Card Number"
              value={cardDetails.cardNumber}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  cardNumber: e.target.value.replace(/\s/g, ""),
                }))
              }
              maxLength={19}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                maxLength={5}
              />
              <Input
                placeholder="CVV"
                value={cardDetails.cvv}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cvv: e.target.value,
                  }))
                }
                maxLength={4}
                type="password"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {paymentState.error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{paymentState.error}</div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">
              {currency} {(amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Currency:</span>
            <span>{currency}</span>
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={!paymentState.method || paymentState.processing}
          className="w-full"
          size="lg"
        >
          {paymentState.processing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay {currency} {(amount / 100).toFixed(2)}
            </>
          )}
        </Button>

        {/* Security Badge */}
        <div className="text-center text-xs text-gray-600">
          <Lock className="w-3 h-3 inline mr-1" />
          All payments are encrypted and secure
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPaymentMethods;
