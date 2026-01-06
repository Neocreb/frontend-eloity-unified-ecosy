# Phase 1 Quick Reference Guide

## 📚 Component Quick Reference

### BadgeSystem Component

**Location**: `src/components/profile/BadgeSystem.tsx`

**Basic Usage**:
```tsx
import BadgeSystem from '@/components/profile/BadgeSystem';

<BadgeSystem 
  userId={user.id}
  isOwnProfile={true}
  variant="compact"
  maxDisplay={6}
/>
```

**Props**:
- `userId`: string (required) - User ID for badge data
- `badges?`: BadgeData[] - Optional array of badges (uses mock if not provided)
- `isOwnProfile?`: boolean - Shows share options if true
- `maxDisplay?`: number - Max visible badges before "View all" (default: 8)
- `variant?`: 'compact' | 'detailed' - Display style (default: 'compact')
- `className?`: string - Additional CSS classes

**Supported Badge Types**:
- `account`: Verified, KYC Verified
- `creator`: Creator, Pro Seller, Top Freelancer
- `trust`: Trustworthy, Verified Seller
- `trading`: Crypto Trader, Active Trader
- `engagement`: Top Contributor, Community Hero
- `special`: Pioneer, Beta Tester, Ambassador

**Returns**: Interactive badge display with modal on click

---

### ActivityTimeline Component

**Location**: `src/components/profile/ActivityTimeline.tsx`

**Basic Usage**:
```tsx
import ActivityTimeline from '@/components/profile/ActivityTimeline';

<ActivityTimeline 
  userId={user.id}
  showFilters={true}
  maxItems={20}
/>
```

**Props**:
- `userId`: string (required) - User ID for activity data
- `className?`: string - Additional CSS classes
- `showFilters?`: boolean - Show filter section (default: true)
- `maxItems?`: number - Max items to fetch (default: 20)

**Supported Activity Types** (18 total):
```
post_created, post_deleted,
content_liked, content_unliked,
comment_added, comment_deleted,
content_shared, content_purchased,
product_listed, product_sold,
job_posted, job_completed,
trade_executed, followers_gained,
profile_updated, badge_earned,
level_up, milestone_reached
```

**Returns**: Interactive activity timeline with filters and pagination

---

### ActivityFilters Component

**Location**: `src/components/profile/ActivityFilters.tsx`

**Basic Usage**:
```tsx
import ActivityFilters from '@/components/profile/ActivityFilters';

const [filters, setFilters] = useState<ActivityType[]>([]);

<ActivityFilters 
  selectedFilters={filters}
  onFilterChange={setFilters}
/>
```

**Props**:
- `selectedFilters`: ActivityType[] - Currently active filters
- `onFilterChange`: (filters: ActivityType[]) => void - Filter handler
- `className?`: string - Additional CSS classes

**Filter Categories**:
- Content (posts, shares)
- Engagement (likes, comments)
- Commerce (purchases, products, jobs)
- Trading (trades)
- Social (followers)
- Account (profile updates, badges, levels)

**Quick Presets**:
- All Activities
- My Content
- Interactions
- Achievements

---

### useActivityTimeline Hook

**Location**: `src/hooks/useActivityTimeline.ts`

**Basic Usage**:
```tsx
import { useActivityTimeline, ActivityType } from '@/hooks/useActivityTimeline';

const { activities, isLoading, hasMore, error, activityConfig } = useActivityTimeline({
  userId: 'user-123',
  filters: ['post_created', 'comment_added'],
  limit: 10,
  offset: 0,
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

activities.map(activity => (
  <div key={activity.id}>
    <p>{activity.description}</p>
    <p>{activity.timestamp}</p>
  </div>
))
```

**Options**:
- `userId`: string (required)
- `filters?`: ActivityType[] - Filter to specific activity types
- `limit?`: number - Items per page (default: 10)
- `offset?`: number - Pagination offset (default: 0)

**Return Value**:
```typescript
{
  activities: ActivityItem[],
  isLoading: boolean,
  hasMore: boolean,
  error: string | null,
  activityConfig: Record<ActivityType, { icon: string; color: string; label: string }>
}
```

---

## 🎨 Current Implementation in UnifiedProfile

### Badge System Integration
```tsx
// Line ~519 in src/pages/UnifiedProfile.tsx
<BadgeSystem
  userId={profileUser?.id || ''}
  isOwnProfile={isOwnProfile}
  variant="compact"
  maxDisplay={6}
/>
```

**What it does**:
- Displays up to 6 badges in the profile header
- Shows "View all (X)" if more badges exist
- Opens detail modal on badge click
- Uses mock data (6 sample badges)

### Activity Timeline Integration
```tsx
// Line ~968 in src/pages/UnifiedProfile.tsx
{profileUser && (
  <ActivityTimeline
    userId={profileUser.id}
    showFilters={true}
    maxItems={20}
  />
)}
```

**What it does**:
- Displays activity timeline in the Activity tab
- Shows collapsible filter panel
- Groups activities by date
- Includes load more pagination
- Uses mock data (8 sample activities)

---

## 📊 Data Structures

### BadgeData Interface
```typescript
interface BadgeData {
  id: string;
  type: 'account' | 'creator' | 'trust' | 'trading' | 'engagement' | 'special';
  name: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  earnedDate: string;
  isActive: boolean;
  requirements?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}
```

### ActivityItem Interface
```typescript
interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  description: string;
  icon: string;
  color: string;
  relatedEntity?: {
    id: string;
    type: string;
    title: string;
    url: string;
  };
  metadata?: Record<string, any>;
}
```

---

## 🔄 How to Integrate Real Data

### Integrating Real Badges

**Current**: Uses mock data from BadgeSystem.tsx
**To integrate real data**:

1. Create API endpoint to fetch user badges
2. Pass badges array to BadgeSystem:
```tsx
const { data: badges } = useQuery(['badges', userId], () => 
  fetchBadges(userId)
);

<BadgeSystem 
  userId={userId}
  badges={badges}
  isOwnProfile={isOwnProfile}
/>
```

3. Mock data will be used as fallback if no badges provided

### Integrating Real Activities

**Current**: Uses mock data from useActivityTimeline hook
**To integrate real data**:

1. Update useActivityTimeline hook to call real API
2. Replace this section in useActivityTimeline.ts:
```tsx
// Current (lines 155-160):
await new Promise(resolve => setTimeout(resolve, 500));
let filtered = mockActivities;

// Replace with real API call:
const response = await fetch(`/api/activities/${userId}?limit=${limit}&offset=${offset}`);
const data = await response.json();
let filtered = data.activities;
```

3. Everything else continues to work with real data

---

## 🧪 Testing the Components

### Visual Testing
1. Navigate to any user profile
2. See badges displayed in header
3. Click a badge to open modal
4. Click Activity tab to see timeline
5. Use filters to test filtering

### Component Testing
```tsx
// Test BadgeSystem
render(
  <BadgeSystem userId="test-123" isOwnProfile={true} />
);
expect(screen.getByText('Premium')).toBeInTheDocument();

// Test ActivityTimeline
render(
  <ActivityTimeline userId="test-123" />
);
expect(screen.getByText(/Activity Timeline/)).toBeInTheDocument();
```

### Data Flow Testing
1. Filter activities and verify timeline updates
2. Click "Load More" and verify pagination works
3. Click badges and verify modal opens
4. Test responsive design on mobile

---

## 🐛 Common Integration Points

### When Connecting to Database

1. **Create migrations**:
   - user_badges table (user_id, badge_id, earned_date)
   - user_activities table or audit logs

2. **Update useActivityTimeline hook**:
   - Replace mock data fetch
   - Add real API endpoint call
   - Keep filter logic

3. **Update BadgeSystem**:
   - Pass real badge data
   - Update badge query

4. **Update profile types**:
   - Ensure UserProfile interface includes badges
   - Update queries to fetch badge data

---

## 📱 Responsive Design Notes

### Breakpoints Used
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Components Responsive Features
- **BadgeSystem**: Wraps badges on mobile, uses scrollable carousel
- **ActivityTimeline**: Full width on mobile, maintains readability
- **ActivityFilters**: Collapsible on mobile to save space
- **BadgeDetailModal**: Full screen on mobile, modal on desktop

---

## 🎯 File Tree Summary

```
src/
├── components/profile/
│   ├── BadgeSystem.tsx (new)
│   ├── BadgeDetailModal.tsx (new)
│   ├── ActivityTimeline.tsx (new)
│   ├── ActivityFilters.tsx (new)
│   └── ... (existing components)
├── hooks/
│   ├── useActivityTimeline.ts (new)
│   └── ... (existing hooks)
└── pages/
    └── UnifiedProfile.tsx (modified)
```

---

## 📋 Checklist for Next Phase

Before starting Phase 2, verify:
- ✅ Phase 1 components render correctly
- ✅ Mock data displays properly
- ✅ Badges modal opens/closes
- ✅ Activity filters work
- ✅ Pagination loads more items
- ✅ Responsive design works on mobile
- ✅ No console errors

---

## 🚀 Phase 2 Readiness

Phase 2 components are ready to begin:
1. **Post Pinning System** - Will integrate with posts table
2. **About Tab Enhancement** - Will add skills and social links
3. **Post Analytics** - Will fetch from analytics table

All Phase 1 components are independent and ready for Phase 2 to proceed in parallel.

---

## 📞 Quick Troubleshooting

**"Badges not showing"**
→ Check that userId is being passed correctly to BadgeSystem

**"Activity filters not working"**
→ Verify ActivityFilters state is connected to ActivityTimeline

**"Modal won't open"**
→ Check BadgeDetailModal isOpen prop is true

**"Load more not working"**
→ Verify hasMore is being checked and visibleCount state is updating

---

## 💡 Tips for Maintenance

1. **Icon updates**: Change icons in badgeIconMap in BadgeSystem.tsx
2. **Color changes**: Update badgeColorMap with new Tailwind classes
3. **New activities**: Add to ActivityType union in useActivityTimeline.ts
4. **Filter updates**: Modify filterOptions array in ActivityFilters.tsx
5. **Data source**: Update API endpoint in useActivityTimeline hook when ready

