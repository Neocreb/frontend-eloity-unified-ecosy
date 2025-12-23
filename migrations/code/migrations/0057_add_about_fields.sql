-- Add columns for About tab profile enhancement (Phase 4)
-- Stores skills, professional info, and social links
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS professional_info JSONB,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Create indices for skills queries
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.skills IS 'Array of user skills with proficiency levels';
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object containing social media links and verification status';
COMMENT ON COLUMN public.profiles.professional_info IS 'JSON object with professional background, certifications, and specializations';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.github_url IS 'GitHub profile URL';
COMMENT ON COLUMN public.profiles.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN public.profiles.portfolio_url IS 'Portfolio or personal website URL';
