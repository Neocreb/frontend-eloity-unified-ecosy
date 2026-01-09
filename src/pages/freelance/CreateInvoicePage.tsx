import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FreelanceInvoicing from "@/components/freelance/FreelanceInvoicing";
import { ArrowLeft, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleInvoiceCreated = () => {
    toast.success("Invoice created successfully!");
    setTimeout(() => {
      navigate("/app/freelance/earnings");
    }, 1500);
  };

  const handleError = (error: string) => {
    toast.error(error || "Failed to create invoice");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Create Invoice
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and send professional invoices to your clients
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8">
            <FreelanceInvoicing
              onSuccess={handleInvoiceCreated}
              onError={handleError}
            />
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  ✓ Be Specific
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Clearly describe the work done and deliverables provided
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  ✓ Payment Terms
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Specify due dates and accepted payment methods
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  ✓ Professional
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Use clear formatting and include all relevant details
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What to Include</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Your business information
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Client information
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Invoice number & date
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Itemized services/products
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Total amount and due date
                </span>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoicePage;
