import React, { useState, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, Camera, Upload, MapPin, Globe, Briefcase, Calendar } from 'lucide-react';

const ProfileStep: React.FC = () => {
  const { data, updateData, nextStep, isLoading } = useOnboarding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [preview, setPreview] = useState<string | null>(data.avatar || null);
  const [localError, setLocalError] = useState<string | null>(null);

  const bio = data.bio || '';
  const location = data.location || '';
  const website = data.website || '';
  const profession = data.profession || '';
  const dateOfBirth = data.dateOfBirth || '';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLocalError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      updateData({ avatar: result });
      setLocalError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!bio.trim()) {
      setLocalError('Please tell us about yourself');
      return;
    }

    if (bio.trim().length < 20) {
      setLocalError('Bio must be at least 20 characters');
      return;
    }

    if (!location.trim()) {
      setLocalError('Please enter your location');
      return;
    }

    if (!avatar) {
      setLocalError('Please upload a profile picture');
      return;
    }

    updateData({
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim() || undefined,
      profession: profession.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
    });

    nextStep();
  };

  const isFormValid = preview && bio.trim().length >= 20 && location.trim();
  const avatar = data.avatar;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-slate-400">Help others get to know you better</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-y-auto">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-4">
            Profile Picture
          </label>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar Preview */}
            <div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 cursor-pointer group overflow-hidden border-2 border-slate-600 hover:border-purple-500 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-white opacity-50 group-hover:opacity-100 transition-opacity" size={40} />
              )}
            </div>

            {/* Upload Info */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white mb-3"
              >
                <Upload size={16} className="mr-2" />
                Upload Image
              </Button>
              <p className="text-xs text-slate-400">
                JPG, PNG or WebP. Max 5MB.
              </p>
              {preview && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <Check size={14} /> Image uploaded successfully
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bio <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="Tell us about yourself, your interests, and what you're looking for..."
            value={bio}
            onChange={(e) => {
              updateData({ bio: e.target.value });
              setLocalError(null);
            }}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500 focus:outline-none resize-none"
          />
          <div className="flex justify-between mt-2">
            <p className={`text-xs ${bio.length >= 20 ? 'text-green-400' : 'text-slate-400'}`}>
              {bio.length >= 20 ? (
                <>
                  <Check size={12} className="inline mr-1" />
                  Looks good!
                </>
              ) : (
                `${20 - bio.length} more characters needed`
              )}
            </p>
            <p className="text-xs text-slate-400">{bio.length}/500</p>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Location <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="text"
              placeholder="City, Country"
              value={location}
              onChange={(e) => {
                updateData({ location: e.target.value });
                setLocalError(null);
              }}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Profession */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Profession <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="text"
              placeholder="e.g., Software Engineer, Designer, Entrepreneur"
              value={profession}
              onChange={(e) => {
                updateData({ profession: e.target.value });
                setLocalError(null);
              }}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Website <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="url"
              placeholder="https://yourwebsite.com"
              value={website}
              onChange={(e) => {
                updateData({ website: e.target.value });
                setLocalError(null);
              }}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Date of Birth <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                updateData({ dateOfBirth: e.target.value });
                setLocalError(null);
              }}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
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
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Continue to Interests'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileStep;
