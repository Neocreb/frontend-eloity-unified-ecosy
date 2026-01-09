import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import FreelanceTaxDocuments from "@/components/freelance/FreelanceTaxDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { useFreelance } from "@/hooks/use-freelance";
import { toast } from "sonner";

interface TaxDocument {
  id: string;
  type: "1099" | "invoice-summary" | "expense-report" | "tax-form";
  year: number;
  status: "pending" | "ready" | "submitted";
  createdAt: Date;
  expiresAt?: Date;
}

const TaxDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFreelancerEarningsStats } = useFreelance();
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const statsData = await getFreelancerEarningsStats(user.id);
        setStats(statsData);

        // Mock documents - in real implementation, fetch from backend
        const mockDocs: TaxDocument[] = [
          {
            id: "1",
            type: "1099",
            year: 2024,
            status: "ready",
            createdAt: new Date(),
          },
          {
            id: "2",
            type: "invoice-summary",
            year: 2024,
            status: "pending",
            createdAt: new Date(),
          },
          {
            id: "3",
            type: "1099",
            year: 2023,
            status: "submitted",
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        ];
        setDocuments(mockDocs);
      } catch (error) {
        console.error("Failed to load tax documents:", error);
        toast.error("Failed to load tax documents");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, getFreelancerEarningsStats]);

  const getStatusColor = (status: TaxDocument["status"]) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: TaxDocument["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "submitted":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleDownload = (docId: string, docType: string) => {
    toast.success(`Downloading ${docType}...`);
    // In real implementation, fetch and download the file
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
              Tax Documents
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate and manage your tax documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="generate">Generate Document</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Annual Summary */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>2024 Tax Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${(stats.totalEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Completed Projects
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completedProjects || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Unique Clients
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.projectCount || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Documents</CardTitle>
                <Button
                  onClick={() => setActiveTab("generate")}
                  className="gap-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Generate New
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No documents yet. Generate your first tax document.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {doc.type.replace(/-/g, " ").toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Year {doc.year} · Created{" "}
                              {doc.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(doc.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(doc.status)}
                              {doc.status}
                            </span>
                          </Badge>
                          {doc.status === "ready" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownload(doc.id, doc.type)
                              }
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                  <AlertCircle className="w-5 h-5" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p>
                  • Keep copies of all invoices and receipts for at least 7
                  years
                </p>
                <p>
                  • Tax documents should be reviewed with a tax professional
                </p>
                <p>
                  • Different countries have different tax requirements and
                  deadlines
                </p>
                <p>
                  • You are responsible for paying quarterly estimated taxes if
                  required
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <FreelanceTaxDocuments />
              </CardContent>
            </Card>

            {/* Document Types Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Form 1099
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      For clients in the US who paid you $600+ in a year
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Invoice Summary
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Summary of all invoices issued during the year
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Expense Report
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track business expenses for deductions
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tax Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ✓ Track Everything
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Keep detailed records of all income and expenses
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ✓ Regular Updates
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Update your documents quarterly for accuracy
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ✓ Professional Help
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Consider consulting with a tax professional
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaxDocumentsPage;
