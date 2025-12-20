import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { bulkProductService, ValidationError } from "@/services/bulkProductService";
import { useToast } from "@/components/ui/use-toast";

interface ImportStatus {
  stage: "upload" | "validating" | "importing" | "completed" | "failed";
  progress: number;
  message: string;
}

export const BulkProductImport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({
    stage: "upload",
    progress: 0,
    message: "",
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  if (!user?.id) {
    navigate("/auth");
    return null;
  }

  const handleDownloadTemplate = () => {
    try {
      const csv = bulkProductService.generateCSVTemplate();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products-template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV template downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setImportResult(null);
    setStatus({ stage: "upload", progress: 0, message: "File selected" });
  };

  const handleValidate = async () => {
    if (!file) return;

    setStatus({ stage: "validating", progress: 25, message: "Reading file..." });

    try {
      const content = await file.text();
      setStatus({ stage: "validating", progress: 50, message: "Parsing CSV..." });

      const rows = bulkProductService.parseCSV(content);
      setStatus({ stage: "validating", progress: 75, message: "Validating data..." });

      const validationErrors = bulkProductService.validateAll(rows);

      setStatus({
        stage: validationErrors.length === 0 ? "validating" : "validating",
        progress: 100,
        message:
          validationErrors.length === 0
            ? "Validation passed!"
            : `Validation found ${validationErrors.length} error(s)`,
      });

      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        toast({
          title: "Success",
          description: `File is valid. Ready to import ${rows.length} products.`,
        });
      } else {
        toast({
          title: "Validation Issues",
          description: `Found ${validationErrors.length} error(s). Please review.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus({
        stage: "failed",
        progress: 0,
        message: `Error: ${(error as Error).message}`,
      });
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setStatus({ stage: "importing", progress: 10, message: "Starting import..." });

    try {
      const content = await file.text();
      setStatus({ stage: "importing", progress: 30, message: "Parsing file..." });

      const rows = bulkProductService.parseCSV(content);
      const validationErrors = bulkProductService.validateAll(rows);

      if (validationErrors.length > 0) {
        setStatus({
          stage: "failed",
          progress: 0,
          message: "Validation failed. Please fix errors before importing.",
        });
        toast({
          title: "Error",
          description: "Cannot import file with validation errors",
          variant: "destructive",
        });
        return;
      }

      setStatus({ stage: "importing", progress: 50, message: "Importing products..." });

      const result = await bulkProductService.importProducts(user.id, rows);

      setStatus({
        stage: "completed",
        progress: 100,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
      });

      setImportResult(result);

      toast({
        title: "Import Completed",
        description: `${result.successful} products imported successfully`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
    } catch (error) {
      setStatus({
        stage: "failed",
        progress: 0,
        message: `Error: ${(error as Error).message}`,
      });
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setErrors([]);
    setImportResult(null);
    setStatus({ stage: "upload", progress: 0, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Product Import</h1>
          <p className="text-gray-600 mt-2">
            Import multiple products at once using a CSV file
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Download the CSV template to see the required format. All required fields must be
            filled in before import.
          </AlertDescription>
        </Alert>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download the CSV template to get started. It includes sample data and all available
              fields.
            </p>
            <Button
              onClick={handleDownloadTemplate}
              className="gap-2 w-full md:w-auto"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Required Fields</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• <strong>name</strong> - Product name (max 200 characters)</li>
                <li>• <strong>price</strong> - Price in USD (must be greater than 0)</li>
                <li>• <strong>category</strong> - Product category</li>
                <li>• <strong>stockQuantity</strong> - Stock quantity (non-negative integer)</li>
              </ul>
              <h4 className="font-medium text-sm mb-3 mt-4">Optional Fields</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• description - Product description</li>
                <li>• discountPrice - Discounted price (must be less than price)</li>
                <li>• subcategory - Sub-category</li>
                <li>• brand - Brand name</li>
                <li>• condition - new, like_new, used, or refurbished</li>
                <li>• sku - Stock keeping unit</li>
                <li>• weight - Product weight</li>
                <li>• dimensions - Product dimensions</li>
                <li>• images - Image URLs (comma-separated)</li>
                <li>• tags - Tags (comma-separated)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to select file
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-2">or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV file up to 10MB</p>
              </div>
            </div>

            {file && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{file.name}</p>
                    <p className="text-sm text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {file && status.stage !== "completed" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleValidate}
                  variant="outline"
                  className="gap-2"
                  disabled={status.stage === "validating" || status.stage === "importing"}
                >
                  <CheckCircle className="w-4 h-4" />
                  Validate
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    status.stage !== "validating" ||
                    status.progress !== 100 ||
                    errors.length > 0
                  }
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Products
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Section */}
        {file && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{status.message}</span>
                  <span className="text-gray-600">{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      status.stage === "failed"
                        ? "bg-red-600"
                        : status.stage === "completed"
                          ? "bg-green-600"
                          : "bg-blue-600"
                    }`}
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Errors Section */}
        {errors.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Validation Errors ({errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="font-medium text-red-900">
                      Row {error.rowIndex}, Field: {error.field}
                    </p>
                    <p className="text-red-700">{error.error}</p>
                    {error.value && (
                      <p className="text-red-600 text-xs mt-1">Value: {error.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {errors.length > 10 && (
                <p className="text-sm text-gray-600 mt-3">
                  And {errors.length - 10} more error(s)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import Result Section */}
        {importResult && (
          <Card className={importResult.failed === 0 ? "border-green-200" : "border-yellow-200"}>
            <CardHeader>
              <CardTitle className={importResult.failed === 0 ? "text-green-600" : "text-yellow-600"}>
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-3xl font-bold text-green-600">{importResult.successful}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {importResult.successful + importResult.failed}
                  </p>
                </div>
              </div>

              {importResult.createdProducts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Created Products</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {importResult.createdProducts.slice(0, 5).map((productId: string) => (
                      <div key={productId} className="text-sm p-2 bg-gray-50 rounded">
                        {productId}
                      </div>
                    ))}
                  </div>
                  {importResult.createdProducts.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">
                      And {importResult.createdProducts.length - 5} more products
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Import Another File
                </Button>
                <Button
                  onClick={() => navigate("/marketplace/seller/dashboard")}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BulkProductImport;
