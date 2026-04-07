import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Shield,
  Globe,
  Heart,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';

const ConfirmationStep: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData, completeOnboarding, isLoading } = useOnboarding();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!termsAccepted) {
      setLocalError('You must accept the Terms of Service to continue');
      return;
    }

    if (!privacyAccepted) {
      setLocalError('You must accept the Privacy Policy to continue');
      return;
    }

    try {
      updateData({ consentGiven: true });
      await completeOnboarding();
      // Redirect happens automatically after completion
    } catch (error: any) {
      setLocalError(error.message || 'Failed to complete onboarding');
    }
  };

  const isFormValid = termsAccepted && privacyAccepted;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Review & Confirm</h2>
        <p className="text-slate-400">Let's review your information before you get started</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-y-auto">
        {/* Profile Summary Card */}
        <Card className="bg-slate-700 border-slate-600 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield size={18} />
            Account Information
          </h3>
          <div className="space-y-3">
            {data.avatar && (
              <div className="flex items-center gap-4">
                <img
                  src={data.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                />
                <div>
                  <p className="text-slate-400 text-sm">Profile Picture</p>
                  <p className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <Check size={14} /> Uploaded
                  </p>
                </div>
              </div>
            )}

            {data.name && (
              <div className="flex justify-between items-center py-2 border-t border-slate-600">
                <p className="text-slate-400">Full Name</p>
                <p className="text-white font-medium">{data.name}</p>
              </div>
            )}

            {data.email && (
              <div className="flex justify-between items-center py-2 border-t border-slate-600">
                <p className="text-slate-400">Email</p>
                <p className="text-white font-medium">{data.email}</p>
              </div>
            )}

            {data.bio && (
              <div className="flex justify-between items-center py-2 border-t border-slate-600">
                <p className="text-slate-400">Bio</p>
                <p className="text-white font-medium text-right text-sm line-clamp-2">
                  {data.bio}
                </p>
              </div>
            )}

            {data.location && (
              <div className="flex justify-between items-center py-2 border-t border-slate-600">
                <p className="text-slate-400">Location</p>
                <p className="text-white font-medium">{data.location}</p>
              </div>
            )}

            {data.profession && (
              <div className="flex justify-between items-center py-2 border-t border-slate-600">
                <p className="text-slate-400">Profession</p>
                <p className="text-white font-medium">{data.profession}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Interests Summary Card */}
        {data.selectedInterests && data.selectedInterests.length > 0 && (
          <Card className="bg-slate-700 border-slate-600 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Heart size={18} />
              Your Interests ({data.selectedInterests.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Display selected interests - simplified since we don't have category mapping here */}
              {data.selectedInterests.slice(0, 6).map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-medium capitalize"
                >
                  {interest.replace('_', ' ')}
                </span>
              ))}
              {data.selectedInterests.length > 6 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-600 text-slate-300 text-xs font-medium">
                  +{data.selectedInterests.length - 6} more
                </span>
              )}
            </div>
          </Card>
        )}

        {/* KYC Status Card */}
        {data.kycCompleted !== undefined && (
          <Card
            className={`p-6 ${
              data.kycCompleted
                ? 'bg-gradient-to-r from-green-900 to-emerald-900 border-green-700'
                : 'bg-gradient-to-r from-yellow-900 to-orange-900 border-yellow-700'
            }`}
          >
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              {data.kycCompleted ? (
                <>
                  <Check size={18} />
                  Identity Verified
                </>
              ) : (
                <>
                  <Zap size={18} />
                  KYC Skipped
                </>
              )}
            </h3>
            <p className={data.kycCompleted ? 'text-green-200 text-sm' : 'text-yellow-200 text-sm'}>
              {data.kycCompleted
                ? 'You have successfully verified your identity. You can now enjoy all premium features!'
                : "You can complete identity verification anytime from your account settings to unlock premium features."}
            </p>
          </Card>
        )}

        {/* What You Can Do Card */}
        <Card className="bg-gradient-to-r from-purple-900 to-blue-900 border-purple-700 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={18} />
            You're All Set!
          </h3>
          <ul className="space-y-2 text-purple-200 text-sm">
            <li className="flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5 text-green-400" />
              <span>Create and share content with your personalized feed</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5 text-green-400" />
              <span>Connect with people who share your interests</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5 text-green-400" />
              <span>Shop in our marketplace with verified sellers</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5 text-green-400" />
              <span>Earn rewards for your activities</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5 text-green-400" />
              <span>Access exclusive features and community events</span>
            </li>
          </ul>
        </Card>

        {/* Terms & Conditions */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 p-4 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setLocalError(null);
              }}
              className="w-5 h-5 mt-0.5 rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
            />
            <span className="text-white group-hover:text-purple-300 transition-colors">
              I accept the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                Terms of Service
              </a>
              {' '}and confirm that the information provided is accurate.
            </span>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked);
                setLocalError(null);
              }}
              className="w-5 h-5 mt-0.5 rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
            />
            <span className="text-white group-hover:text-purple-300 transition-colors">
              I have read and agree to the{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                Privacy Policy
              </a>
              {' '}and understand how my data will be used.
            </span>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              onChange={(e) => {
                updateData({ marketingOptIn: e.target.checked });
              }}
              defaultChecked={data.marketingOptIn}
              className="w-5 h-5 mt-0.5 rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
            />
            <span className="text-white group-hover:text-purple-300 transition-colors">
              Send me updates about new features, special offers, and important announcements (optional)
            </span>
          </label>
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

        {/* Submit Button */}
        <div className="pt-4 flex-shrink-0">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Completing Onboarding...
              </>
            ) : (
              <>
                Get Started <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmationStep;
