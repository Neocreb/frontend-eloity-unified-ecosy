# Story Viewer Enhancements - Quick Test Guide

## How to Test Each Feature

### 🎥 Open a Story First
1. Go to Feed page
2. Click on any story in the stories section
3. StoryViewer opens in fullscreen

---

## Feature Test Commands

### 1. ⏸️ Pause/Resume
**Desktop**: 
- Click anywhere on the story
- OR Press `Space` bar
- Should show "Paused" indicator

**Mobile**: 
- Tap anywhere on the story
- Should pause auto-advance timer

---

### 2. 🔊 Mute/Unmute (Videos Only)
**Any Device**:
1. Click on the `Volume2` or `VolumeX` icon in bottom-right
2. Icon toggles between speaker and mute symbol
3. Video audio mutes/unmutes

---

### 3. ❤️ Double-Tap to Like
**Desktop**:
1. Double-click on the story
2. Animated red heart(s) appear and float upward
3. Like count increases

**Mobile**:
1. Double-tap story quickly
2. Hearts appear with animation
3. Like count increases

---

### 4. ⌨️ Keyboard Navigation
**Desktop Only** (while StoryViewer is open):
- `Right Arrow` → Next story
- `Left Arrow` → Previous story
- `Escape` → Close viewer
- `Space` → Pause/Resume

---

### 5. 👆 Swipe Gestures
**Mobile Only**:
- **Swipe Left** (50px+) → Next story
- **Swipe Right** (50px+) → Previous story
- **Swipe Up** (100px+) → Close viewer

---

### 6. 👀 View Count
**Any Device**:
1. Look at top-left area next to user avatar
2. Should show formatted number: "127 views", "1.2K", "1.5M"
3. Updates based on story.views field

---

### 7. 👤 Profile Click
**Any Device**:
1. Click on user avatar OR username
2. Browser navigates to `/app/profile/:userId`
3. User profile page loads

---

### 8. ⏳ Video Loading
**Test with Videos Only**:
1. Open a video story
2. While buffering, see animated spinner overlay
3. Spinner disappears when video can play
4. Video plays smoothly

---

### 9. ⏰ Expiration Time
**Any Device**:
1. Look at top-right area (near view count)
2. See "Expires in 6h", "Expires in 45m", or "Expires soon"
3. Updates based on story.expires_at field

---

### 10. 🎯 Navigation Chevrons
**Desktop**:
1. Hover over the story
2. ChevronLeft (left side) and ChevronRight (right side) appear
3. Opacity: 70% → 100% on hover
4. Click to navigate

**Mobile**:
1. Tap story to show/hide chevrons
2. Chevrons appear on first/last story conditions
3. Tap chevrons to navigate

---

## Expected Behavior Checklist

### General
- [ ] Story opens in fullscreen with black background
- [ ] Progress bar fills from left to right (top of screen)
- [ ] Progress bar resets when changing stories
- [ ] Stories auto-advance after ~5 seconds
- [ ] Auto-advance pauses when user pauses

### User Info Section
- [ ] User avatar visible with border
- [ ] Username displayed
- [ ] Timestamp shown (HH:MM format)
- [ ] View count visible with formatted number
- [ ] Expiration time shown

### Media Display
- [ ] Images scale properly (object-contain)
- [ ] Videos auto-play (muted by default)
- [ ] Caption/content visible below media
- [ ] Loading spinner shows for videos
- [ ] Videos loop when completed

### Interactions
- [ ] Click to pause shows "Paused" text
- [ ] Double-tap shows floating hearts
- [ ] Mute button only shows for videos
- [ ] Action buttons on bottom are clickable
- [ ] All buttons have hover effects (white/20)

### Navigation
- [ ] Left/right navigation zones work (1/3 width each)
- [ ] Chevrons visible on hover/focus
- [ ] First/last story chevrons hidden appropriately
- [ ] Keyboard arrows work on desktop
- [ ] Swipes work on mobile
- [ ] Escape closes viewer

### Responsiveness
- [ ] Works on desktop (1920px)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)
- [ ] Touch targets appropriately sized
- [ ] No layout shift on mute button appearance

---

## Debugging Tips

### Story Not Opening?
- Check browser console for errors
- Verify story object has `media_url` field
- Check if StoryViewer receives stories array

### Double-Tap Not Working?
- Ensure tap timeout is < 300ms
- Check if double-tap handler receives event

### Keyboard Not Working?
- Verify StoryViewer is mounted
- Check if `keydown` event listener is attached
- Test with no modal overlays

### Swipe Not Working?
- Verify touch events are firing
- Check min swipe distance (50px horizontal, 100px vertical)
- Ensure no parent elements blocking touch events

### Video Loading Spinner Stuck?
- Check if `canplay` event fires
- Verify video element ref is proper
- Test with different video formats

---

## Data Requirements

### For Full Feature Testing, Story Object Should Have:

```typescript
{
  id: string;                    // Required for liking
  user?: {
    id: string;                  // Required for profile nav
    name: string;                // User display name
    avatar: string;              // Avatar URL
  };
  user_id?: string;              // Fallback user ID
  media_url: string;             // Video/image URL
  media_type?: 'video' | 'image'; // Type detection
  type?: 'video' | 'image';      // Fallback type
  caption?: string;              // Story text
  content?: string;              // Fallback text
  views?: number;                // View count
  created_at?: string;           // Timestamp (ISO)
  expires_at?: string;           // Expiration time (ISO)
}
```

---

## Performance Testing

### Metrics to Monitor
- First story load time
- Double-tap response (should be <100ms)
- Swipe detection lag
- Keyboard navigation instant
- Heart animation smooth (60fps)

### Browser DevTools
1. Open DevTools (F12)
2. Performance tab
3. Record while interacting
4. Look for jank or dropped frames

---

## Mobile Testing Tips

### iOS
- Use Safari or Chrome
- Test on actual device for swipe feel
- Check gesture conflicts with browser back swipe

### Android
- Test on Chrome and Firefox
- Verify touch events aren't throttled
- Check gesture conflicts with navigation

---

## Reporting Issues

If you find bugs or unexpected behavior:

1. **Note the device/browser**
2. **Describe the action** (e.g., "Double-tap on bottom-right corner")
3. **Expected vs actual** behavior
4. **Reproduce steps** (reproducible = faster fix)
5. **Check console** for JavaScript errors

---

## Known Limitations

- Swipe gestures are mobile-only (no mouse swipe emulation)
- Video loading spinner only shows for videos (not images)
- Keyboard navigation is desktop-only
- Profile navigation requires valid user ID
- Double-tap requires <300ms between taps

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
