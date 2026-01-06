import React, { useState, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Check, Shield, Upload, FileText, Info, FileUp } from 'lucide-react';

const KYCStep: React.FC = () => {
  const { data, updateData, nextStep, skipKYC, isLoading } = useOnboarding();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const kycData = data.kycDocuments || {};
  const idType = kycData.idType || '';
  const idNumber = kycData.idNumber || '';
  const expiryDate = kycData.expiryDate || '';
  const documentImages = kycData.documentImages || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = [...documentImages];
    let uploadedCount = 0;

    files.forEach((file) => {
      // Validate file size (max 10MB each)
      if (file.size > 10 * 1024 * 1024) {
        setLocalError(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setLocalError(`File ${file.name} must be an image or PDF`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        newImages.push(result);
        uploadedCount++;

        setUploadProgress(Math.round((uploadedCount / files.length) * 100));

        if (uploadedCount === files.length) {
          updateData({
            kycDocuments: {
              ...kycData,
              documentImages: newImages,
            },
          });
          setLocalError(null);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        setLocalError(`Failed to read file ${file.name}`);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!idType) {
      setLocalError('Please select an ID type');
      return;
    }

    if (!idNumber.trim()) {
      setLocalError('Please enter your ID number');
      return;
    }

    if (!expiryDate) {
      setLocalError('Please select your ID expiry date');
      return;
    }

    if (documentImages.length === 0) {
      setLocalError('Please upload at least one document image');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate document verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      updateData({
        kycCompleted: true,
        kycVerified: true,
        kycDocuments: {
          ...kycData,
          idType,
          idNumber,
          expiryDate,
          documentImages,
        },
      });

      nextStep();
    } catch (error: any) {
      setLocalError(error.message || 'Failed to submit KYC documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    idType &&
    idNumber.trim() &&
    expiryDate &&
    documentImages.length > 0;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Identity Verification (Optional)</h2>
        <p className="text-slate-400">Verify your identity to unlock premium features and higher limits</p>
      </div>

      {/* Benefits Card */}
      <Card className="bg-gradient-to-r from-purple-900 to-blue-900 border-purple-700 p-4 mb-6">
        <div className="flex gap-3">
          <Shield className="text-purple-300 flex-shrink-0" size={20} />
          <div>
            <p className="text-white font-medium text-sm mb-2">Benefits of KYC Verification:</p>
            <ul className="text-purple-200 text-xs space-y-1">
              <li>✓ Higher transaction limits</li>
              <li>✓ Increased seller trust</li>
              <li>✓ Access to exclusive features</li>
              <li>✓ Better security and protection</li>
            </ul>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-y-auto">
        {/* Info Alert */}
        <Card className="bg-blue-950 border-blue-800 p-3">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <Info size={16} className="flex-shrink-0 mt-0.5" />
            <span>Your personal information is encrypted and never shared with third parties without your consent.</span>
          </p>
        </Card>

        {/* ID Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ID Type <span className="text-red-400">*</span>
          </label>
          <Select value={idType} onValueChange={(value) => {
            updateData({
              kycDocuments: { ...kycData, idType: value },
            });
            setLocalError(null);
          }}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="national_id">National ID</SelectItem>
              <SelectItem value="govt_issued">Government-Issued ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ID Number <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter your ID number"
            value={idNumber}
            onChange={(e) => {
              updateData({
                kycDocuments: { ...kycData, idNumber: e.target.value },
              });
              setLocalError(null);
            }}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ID Expiry Date <span className="text-red-400">*</span>
          </label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => {
              updateData({
                kycDocuments: { ...kycData, expiryDate: e.target.value },
              });
              setLocalError(null);
            }}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upload Documents <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-slate-400 mb-3">Upload clear photos or scans of your ID (front and back)</p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full border-2 border-dashed border-slate-600 hover:border-purple-500 text-slate-300 hover:bg-slate-700 hover:text-white py-6 flex flex-col items-center gap-2 mb-4"
          >
            <FileUp size={24} />
            <span className="font-medium">Click to Upload or Drag and Drop</span>
            <span className="text-xs">PNG, JPG, PDF up to 10MB</span>
          </Button>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}

          {/* Uploaded Documents */}
          {documentImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {documentImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Document ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg bg-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = documentImages.filter((_, i) => i !== index);
                      updateData({
                        kycDocuments: { ...kycData, documentImages: newImages },
                      });
                    }}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-xs text-slate-400 mt-1 text-center">Document {index + 1}</p>
                </div>
              ))}
            </div>
          )}

          {documentImages.length > 0 && (
            <p className="text-green-400 text-sm mt-3 flex items-center gap-1">
              <Check size={14} />
              {documentImages.length} document{documentImages.length !== 1 ? 's' : ''} uploaded
            </p>
          )}
        </div>

        {/* Error Message */}
        {localError && (
          <Card className="bg-red-950 border-red-800 p-3">
            <p className="text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {localError}
            </p>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card className="bg-slate-700 border-slate-600 p-3">
          <p className="text-slate-300 text-xs">
            <FileText size={14} className="inline mr-2" />
            By uploading documents, you confirm that you have read and agree to our{' '}
            <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/terms" className="text-purple-400 hover:text-purple-300 underline">
              Terms of Service
            </a>
          </p>
        </Card>

        {/* Buttons */}
        <div className="pt-4 flex-shrink-0 flex gap-3">
          <Button
            type="button"
            onClick={skipKYC}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Skip for Now
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting || isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Identity'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default KYCStep;
