import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const SignUpStep: React.FC = () => {
  const { data, updateData, nextStep, isLoading } = useOnboarding();
  
  const [email, setEmail] = useState(data.email || '');
  const [password, setPassword] = useState(data.password || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(data.name || '');
  const [referralCode, setReferralCode] = useState(data.referralCode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    // RFC 5322 simplified email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid && email) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
    
    return isValid || !email;
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('One special character (!@#$%^&*...)');
    }

    if (errors.length > 0) {
      setPasswordError(`Password must contain: ${errors.join(', ')}`);
    } else {
      setPasswordError(null);
    }

    return { isValid: errors.length === 0, errors };
  };

  const getPasswordStrength = (): { strength: number; label: string; color: string } => {
    let strength = 0;
    const password = password || '';

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 2) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 3) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    if (strength <= 4) return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    return { strength: 5, label: 'Very Strong', color: 'bg-green-600' };
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePassword(value);
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }

    if (name.trim().length < 2) {
      setLocalError('Name must be at least 2 characters');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setLocalError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Update context with validated data
    updateData({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      referralCode: referralCode.trim() || undefined,
    });

    // Proceed to next step
    nextStep();
  };

  const isFormValid = 
    email.trim() &&
    validateEmail(email) &&
    name.trim() &&
    name.trim().length >= 2 &&
    password &&
    validatePassword(password).isValid &&
    password === confirmPassword;

  const passwordStrength = getPasswordStrength();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {localError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-300 text-sm">{localError}</p>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
            disabled={isLoading}
          />
        </div>
        {name && name.length < 2 && (
          <p className="text-red-400 text-xs mt-1">Name must be at least 2 characters</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
            disabled={isLoading}
          />
        </div>
        {emailError && (
          <p className="text-red-400 text-xs mt-1">{emailError}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter a strong password"
            className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${passwordStrength.color} transition-all`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${
                passwordStrength.strength <= 1 ? 'text-red-400' :
                passwordStrength.strength <= 2 ? 'text-yellow-400' :
                passwordStrength.strength <= 3 ? 'text-blue-400' :
                'text-green-400'
              }`}>
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}

        {passwordError && (
          <p className="text-red-400 text-xs mt-2">{passwordError}</p>
        )}

        {/* Password Requirements */}
        {password && (
          <div className="mt-3 space-y-1 text-xs">
            <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-slate-400'}`}>
              <Check size={14} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
              <Check size={14} />
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
              <Check size={14} />
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
              <Check size={14} />
              <span>One number</span>
            </div>
            <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
              <Check size={14} />
              <span>One special character (!@#$%^&*...)</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Confirm Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
        )}
        {confirmPassword && password === confirmPassword && (
          <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
            <Check size={14} />
            Passwords match
          </p>
        )}
      </div>

      {/* Referral Code (Optional) */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Referral Code <span className="text-slate-400 text-xs">(Optional)</span>
        </label>
        <Input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Enter referral code if you have one"
          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
          disabled={isLoading}
        />
      </div>

      {/* Terms Agreement */}
      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
        <p className="text-slate-300 text-sm">
          By creating an account, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Submit Button - For standalone testing */}
      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-base"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
            Processing...
          </>
        ) : (
          'Continue to Profile'
        )}
      </Button>
    </form>
  );
};

export default SignUpStep;
