# Frontend Exam Implementation Guide

## Overview

This document describes the **robust exam system** implementation on the frontend, aligned with the updated backend requirements. The system now enforces strict time management, automatic submission on timer expiry, and comprehensive error handling.

---

## 🎯 Key Requirements

### Backend Changes
The backend now:
1. **Restores strict timing enforcement** via `expires_at`
2. **Validates all submissions** against server time
3. **Returns 410 Gone** for expired attempts
4. **Handles multi-attempt scenarios** automatically

### Frontend Responsibilities
The frontend must:
1. **Use `expires_at` as absolute truth** for timer
2. **Auto-submit when timer hits 00:00:00**
3. **Lock UI immediately** when time expires
4. **Handle 410 Gone errors** gracefully
5. **Prevent late submissions** through UI controls

---

## 🏗️ Architecture

### Component Structure

```
ExamPage.tsx
  └─→ ExamInterface.tsx / StudentExamInterface.tsx
        ├─→ ExamTimer.tsx (New robust timer component)
        ├─→ TextWithLaTeX.tsx
        └─→ LaTeX.tsx
```

### New ExamTimer Component

**Location:** `src/components/ExamTimer.tsx`

**Features:**
- Uses `expires_at` ISO timestamp from backend
- Calculates remaining time: `(expires_at - Date.now()) / 1000`
- Syncs with server every 30 seconds to prevent drift
- Shows visual warnings at 5 min and 1 min
- Calls `onTimeUp()` callback exactly when timer reaches 00:00:00
- Prevents multiple callbacks with `hasCalledTimeUp` ref

**Props:**
```typescript
interface ExamTimerProps {
  expiresAt: string;        // ISO 8601 timestamp
  onTimeUp: () => void;     // Callback when timer expires
  className?: string;
  showWarnings?: boolean;   // Show 5min/1min warnings
}
```

**Usage Example:**
```tsx
<ExamTimer 
  expiresAt={expiresAt} 
  onTimeUp={handleTimeUp}
  showWarnings={true}
/>
```

---

## 📋 Implementation Details

### 1. Starting an Exam

**API Call:** `POST /api/v1/exams/:id/start`

**Response Handling:**
```typescript
const attempt = await attemptApi.start(examId);

// Check status
if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
  // Redirect to results
  onComplete(attempt.id);
  return;
}

// Store expires_at for timer
setExpiresAt(attempt.expires_at);

// Check if already expired
const expiryTime = new Date(attempt.expires_at).getTime();
if (Date.now() >= expiryTime) {
  setIsTimeUp(true);
  setUiLocked(true);
  handleAutoSubmit(attempt.id);
  return;
}
```

**Multi-Attempt Support:**
- Backend automatically handles old attempts
- If an expired/submitted attempt exists, `/start` creates a fresh one
- If an IN_PROGRESS attempt exists, `/start` returns it (resume)

---

### 2. Timer Management

**State Variables:**
```typescript
const [expiresAt, setExpiresAt] = useState<string | null>(null);
const [isTimeUp, setIsTimeUp] = useState(false);
const [uiLocked, setUiLocked] = useState(false);
const hasAutoSubmitted = useRef(false);
```

**Timer Callback:**
```typescript
const handleTimeUp = useCallback(() => {
  if (hasAutoSubmitted.current || !attemptId) return;
  
  console.log('Time is up! Initiating auto-submit...');
  setIsTimeUp(true);
  setUiLocked(true); // Lock UI IMMEDIATELY
  handleAutoSubmit(attemptId);
}, [attemptId]);
```

**Why UI Lock is Critical:**
- Prevents answer changes during submission
- Disables all navigation buttons
- Shows "TIME'S UP" banner
- Prevents duplicate submissions

---

### 3. Submitting Answers

**API Call:** `POST /api/v1/attempts/:attemptId/answer`

**Error Handling:**
```typescript
const handleSelectAnswer = async (optionIndex: number) => {
  // Don't allow changes if UI is locked
  if (uiLocked || isTimeUp || isSubmitted) return;

  try {
    await attemptApi.submitAnswer(attemptId, {
      question_id: currentQuestion.id,
      selected_option_index: optionIndex,
    });
  } catch (err: any) {
    // Handle 410 Gone - attempt expired
    if (err.message?.includes('410') || err.message?.includes('expired')) {
      setError('Time expired! Your exam is being submitted...');
      setIsTimeUp(true);
      setUiLocked(true);
      handleAutoSubmit(attemptId);
    }
  }
};
```

---

### 4. Final Submission

**Manual Submission:**
```typescript
const handleSubmit = useCallback(async () => {
  if (!attemptId || isSubmitting || uiLocked) return;

  // Confirm unanswered questions
  const unanswered = allQuestions.length - answers.size;
  if (unanswered > 0 && !isTimeUp) {
    const confirmed = window.confirm(
      `You have ${unanswered} unanswered question(s). Submit anyway?`
    );
    if (!confirmed) return;
  }

  setIsSubmitting(true);
  setUiLocked(true); // Lock UI during submission

  try {
    await attemptApi.submit(attemptId);
    onComplete(attemptId);
  } catch (err: any) {
    // Handle 410 Gone
    if (err.message?.includes('410') || err.message?.includes('expired')) {
      setError('Exam already submitted or expired.');
      onComplete(attemptId);
    }
  }
}, [attemptId, isSubmitting, uiLocked]);
```

**Auto-Submission:**
```typescript
const handleAutoSubmit = useCallback(async (attemptIdToSubmit: string) => {
  // Prevent duplicate submissions
  if (hasAutoSubmitted.current) return;
  
  hasAutoSubmitted.current = true;
  setIsSubmitting(true);
  setUiLocked(true);

  try {
    await attemptApi.submit(attemptIdToSubmit);
    
    // Delay to show "TIME'S UP" message
    setTimeout(() => {
      onComplete(attemptIdToSubmit);
    }, 2000);
  } catch (err: any) {
    console.error('Auto-submit error:', err);
    // Navigate anyway (backend may have already submitted)
    setTimeout(() => {
      onComplete(attemptIdToSubmit);
    }, 2000);
  }
}, [onComplete]);
```

**Idempotency:**
- `/submit` endpoint is safe to call multiple times
- Returns stored results if already submitted
- No data loss or rollback issues

---

### 5. UI State Management

**Disabled States:**
All interactive elements must respect `uiLocked`:

```tsx
<button
  onClick={handleSelectAnswer}
  disabled={uiLocked || isTimeUp || isSubmitted}
  className={`... ${uiLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
>
```

**Visual Indicators:**

```tsx
{isTimeUp && (
  <div className="bg-red-100 border-2 border-red-500 rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-center gap-3 text-red-700">
      <AlertCircle className="w-8 h-8" />
      <span className="text-2xl font-bold">⏰ TIME'S UP!</span>
    </div>
    <p className="text-red-600 text-lg font-medium">
      {isSubmitting ? 'Submitting automatically...' : 'Exam submitted.'}
    </p>
  </div>
)}
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Student navigates to /exam/:examLink                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Load exam data via examApi.getByLink(examLink)      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Start attempt: attemptApi.start(examId)             │
│    Response: { id, status, expires_at, questions }     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
          ┌───────┴────────┐
          │ Check status   │
          └───────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    SUBMITTED/         IN_PROGRESS
     EXPIRED               │
         │                 │
         │                 ▼
         │    ┌────────────────────────────┐
         │    │ 4. Set expiresAt, start    │
         │    │    ExamTimer component     │
         │    └────────────┬───────────────┘
         │                 │
         │                 ▼
         │    ┌────────────────────────────┐
         │    │ 5. Student answers questions│
         │    │    - Submit each answer     │
         │    │    - Handle 410 Gone errors │
         │    └────────────┬───────────────┘
         │                 │
         │        ┌────────┴─────────┐
         │        │                  │
         │   Timer Expires      Manual Submit
         │        │                  │
         │        ▼                  ▼
         │    ┌────────────────────────────┐
         │    │ 6. Lock UI immediately     │
         │    │    setUiLocked(true)       │
         │    └────────────┬───────────────┘
         │                 │
         │                 ▼
         │    ┌────────────────────────────┐
         │    │ 7. Call attemptApi.submit()│
         │    │    (Idempotent endpoint)   │
         │    └────────────┬───────────────┘
         │                 │
         └─────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Navigate to results page with attemptId             │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Error Handling

### 410 Gone - Attempt Expired

**When it occurs:**
- Submitting answers after timer expires
- Manual submission of expired attempt
- Loading already expired attempt

**Handling:**
```typescript
catch (err: any) {
  if (err.message?.includes('410') || err.message?.includes('expired')) {
    setError('Time expired! Exam is being submitted...');
    setIsTimeUp(true);
    setUiLocked(true);
    handleAutoSubmit(attemptId);
  }
}
```

### 400 Bad Request

**When it occurs:**
- Invalid request data
- Missing required fields

**Handling:**
```typescript
catch (err: any) {
  setError(err.message || 'Failed to submit answer');
  console.error('Error:', err);
}
```

### Network Errors

**Handling:**
```typescript
catch (err: any) {
  setError('Network error. Please check your connection.');
  console.error('Network error:', err);
}
```

---

## ✅ Testing Checklist

### Timer Functionality
- [ ] Timer starts correctly from `expires_at`
- [ ] Timer counts down accurately
- [ ] Timer syncs with server every 30 seconds
- [ ] Warnings show at 5 min and 1 min
- [ ] Auto-submit triggers at 00:00:00
- [ ] UI locks immediately on expiry

### Answer Submission
- [ ] Answers save successfully during exam
- [ ] 410 Gone errors trigger auto-submit
- [ ] UI updates reflect saved answers
- [ ] Toggle selection works correctly

### Manual Submission
- [ ] Confirmation prompt for unanswered questions
- [ ] UI locks during submission
- [ ] Navigation to results on success
- [ ] Idempotent - safe to click multiple times

### Auto-Submission
- [ ] Triggers exactly when timer hits 00:00:00
- [ ] Only runs once (hasAutoSubmitted ref)
- [ ] Shows "TIME'S UP" banner
- [ ] Navigates to results after delay
- [ ] Works even if API call fails

### Edge Cases
- [ ] Resume IN_PROGRESS attempt works
- [ ] Already submitted attempt redirects
- [ ] Already expired attempt handles gracefully
- [ ] Multiple tabs don't cause issues
- [ ] Browser refresh preserves state (if implemented)

---

## 🚀 Performance Considerations

### Timer Precision
- Client-side countdown (no API calls)
- 30-second sync prevents drift
- Millisecond precision not required

### API Optimization
- Batch answer submissions if needed
- Debounce rapid answer changes
- Cache exam data locally

### Memory Management
- Clean up intervals on unmount
- Clear refs appropriately
- Remove event listeners

---

## 📝 Code Examples

### Complete Timer Integration

```typescript
// State
const [expiresAt, setExpiresAt] = useState<string | null>(null);
const [isTimeUp, setIsTimeUp] = useState(false);
const [uiLocked, setUiLocked] = useState(false);
const hasAutoSubmitted = useRef(false);

// Initialize
useEffect(() => {
  const init = async () => {
    const attempt = await attemptApi.start(examId);
    setExpiresAt(attempt.expires_at);
    
    // Check if expired
    const expiryTime = new Date(attempt.expires_at).getTime();
    if (Date.now() >= expiryTime) {
      setIsTimeUp(true);
      setUiLocked(true);
      handleAutoSubmit(attempt.id);
    }
  };
  init();
}, [examId]);

// Timer callback
const handleTimeUp = useCallback(() => {
  if (hasAutoSubmitted.current) return;
  setIsTimeUp(true);
  setUiLocked(true);
  handleAutoSubmit(attemptId);
}, [attemptId]);

// Render
{expiresAt && (
  <ExamTimer 
    expiresAt={expiresAt} 
    onTimeUp={handleTimeUp}
    showWarnings={true}
  />
)}
```

---

## 🎨 UI/UX Best Practices

### Visual Feedback
- Clear timer display with color coding
- Animated warnings for critical time
- Prominent "TIME'S UP" banner
- Loading spinners during submission
- Disabled state styling

### User Communication
- Confirmation dialogs for important actions
- Clear error messages
- Progress indicators
- Success/failure feedback

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

---

## 📚 Related Files

### Core Components
- `src/components/ExamTimer.tsx` - Robust timer component
- `src/components/student/StudentExamInterface.tsx` - Student exam interface
- `src/components/student/ExamInterface.tsx` - Generic exam interface
- `src/pages/ExamPage.tsx` - Exam page wrapper

### API Layer
- `src/lib/api.ts` - API client with attempt endpoints
- `src/lib/supabase.ts` - Supabase client (if used)

### Utilities
- `src/components/TextWithLaTeX.tsx` - LaTeX rendering
- `src/components/Timer.tsx` - Old timer (deprecated)

---

## 🔧 Migration from Old System

### Changes Required

1. **Remove old Timer component:**
   ```tsx
   // OLD
   <Timer duration={timeInMinutes} onTimeUp={handleTimeUp} />
   
   // NEW
   <ExamTimer expiresAt={expiresAt} onTimeUp={handleTimeUp} />
   ```

2. **Remove timeRemaining state:**
   ```typescript
   // OLD
   const [timeRemaining, setTimeRemaining] = useState(0);
   
   // NEW
   const [expiresAt, setExpiresAt] = useState<string | null>(null);
   ```

3. **Add UI lock state:**
   ```typescript
   const [uiLocked, setUiLocked] = useState(false);
   const hasAutoSubmitted = useRef(false);
   ```

4. **Update all button disabled states:**
   ```tsx
   disabled={uiLocked || isTimeUp || isSubmitted}
   ```

5. **Add 410 Gone error handling:**
   ```typescript
   if (err.message?.includes('410') || err.message?.includes('expired')) {
     // Handle expiry
   }
   ```

---

## 🎯 Summary

### Frontend Responsibilities
| Feature | Implementation |
|---------|---------------|
| Timer Truth | Use `expires_at` from backend |
| Countdown | Client-side with 30s sync |
| Auto-Submit | Trigger at 00:00:00 exactly |
| UI Lock | Disable all inputs on expiry |
| Error Handling | Catch and handle 410 Gone |

### Backend Enforcement
| Feature | Behavior |
|---------|----------|
| Time Validation | Rejects late submissions |
| Multi-Attempt | Auto-creates fresh attempts |
| Idempotency | Safe to submit multiple times |
| Error Codes | 410 Gone for expired attempts |

---

## 📞 Support

For issues or questions:
1. Check error messages in browser console
2. Verify network requests in DevTools
3. Review backend logs for 410 errors
4. Test with different time limits
5. Consult API documentation

---

**Last Updated:** December 19, 2025  
**Version:** 2.0 (Robust Timer Implementation)
