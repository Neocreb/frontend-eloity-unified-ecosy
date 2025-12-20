import React, { useState } from "react";
import {
  DollarSign,
  CreditCard,
  Wallet,
  Bank,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { returnsManagementService, ReturnRequest } from "@/services/returnsManagementService";
import { useToast } from "@/components/ui/use-toast";

interface RefundProcessorProps {
  sellerId: string;
  returns: ReturnRequest[];
  onRefundProcessed?: () => void;
}

export const RefundProcessor: React.FC<RefundProcessorProps> = ({
  sellerId,
  returns,
  onRefundProcessed,
}) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"original_payment" | "wallet_credit" | "bank_transfer">(
    "original_payment"
  );

  const approvedReturns = returns.filter((r) => r.status === "approved");
  const totalRefundable = approvedReturns.reduce((sum, r) => sum + r.refundAmount, 0);

  const handleProcessRefund = async (returnId: string) => {
    setProcessing(returnId);
    try {
      const result = await returnsManagementService.processRefund(returnId, selectedMethod);

      if (result) {
        toast({
          title: "Success",
          description: `Refund of $${result.amount.toFixed(2)} processed via ${selectedMethod.replace(/_/g, " ")}`,
        });
        onRefundProcessed?.();
      } else {
        toast({
          title: "Error",
          description: "Failed to process refund",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleBatchRefund = async () => {
    if (approvedReturns.length === 0) {
      toast({
        title: "Error",
        description: "No approved returns to process",
        variant: "destructive",
      });
      return;
    }

    setProcessing("batch");
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const ret of approvedReturns) {
        const result = await returnsManagementService.processRefund(ret.id, selectedMethod);
        if (result) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      toast({
        title: "Batch Processing Complete",
        description: `Processed: ${successCount} successful, ${failureCount} failed`,
      });
      onRefundProcessed?.();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Approved Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvedReturns.length}</p>
            <p className="text-xs text-gray-600 mt-1">Ready to refund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Refund Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalRefundable.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">Pending refunds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Average Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${(approvedReturns.length > 0 ? totalRefundable / approvedReturns.length : 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Per return</p>
          </CardContent>
        </Card>
      </div>

      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Refund Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Select how to process refunds:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "original_payment" as const,
                icon: <CreditCard className="w-5 h-5" />,
                label: "Original Payment",
                desc: "Refund to original card/payment method",
              },
              {
                value: "wallet_credit" as const,
                icon: <Wallet className="w-5 h-5" />,
                label: "Wallet Credit",
                desc: "Add to customer wallet balance",
              },
              {
                value: "bank_transfer" as const,
                icon: <Bank className="w-5 h-5" />,
                label: "Bank Transfer",
                desc: "Direct bank transfer (requires customer info)",
              },
            ].map((method) => (
              <div
                key={method.value}
                onClick={() => setSelectedMethod(method.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedMethod === method.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className={selectedMethod === method.value ? "text-blue-600" : "text-gray-600"}>
                    {method.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{method.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approved Returns List */}
      {approvedReturns.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No approved returns waiting for refund processing. Approved returns will appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Batch Processing */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Batch Process Refunds
                </span>
                <Badge variant="secondary">{approvedReturns.length} returns</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Process all approved returns at once to save time
              </p>
              <Button
                onClick={handleBatchRefund}
                disabled={processing === "batch" || approvedReturns.length === 0}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                {processing === "batch" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Process All {approvedReturns.length} Refunds
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual Returns */}
          <Card>
            <CardHeader>
              <CardTitle>Approved Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedReturns.map((ret) => (
                  <div key={ret.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">Order {ret.orderId.substring(0, 8)}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Refund Amount: <span className="font-semibold">${ret.refundAmount.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Approved: {ret.approvedAt ? new Date(ret.approvedAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleProcessRefund(ret.id)}
                        disabled={processing === ret.id}
                        className="gap-2"
                      >
                        {processing === ret.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            Process
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <p>Original Price</p>
                        <p className="font-semibold">${ret.originalPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p>Shipping Cost</p>
                        <p className="font-semibold">${ret.shippingCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p>Customer</p>
                        <p className="font-semibold">{ret.customerId.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <p>Method</p>
                        <p className="font-semibold">{selectedMethod.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Info Section */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Refund Processing Tips:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Original payment refunds typically process within 3-5 business days</li>
            <li>Wallet credits are instantly available to customers</li>
            <li>Bank transfers require customer banking information</li>
            <li>Keep refund records for accounting and customer service</li>
            <li>Always communicate refund status to customers</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RefundProcessor;
