# Quick Reference: Robust Exam System

## 🚀 Quick Start

### 1. Import the Timer
```typescript
import { ExamTimer } from '../components/ExamTimer';
```

### 2. Add Required State
```typescript
const [expiresAt, setExpiresAt] = useState<string | null>(null);
const [isTimeUp, setIsTimeUp] = useState(false);
const [uiLocked, setUiLocked] = useState(false);
const hasAutoSubmitted = useRef(false);
```

### 3. Initialize on Exam Start
```typescript
useEffect(() => {
  const init = async () => {
    const attempt = await attemptApi.start(examId);
    setExpiresAt(attempt.expires_at);
  };
  init();
}, [examId]);
```

### 4. Add Timer Callback
```typescript
const handleTimeUp = useCallback(() => {
  if (hasAutoSubmitted.current) return;
  setIsTimeUp(true);
  setUiLocked(true);
  handleAutoSubmit(attemptId);
}, [attemptId]);
```

### 5. Render Timer
```tsx
{expiresAt && (
  <ExamTimer 
    expiresAt={expiresAt} 
    onTimeUp={handleTimeUp}
    showWarnings={true}
  />
)}
```

### 6. Disable All Inputs
```tsx
<button disabled={uiLocked || isTimeUp}>
```

---

## 📋 Checklist

### Required Changes
- [ ] Replace old `Timer` with `ExamTimer`
- [ ] Add `uiLocked` state
- [ ] Add `hasAutoSubmitted` ref
- [ ] Implement `handleTimeUp()` callback
- [ ] Implement `handleAutoSubmit()` function
- [ ] Add `uiLocked` to all button `disabled` props
- [ ] Add 410 Gone error handling
- [ ] Add "TIME'S UP" banner
- [ ] Store `expires_at` from backend response

### Optional Enhancements
- [ ] Show warnings at 5 min and 1 min
- [ ] Add loading spinner during auto-submit
- [ ] Add delay before redirect (2 seconds)
- [ ] Add error banner for network issues
- [ ] Implement answer auto-save

---

## 🎯 Key Functions

### handleTimeUp
```typescript
const handleTimeUp = useCallback(() => {
  if (hasAutoSubmitted.current || !attemptId) return;
  
  console.log('Time is up! Initiating auto-submit...');
  setIsTimeUp(true);
  setUiLocked(true); // 🔒 Lock UI immediately
  handleAutoSubmit(attemptId);
}, [attemptId]);
```

### handleAutoSubmit
```typescript
const handleAutoSubmit = useCallback(async (attemptId: string) => {
  if (hasAutoSubmitted.current) return; // Prevent duplicate
  
  hasAutoSubmitted.current = true;
  setIsSubmitting(true);
  setUiLocked(true);
  
  try {
    await attemptApi.submit(attemptId);
    setTimeout(() => onComplete(attemptId), 2000);
  } catch (err) {
    console.error('Auto-submit error:', err);
    setTimeout(() => onComplete(attemptId), 2000);
  }
}, [onComplete]);
```

### handleAnswer (with 410 handling)
```typescript
const handleAnswer = async (questionId: string, answerIndex: number) => {
  if (uiLocked || isTimeUp) return; // 🛑 Block if locked

  try {
    await attemptApi.submitAnswer(attemptId, {
      question_id: questionId,
      selected_option_index: answerIndex,
    });
  } catch (err: any) {
    // Handle 410 Gone
    if (err.message?.includes('410') || err.message?.includes('expired')) {
      setError('Time expired! Exam is being submitted...');
      setIsTimeUp(true);
      setUiLocked(true);
      handleAutoSubmit(attemptId);
    }
  }
};
```

---

## 🎨 UI Components

### TIME'S UP Banner
```tsx
{isTimeUp && (
  <div className="bg-red-100 border-2 border-red-500 rounded-xl p-6 text-center animate-pulse">
    <div className="flex items-center justify-center gap-3 text-red-700 mb-2">
      <AlertCircle className="w-8 h-8" />
      <span className="text-2xl font-bold">⏰ TIME'S UP!</span>
    </div>
    <p className="text-red-600 text-lg font-medium">
      {isSubmitting ? 'Submitting your exam automatically...' : 'Your exam has been submitted.'}
    </p>
    {isSubmitting && (
      <div className="mt-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
      </div>
    )}
  </div>
)}
```

### Disabled Button Styling
```tsx
<button
  disabled={uiLocked || isTimeUp || isSubmitted}
  className={`... ${uiLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
>
```

---

## 🔍 Testing Commands

### Manual Testing
```bash
# 1. Start the dev server
npm run dev

# 2. Create a test exam with 2-minute time limit

# 3. Start exam and wait for timer to expire

# 4. Verify:
# - Timer counts down correctly
# - Warnings appear at 1 min
# - Auto-submit triggers at 00:00
# - UI locks immediately
# - Redirect happens after 2 seconds
```

### Edge Cases to Test
1. **Already expired attempt**: Start exam with past `expires_at`
2. **410 during exam**: Manually expire attempt on backend
3. **Resume attempt**: Start, close browser, reopen
4. **Multiple tabs**: Open exam in multiple tabs
5. **Slow network**: Throttle network in DevTools
6. **Manual submit**: Submit before time expires

---

## ⚠️ Common Pitfalls

### ❌ Don't Do This
```typescript
// BAD: Using client-side duration
const [duration, setDuration] = useState(exam.time_limit_seconds);

// BAD: Not locking UI
const handleTimeUp = () => {
  handleAutoSubmit(); // UI still unlocked!
};

// BAD: Not checking for duplicates
const handleAutoSubmit = async () => {
  await attemptApi.submit(attemptId); // Can run multiple times!
};
```

### ✅ Do This
```typescript
// GOOD: Using server expires_at
const [expiresAt, setExpiresAt] = useState<string | null>(null);

// GOOD: Locking UI immediately
const handleTimeUp = () => {
  setUiLocked(true); // Lock first!
  handleAutoSubmit();
};

// GOOD: Protecting against duplicates
const handleAutoSubmit = async () => {
  if (hasAutoSubmitted.current) return; // Check first!
  hasAutoSubmitted.current = true;
  await attemptApi.submit(attemptId);
};
```

---

## 📊 State Flow Diagram

```
┌─────────────────┐
│ Exam Loaded     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set expiresAt   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Timer Running   │
│ UI Unlocked     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Timer Hits 0    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ handleTimeUp()  │
│ setUiLocked(T)  │ ← 🔒 Critical!
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-Submit API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Show Banner     │
│ Wait 2 seconds  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Navigate        │
└─────────────────┘
```

---

## 🐛 Debugging Tips

### Timer Not Counting Down
```javascript
// Check if expiresAt is set
console.log('expiresAt:', expiresAt);

// Check if ExamTimer is rendered
console.log('Timer rendered:', !!expiresAt);

// Check timer component logs
// Look for: "Time is up! Initiating auto-submit..."
```

### UI Not Locking
```javascript
// Check uiLocked state
console.log('uiLocked:', uiLocked);

// Check button disabled prop
console.log('Button disabled:', uiLocked || isTimeUp);

// Verify handleTimeUp is called
console.log('handleTimeUp called');
```

### Auto-Submit Not Working
```javascript
// Check ref
console.log('hasAutoSubmitted:', hasAutoSubmitted.current);

// Check attemptId
console.log('attemptId:', attemptId);

// Check API call
console.log('Submitting attempt:', attemptId);

// Check for errors
try {
  await attemptApi.submit(attemptId);
} catch (err) {
  console.error('Submit error:', err);
}
```

---

## 📚 Related Documentation

- **Full Guide**: `FRONTEND_EXAM_IMPLEMENTATION_GUIDE.md`
- **Summary**: `ROBUST_EXAM_SYSTEM_SUMMARY.md`
- **API Spec**: `COMPLETE_API_SPECIFICATION.md`

---

## 💡 Pro Tips

1. **Always lock UI immediately** when time expires
2. **Use refs for one-time actions** (hasAutoSubmitted)
3. **Handle 410 Gone in answer submission** not just final submit
4. **Test with short time limits** (2 minutes) for faster feedback
5. **Check browser console** for auto-submit logs
6. **Verify expires_at format** (must be ISO 8601 string)
7. **Test edge cases** (already expired, resume, 410 errors)

---

**Version:** 2.0.0  
**Last Updated:** December 19, 2025  
**Status:** Production Ready ✅
