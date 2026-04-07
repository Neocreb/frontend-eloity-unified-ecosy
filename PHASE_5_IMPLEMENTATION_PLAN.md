# Phase 5: Data Sync & Interactive Features Implementation Plan

**Status**: Planning Phase  
**Priority**: 🔴 CRITICAL - Data Sync (Must complete before Phase 5 features)  
**Timeline**: 2 weeks

---

## 🚨 CRITICAL: Data Sync Architecture Issue

### Current Problem

The About tab Phase 4 implementation uses **mock data** while the Settings page collects real data that **isn't being persisted properly**:

```
Settings Page (EnhancedSettings.tsx)
├── Collects: skills, languages, certifications, interests, social links
└── Calls: updateProfile({ skills, languages, certifications, ... })
            │
            ├─→ AuthContext.updateProfile
            │   ├─→ Updates: Supabase Auth metadata ✅
            │   └─→ Updates: profiles table (only appearance + basic fields) ❌
            │       (Does NOT persist: skills, languages, certifications, social_links, professional_info)
            │
            └─→ Data is lost after refresh! 🔴

Profile About Tab (Phase 4)
├── Uses: useProfileAboutData hook (mock data)
└── Shows: 12 sample skills (not user's real skills) ❌
```

### The Fix

**Single Source of Truth**: Settings page data → Supabase profiles table → Profile About tab

```
Settings Page (EnhancedSettings.tsx)
├── Collects: skills, languages, certifications, social_links, professional_info
└── Calls: updateProfile(...)
            │
            ├─→ AuthContext.updateProfile
            │   ├─→ Updates: Supabase Auth metadata ✅
            │   └─→ Updates: profiles table with ALL fields ✅ (FIXED)
            │       (NOW persists: skills, languages, certifications, social_links)
            │
            └─→ Data is saved to database ✅

Profile About Tab (Phase 4)
├── Uses: useProfileAboutData hook (calls profileService)
├── Fetches from: profiles table (real user data)
└── Shows: User's actual skills, languages, certifications ✅
```

---

## Phase 5 Tasks

### Task 1: Update Database Schema (CRITICAL - BLOCKER)
**Effort**: 3 hours | **Priority**: 🔴 CRITICAL

#### 1.1: Update profiles table schema
**File**: `shared/enhanced-schema.ts`

Add these JSONB/array columns to profiles table:
```sql
-- Skills (stored as structured data with proficiency)
skills: text[] | jsonb

-- Social links (stored as structured data with platform and url)
social_links: jsonb | [
  { platform: string, url: string, isVerified?: boolean }
]

-- Professional information
professional_info: jsonb | {
  title?: string,
  company?: string,
  yearsOfExperience?: number,
  specializations?: string[],
  languages?: string[],
  certifications?: [{ name, issuer, year }]
}

-- Extended profile fields
linkedin_url: text
github_url: text
twitter_url: text
portfolio_url: text
```

#### 1.2: Create migration for schema changes
**File**: `migrations/code/migrations/0057_add_about_fields.sql`

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT ARRAY[]::text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_info jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url text;
```

#### 1.3: Update Supabase types
**File**: `src/integrations/supabase/types.ts`

Add types for new columns to profiles table definition.

---

### Task 2: Fix AuthContext.updateProfile (CRITICAL - BLOCKER)
**Effort**: 2 hours | **Priority**: 🔴 CRITICAL

**File**: `src/contexts/AuthContext.tsx` (updateProfile function, ~lines 617-695)

**What to change**:
Currently only persists appearance settings + basic fields to profiles table:
- ❌ Does NOT persist: skills, languages, certifications, social_links, professional_info, social URLs

**Fix**: Add persistence for About tab fields
```typescript
const updateProfile = useCallback(
  async (data: Partial<UserProfile>): Promise<void> => {
    // ... existing auth metadata update ...

    const profileData: Record<string, any> = {};
    
    // EXISTING: Map appearance and basic fields
    // ... existing mapping code ...

    // ADD: Map About tab fields
    if (data.skills) profileData.skills = data.skills;
    if (data.languages) profileData.languages = data.languages;
    if (data.certifications) profileData.certifications = data.certifications;
    if (data.linkedin_url) profileData.linkedin_url = data.linkedin_url;
    if (data.github_url) profileData.github_url = data.github_url;
    if (data.twitter_url) profileData.twitter_url = data.twitter_url;
    if (data.portfolio_url) profileData.portfolio_url = data.portfolio_url;
    
    // For complex professional info object
    if (data.professional_info) profileData.professional_info = data.professional_info;
    if (data.social_links) profileData.social_links = data.social_links;
    
    // ... existing database update code ...
  },
  [user],
);
```

---

### Task 3: Update profileService.formatUserProfile (BLOCKER)
**Effort**: 1.5 hours | **Priority**: 🔴 CRITICAL

**File**: `src/services/profileService.ts` (~lines 470-520)

**What to change**:
Update `formatUserProfile` to properly map About fields from database:

```typescript
formatUserProfile(data: any): UserProfile {
  return {
    // ... existing fields ...
    
    // ADD: About tab fields mapping
    skills: data.skills || [],
    languages: data.languages || ["English"],
    certifications: data.certifications || [],
    professional_info: data.professional_info || {},
    social_links: data.social_links || [],
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    twitter_url: data.twitter_url,
    portfolio_url: data.portfolio_url,
    
    // ... rest of mapping ...
  };
}
```

---

### Task 4: Replace useProfileAboutData Mock Data (CRITICAL)
**Effort**: 2 hours | **Priority**: 🔴 CRITICAL

**File**: `src/hooks/useProfileAboutData.ts`

**Current**: Returns hardcoded mock data  
**Required**: Fetch real data from profileService

**Changes**:
```typescript
import { profileService } from "@/services/profileService";

export const useProfileAboutData = (userId?: string): ProfileAboutData => {
  const [data, setData] = useState<ProfileAboutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      // Return empty/default data if no userId
      setData(getDefaultData());
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const profile = await profileService.getUserById(userId);
        if (profile) {
          setData({
            skills: profile.skills || [],
            professional: profile.professional_info || {},
            socialLinks: profile.social_links || [],
            achievements: profile.achievements || [],
            totalAchievements: 15,
          });
        } else {
          setData(getDefaultData());
        }
      } catch (err) {
        console.error("Error fetching about data:", err);
        setError(err as Error);
        setData(getDefaultData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return {
    data: data || getDefaultData(),
    isLoading,
    error,
  };
};

const getDefaultData = (): ProfileAboutData => ({
  skills: [],
  professional: {},
  socialLinks: [],
  achievements: [],
  totalAchievements: 0,
});
```

---

### Task 5: Sync Phase 4 Components with Real Data (CRITICAL)
**Effort**: 2 hours | **Priority**: 🔴 CRITICAL

#### 5.1: Update AboutTabContent (src/pages/UnifiedProfile.tsx)
- Replace mock data hook calls with real data
- Add loading states for real data fetching
- Add error handling for failed data loads

#### 5.2: Update SkillsSection, ProfessionalInfo, SocialLinks, EnhancedAchievements
- All components already accept real data as props ✅
- No changes needed - they work with real data automatically

---

### Task 6: Ensure Settings ↔ Profile Tab Sync
**Effort**: 1.5 hours | **Priority**: 🟡 MEDIUM

#### 6.1: Add real-time sync mechanism
When user updates profile in Settings:
1. updateProfile called → saves to database
2. AuthContext state updated locally
3. Profile About tab refetches data on userId change
4. Display updates automatically

#### 6.2: Update EnhancedSettings.tsx
- Verify saveProfileChanges includes all About fields
- Confirm skills, languages, certifications, social links are in the save payload (✅ already done at line 461-464)
- Test that data persists after save

#### 6.3: Add notification/sync indicator
- Show loading state while data syncs
- Confirm success/error toast messages (✅ already done)

---

## Phase 5 Main Features (After Data Sync Complete)

### Feature 1: Post Detail Modal
**Effort**: 4 hours | **Priority**: 🟡 MEDIUM

**File**: `src/components/profile/PostDetailModal.tsx` (NEW)

**Features**:
- Full post content display
- All comments (with pagination)
- Like/comment/share interactions
- Post analytics (if owner)
- Similar posts suggestions
- Report button
- Click to open modal from profile posts

---

### Feature 2: Post Engagement Improvements
**Effort**: 2 hours | **Priority**: 🟡 MEDIUM

**Enhancements**:
- Make posts clickable (opens detail modal)
- Click author name → navigate to profile
- Click images → open lightbox
- Inline editing for own posts
- Hover effects showing available actions
- Keyboard navigation (arrow keys, enter)

---

### Feature 3: Profile Interaction Tracker
**Effort**: 3 hours | **Priority**: 🟡 MEDIUM

**File**: `src/hooks/useProfileInteractions.ts` (NEW)

**Tracks**:
- User visited profile (date/time)
- Time spent on profile
- Sections viewed (Posts, About, Media, etc.)
- Posts viewed
- Actions taken (Follow, Message, etc.)

**Display** (for owner):
- Interaction analytics on profile
- Recent visitors
- Most viewed sections
- Engagement metrics

---

### Feature 4: Keyboard Navigation Support
**Effort**: 2 hours | **Priority**: 🟡 MEDIUM

**Add keyboard support**:
- Tab: Navigate through interactive elements
- Arrow keys: Navigate between posts
- Enter: Open post detail modal
- Escape: Close modals
- 'f': Follow/unfollow
- 's': Share post
- 'l': Like post

---

## Implementation Sequence

### Week 1: Data Sync (BLOCKING - Must complete first)
1. ✅ **Day 1**: Update profiles table schema + create migration
2. ✅ **Day 2**: Fix AuthContext.updateProfile persistence
3. ✅ **Day 3**: Update profileService.formatUserProfile mapping
4. ✅ **Day 4**: Replace useProfileAboutData with real data fetching
5. ✅ **Day 5**: Verify sync between Settings and Profile About tab

### Week 2: Phase 5 Features
6. **Day 6**: Post detail modal implementation
7. **Day 7**: Post engagement improvements
8. **Day 8**: Profile interaction tracker
9. **Day 9**: Keyboard navigation
10. **Day 10**: Testing & bug fixes

---

## Critical Dependencies

### Blocking Issues

❌ **Before Task 6** (Phase 5 Features):
- ❌ Cannot implement post detail modal without proper data persistence
- ❌ Cannot sync profile/settings without database schema updates
- ❌ Cannot show real user data in About tab without profileService updates

✅ **After Tasks 1-5** (Data Sync Complete):
- ✅ All Phase 5 features can be built with confidence
- ✅ Real data will flow through the app automatically
- ✅ Settings ↔ Profile sync will work seamlessly

---

## Testing Strategy

### Data Sync Tests
1. User updates skills in Settings → Data persists after refresh
2. User adds social link in Settings → Appears in Profile About tab
3. User updates professional info → Shows correctly on profile
4. Real data displays instead of mock data

### Phase 5 Feature Tests
1. Click post → Opens detail modal
2. Click author avatar → Navigate to profile
3. Time tracking → Accurate interaction metrics
4. Keyboard navigation → All shortcuts work

---

## Success Criteria

### Data Sync Success
- ✅ Settings changes persist to database
- ✅ Profile About tab shows real user data (not mocks)
- ✅ No data loss on page refresh
- ✅ Skills/social/professional info sync between Settings and Profile
- ✅ All TypeScript types updated

### Phase 5 Feature Success
- ✅ Post detail modal displays and closes correctly
- ✅ Post engagement interactions work
- ✅ Profile interaction tracking accurate
- ✅ Keyboard navigation functional
- ✅ All features tested and documented

---

## Files to Modify/Create

### Data Sync (CRITICAL)
- [ ] `shared/enhanced-schema.ts` - Add About fields to profiles table
- [ ] `migrations/code/migrations/0057_add_about_fields.sql` - Schema migration
- [ ] `src/integrations/supabase/types.ts` - Update Supabase types
- [ ] `src/contexts/AuthContext.tsx` - Fix updateProfile persistence
- [ ] `src/services/profileService.ts` - Update formatUserProfile mapping
- [ ] `src/hooks/useProfileAboutData.ts` - Replace mock with real data

### Phase 5 Features
- [ ] `src/components/profile/PostDetailModal.tsx` - New component
- [ ] `src/hooks/useProfileInteractions.ts` - New tracking hook
- [ ] `src/components/profile/PostEngagementEnhancements.tsx` - New improvements
- [ ] `src/hooks/useKeyboardNavigation.ts` - New keyboard hook
- [ ] `src/pages/UnifiedProfile.tsx` - Integrate new features

---

## Documentation Updates Required

- [ ] PROFILE_PAGE_ENHANCEMENT_PLAN.md - Update Phase 5 section
- [ ] PHASE_5_IMPLEMENTATION_PLAN.md - This file
- [ ] Code comments for data sync flow
- [ ] Database schema documentation
- [ ] API integration guide

---

## Risk Assessment

### High Risk
🔴 **Data Persistence**: If AuthContext.updateProfile not fixed properly, user data will be lost
- Mitigation: Add comprehensive tests before release
- Fallback: Roll back to previous version if issues found

### Medium Risk
🟡 **Database Migration**: Schema changes could affect existing data
- Mitigation: Add IF NOT EXISTS clauses to migration
- Mitigation: Test migration on development database first

### Low Risk
🟢 **Component Integration**: Phase 5 features build on solid Phase 4 foundation
- Mitigation: Follow existing component patterns
- Mitigation: Reuse tested utilities

---

## Approval Checklist

Before proceeding with Phase 5:
- [ ] All data sync tasks completed
- [ ] Database migration tested and working
- [ ] Settings ↔ Profile About sync verified
- [ ] Real data displaying in About tab (not mocks)
- [ ] No data loss on page refresh
- [ ] All TypeScript types updated
- [ ] Code reviewed and tested

---

## Next Steps

1. **Immediate**: Approve Phase 5 data sync tasks
2. **Week 1**: Complete critical data sync implementation
3. **Week 2**: Implement Phase 5 features
4. **Week 3**: Testing, bug fixes, documentation
5. **Week 4**: Code review, approval, deployment

---

**Status**: 📋 Ready for Implementation  
**Blocker**: Data sync MUST complete before Phase 5 features  
**Timeline**: 2 weeks total (1 week data sync + 1 week features)
