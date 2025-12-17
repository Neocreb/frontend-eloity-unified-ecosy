import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  ArrowLeft,
  Download,
  Lock,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paymentLinkService, PaymentLink } from '@/services/paymentLinkService';
import { formatCurrency } from '@/utils/formatters';
import EloityLogo from '@/components/ui/logo';
import { invoiceTemplateService } from '@/services/invoiceTemplateService';

const PaymentLinkView: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [customization, setCustomization] = useState<any>(null);

  useEffect(() => {
    const loadPaymentLink = async () => {
      if (!code) {
        setError('Invalid payment link: No code provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const link = await paymentLinkService.getPaymentLinkByCode(code);

        if (!link) {
          setError(`Payment link with code "${code}" not found. Please check the link and try again.`);
          return;
        }

        // Load customization for the payment creator
        try {
          const customData = await invoiceTemplateService.getPaymentLinkCustomization(link.userId);
          if (customData) {
            setCustomization(customData);
          }
        } catch (customErr) {
          console.warn('Could not load payment link customization:', customErr);
        }

        // Check if valid
        const isValid = await paymentLinkService.isPaymentLinkValid(code);
        if (!isValid) {
          if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            setError('This payment link has expired. Please contact the sender for a new link.');
          } else if (link.maxUses && link.currentUses >= link.maxUses) {
            setError('This payment link has reached its maximum usage limit. Please contact the sender.');
          } else {
            setError('This payment link is no longer active. Please contact the sender for a new link.');
          }
          setPaymentLink(link);
          return;
        }

        setPaymentLink(link);
        setError(null);
      } catch (err) {
        console.error('Error loading payment link:', err);
        setError('Failed to load payment link. Please try again later or contact support.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentLink();
  }, [code]);

  const handlePay = async () => {
    if (!paymentLink || !code) return;

    try {
      setProcessing(true);

      // Record usage
      await paymentLinkService.recordPaymentLinkUsage(code);

      // Redirect to payment method selection
      // This would typically go to a checkout page
      navigate('/app/wallet/deposit', {
        state: {
          amount: paymentLink.amount,
          paymentLinkId: paymentLink.id,
          paymentLinkCode: code,
        },
      });
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintable = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment link...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br via-white"
      style={{
        backgroundImage: customization?.bannerImage
          ? `url(${customization.bannerImage}), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
      }}
    >
      {/* Header with platform and creator branding */}
      <div
        className="border-b shadow-md sticky top-0 z-40"
        style={{
          backgroundColor: customization?.primaryColor || '#ffffff',
          borderBottomColor: customization?.secondaryColor || '#e5e7eb',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {customization?.companyLogo ? (
                <img
                  src={customization.companyLogo}
                  alt="Company Logo"
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <EloityLogo className="h-8 w-8" />
              )}
              <div>
                <span className="font-bold text-lg text-white">
                  {customization?.companyName || 'Eloity'}
                </span>
                {customization?.companyName && (
                  <p className="text-xs text-gray-200">Powered by Eloity</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-medium">Secure Payment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8 relative">
        {error && (
          <Alert variant="destructive" className="mb-6 backdrop-blur-sm bg-red-50/95">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900 font-medium ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {paymentLink && (
          <div className="space-y-6">
            {/* Payment Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              {/* Card Header with accent */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {paymentLink.description || 'Payment Required'}
                </h1>
                <p className="text-blue-100 text-sm">
                  Secure payment via Eloity Platform
                </p>
              </div>

              <CardContent className="p-8">
                {/* Amount Section */}
                {paymentLink.amount && (
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">
                      Amount Due
                    </p>
                    <div className="text-4xl font-bold text-gray-900">
                      {formatCurrency(paymentLink.amount)}
                    </div>
                  </div>
                )}

                {/* Payment Link Details */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Payment Link ID
                      </p>
                      <p className="text-sm font-mono text-gray-900 mt-1">
                        {paymentLink.code}
                      </p>
                    </div>
                  </div>

                  {/* Usage Info */}
                  <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Usage
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {paymentLink.maxUses ? (
                          <>
                            {paymentLink.currentUses} of {paymentLink.maxUses} uses
                          </>
                        ) : (
                          'Unlimited uses'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Expiration Info */}
                  {paymentLink.expiresAt && (
                    <div className="flex items-start justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Expires
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(paymentLink.expiresAt).toLocaleDateString(
                            undefined,
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                {!error && paymentLink.isActive && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-6 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    This payment link is active and ready to use
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePay}
                    disabled={
                      processing ||
                      !!error ||
                      !paymentLink.isActive
                    }
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>

                  <Button
                    onClick={handlePrintable}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Print Payment Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Security Information</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>SSL encrypted connection</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>PCI-DSS compliant payment processing</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Your payment information is secure</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500">
              <p>Powered by Eloity Platform</p>
              <p className="mt-1">For questions or issues, contact the payment creator</p>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .bg-gradient-to-br,
          .bg-white,
          .shadow-lg {
            box-shadow: none;
            background: white;
          }
          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentLinkView;
