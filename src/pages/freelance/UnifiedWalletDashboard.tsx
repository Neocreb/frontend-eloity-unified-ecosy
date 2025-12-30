import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useFreelanceUnifiedWallet } from "@/hooks/useFreelanceUnifiedWallet";
import UnifiedWalletInvoices from "@/components/freelance/UnifiedWalletInvoices";
import UnifiedWalletWithdrawals from "@/components/freelance/UnifiedWalletWithdrawals";
import { Loader2 } from "lucide-react";

const UnifiedWalletDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { balance, currency, loading } = useFreelanceUnifiedWallet();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading && !balance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Unified Wallet</h1>
          <p className="text-muted-foreground">
            Manage your freelance invoices, payments, and withdrawals
          </p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6 shadow-lg">
        <p className="text-sm opacity-90">Available Balance</p>
        <p className="text-4xl font-bold">
          {currency} {balance.toLocaleString()}
        </p>
        <p className="text-sm opacity-75 mt-2">
          All your freelance earnings in one place
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <UnifiedWalletInvoices />
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <UnifiedWalletWithdrawals />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedWalletDashboard;
