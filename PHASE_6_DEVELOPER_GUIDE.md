# Phase 6 Developer Guide

## Quick Start

### Using the Real-time Sync Hook

```typescript
import { useGiftTransactionSync } from '@/hooks/useGiftTransactionSync';

function MyComponent() {
  const {
    giftsSent,
    giftsReceived,
    tipsSent,
    tipsReceived,
    isLoading,
    error,
    refresh,
    totalGiftsSent,
    totalTipsReceived,
  } = useGiftTransactionSync({
    onNewTransaction: (update) => {
      console.log('New transaction:', update);
    },
    autoRefresh: true,
    refreshInterval: 5000,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Gifts Sent: {totalGiftsSent}</p>
      <p>Tips Received: {totalTipsReceived}</p>
      <button onClick={() => refresh()}>Refresh</button>
    </div>
  );
}
```

### Using the Notification Service

```typescript
import { giftTipNotificationService } from '@/services/giftTipNotificationService';

// Notify when gift is sent
giftTipNotificationService.notifyGiftSent({
  senderName: 'John',
  recipientName: 'Jane',
  amount: 25.00,
  currency: 'USD',
  giftEmoji: '💎',
  giftName: 'Diamond',
  message: 'You rock!',
  isAnonymous: false,
  timestamp: new Date().toISOString(),
});

// Notify when tip is received
giftTipNotificationService.notifyTipReceived({
  senderName: 'Alice',
  recipientName: 'Bob',
  amount: 10.00,
  currency: 'USD',
  message: 'Great stream!',
  isAnonymous: false,
  timestamp: new Date().toISOString(),
});

// Listen to notifications
giftTipNotificationService.onNotification((notification) => {
  console.log('New notification:', notification);
});

// Enable/disable audio
giftTipNotificationService.setAudioEnabled(false);
```

## Component Integration Patterns

### Pattern 1: Analytics Dashboard with Real-time Updates

```typescript
import { useGiftTransactionSync } from '@/hooks/useGiftTransactionSync';
import { Card } from '@/components/ui/card';

export function GiftAnalytics() {
  const { giftsSent, tipsReceived, isLoading, refresh } = useGiftTransactionSync({
    onNewTransaction: (update) => {
      // Toast notification or analytics update
      console.log('Activity:', update.type);
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <h3>Total Gifts Sent: {giftsSent.length}</h3>
        <h3>Total Tips Received: {tipsReceived.length}</h3>
        <button onClick={refresh}>Refresh Data</button>
      </Card>
    </div>
  );
}
```

### Pattern 2: Gift Sending with Notifications

```typescript
import { virtualGiftsService } from '@/services/virtualGiftsService';
import { giftTipNotificationService } from '@/services/giftTipNotificationService';
import { useAuth } from '@/contexts/AuthContext';

export function SendGiftButton({ recipientId, recipientName }) {
  const { user } = useAuth();

  const handleSendGift = async (giftId: string) => {
    try {
      const transaction = await virtualGiftsService.sendGift(
        user.id,
        recipientId,
        giftId,
        1,
        'Your work is amazing!',
        false
      );

      if (transaction) {
        // Trigger notification
        giftTipNotificationService.notifyGiftSent({
          senderName: user.user_metadata?.username || 'User',
          recipientName,
          amount: 25.00,
          currency: 'USD',
          giftEmoji: '💎',
          giftName: 'Diamond',
          isAnonymous: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  return (
    <button onClick={() => handleSendGift('diamond')}>
      Send Gift
    </button>
  );
}
```

### Pattern 3: Global Event Listening

```typescript
useEffect(() => {
  // Listen to celebration events
  const handleCelebration = (event: Event) => {
    const customEvent = event as CustomEvent;
    const notification = customEvent.detail;
    
    // Custom handling logic
    console.log('Celebration:', notification);
  };

  window.addEventListener('giftTipCelebration', handleCelebration);

  return () => {
    window.removeEventListener('giftTipCelebration', handleCelebration);
  };
}, []);
```

## Advanced Usage

### Custom Transaction Processing

```typescript
const { giftsReceived } = useGiftTransactionSync({
  onNewTransaction: (update) => {
    if (update.type === 'gift_received') {
      // Custom logic for received gifts
      processReceivedGift(update.transaction);
    }
  },
  autoRefresh: false, // Manual refresh only
});

// Process received gifts with custom logic
function processReceivedGift(gift: GiftTransaction) {
  // Add to inventory
  // Update stats
  // Trigger animations
  // etc.
}
```

### Filtering and Sorting Transactions

```typescript
const { giftsSent } = useGiftTransactionSync();

// Filter by date range
const recentGifts = giftsSent.filter(gift => {
  const giftDate = new Date(gift.created_at || gift.createdAt);
  return giftDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
});

// Sort by amount
const sortedByAmount = giftsSent.sort((a, b) => 
  (b.total_amount || b.totalAmount || 0) - (a.total_amount || a.totalAmount || 0)
);

// Group by recipient
const byRecipient = giftsSent.reduce((acc, gift) => {
  const id = gift.to_user_id || gift.toUserId;
  if (!acc[id]) acc[id] = [];
  acc[id].push(gift);
  return acc;
}, {} as Record<string, GiftTransaction[]>);
```

## Configuration Options

### useGiftTransactionSync Options

```typescript
interface UseGiftTransactionSyncOptions {
  // Callback when new transaction arrives
  onNewTransaction?: (update: GiftTransactionUpdate) => void;
  
  // Enable automatic refresh at interval
  autoRefresh?: boolean; // default: true
  
  // Interval in milliseconds for auto-refresh
  refreshInterval?: number; // default: 5000
}
```

### Notification Service Settings

```typescript
// Audio settings
giftTipNotificationService.setAudioEnabled(true);

// Get all notifications
const allNotifications = giftTipNotificationService.getAllNotifications();

// Clear specific notification
giftTipNotificationService.clearNotification(notificationId);

// Clear all
giftTipNotificationService.clearAllNotifications();
```

## Error Handling

### Safe Transaction Sending

```typescript
async function safeSendGift(
  fromUserId: string,
  toUserId: string,
  giftId: string,
  quantity: number
) {
  try {
    const transaction = await virtualGiftsService.sendGift(
      fromUserId,
      toUserId,
      giftId,
      quantity
    );

    if (!transaction) {
      throw new Error('Transaction failed - returned null');
    }

    return transaction;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Gift sending error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    
    // Show user-friendly error
    toast({
      title: 'Failed to send gift',
      description: 'Please try again or contact support',
      variant: 'destructive',
    });
  }
}
```

### Handling Sync Errors

```typescript
const { error, refresh } = useGiftTransactionSync();

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Data Sync Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      <Button onClick={() => refresh()}>Retry</Button>
    </Alert>
  );
}
```

## Performance Optimization

### Disable Auto-refresh for Large Lists

```typescript
// For components with heavy rendering
const { refresh } = useGiftTransactionSync({
  autoRefresh: false,
});

// Manual refresh on user action
<button onClick={refresh}>Refresh</button>
```

### Memoization for Expensive Computations

```typescript
const { giftsSent } = useGiftTransactionSync();

const totalSpent = useMemo(() => {
  return giftsSent.reduce((sum, gift) => {
    return sum + (gift.total_amount || gift.totalAmount || 0);
  }, 0);
}, [giftsSent]);
```

### Lazy Loading Large Datasets

```typescript
const { giftsSent, refresh } = useGiftTransactionSync();

const [displayLimit, setDisplayLimit] = useState(20);

const displayedGifts = giftsSent.slice(0, displayLimit);

const loadMore = () => {
  setDisplayLimit(prev => prev + 20);
};
```

## Testing

### Unit Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGiftTransactionSync } from '@/hooks/useGiftTransactionSync';

describe('useGiftTransactionSync', () => {
  it('should load initial transactions', async () => {
    const { result } = renderHook(() => useGiftTransactionSync());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.giftsSent)).toBe(true);
  });

  it('should call onNewTransaction callback', async () => {
    const callback = jest.fn();
    
    const { result } = renderHook(() =>
      useGiftTransactionSync({ onNewTransaction: callback })
    );

    // Simulate new transaction (mock Supabase subscription)
    // ...

    expect(callback).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Subscriptions Not Updating

**Problem**: Real-time updates not coming through
**Solution**:
1. Check Supabase connection: `supabase.auth.getSession()`
2. Verify RLS policies allow SELECT
3. Check browser console for errors
4. Confirm auto-refresh is enabled if testing

### Memory Leaks

**Problem**: Component remount causes duplicate subscriptions
**Solution**:
- Subscriptions are automatically cleaned up in useEffect return
- Verify no circular dependencies in callbacks
- Check that components unmount properly

### Animations Not Playing

**Problem**: Celebrations not showing
**Solution**:
1. Verify GiftTipEventManager is in App.tsx
2. Check browser window object is available
3. Verify Framer Motion is installed
4. Check z-index conflicts in CSS

### Performance Issues

**Problem**: Slow updates or animations
**Solution**:
1. Increase refreshInterval: `refreshInterval: 10000`
2. Disable autoRefresh: `autoRefresh: false`
3. Reduce number of confetti particles
4. Check device performance metrics

## API Reference

### useGiftTransactionSync Hook

```typescript
const {
  // Data
  giftsSent: GiftTransaction[],
  giftsReceived: GiftTransaction[],
  tipsSent: TipTransaction[],
  tipsReceived: TipTransaction[],
  
  // State
  isLoading: boolean,
  error: string | null,
  lastUpdate: Date | null,
  
  // Counters
  totalGiftsSent: number,
  totalGiftsReceived: number,
  totalTipsSent: number,
  totalTipsReceived: number,
  
  // Methods
  refresh: () => Promise<void>,
} = useGiftTransactionSync(options);
```

### giftTipNotificationService Methods

```typescript
// Notifications
notifyGiftSent(data) => void
notifyGiftReceived(data) => void
notifyTipSent(data) => void
notifyTipReceived(data) => void

// Management
onNotification(callback) => () => void  // Returns unsubscribe function
getNotification(id) => GiftNotification | undefined
getAllNotifications() => GiftNotification[]
clearNotification(id) => void
clearAllNotifications() => void

// Settings
setAudioEnabled(enabled: boolean) => void
formatNotificationMessage(notification) => string
```

## Common Patterns

### Real-time Feed Updates
```typescript
const { giftsSent, onNewTransaction } = useGiftTransactionSync({
  onNewTransaction: (update) => {
    // Add to feed in real-time
    addToFeed(update);
  }
});
```

### Dashboard Statistics
```typescript
const stats = useMemo(() => ({
  totalGiftsSent: giftsSent.length,
  totalGiftValue: giftsSent.reduce((sum, g) => sum + g.totalAmount, 0),
  uniqueRecipients: new Set(giftsSent.map(g => g.toUserId)).size,
}), [giftsSent]);
```

### Leaderboard Display
```typescript
const leaderboard = useMemo(() => {
  const grouped = giftsSent.reduce((acc, gift) => {
    const id = gift.toUserId;
    acc[id] = (acc[id] || 0) + gift.totalAmount;
    return acc;
  }, {});
  
  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}, [giftsSent]);
```

## Best Practices

1. **Always handle loading and error states**
2. **Use memoization for expensive calculations**
3. **Disable autoRefresh for large datasets**
4. **Validate user input before sending gifts**
5. **Test notification permissions before relying on them**
6. **Provide fallback UI for when Supabase is unavailable**
7. **Use TypeScript for type safety**
8. **Handle cleanup in useEffect returns**
9. **Test on various network conditions**
10. **Monitor performance with browser DevTools**

---

**Last Updated**: December 2024
**Status**: Production Ready
**Questions**: Refer to PHASE_6_IMPLEMENTATION_SUMMARY.md
