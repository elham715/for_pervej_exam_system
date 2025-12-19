# Analytics Endpoints Debug Guide

## Current Status

Based on testing with your backend, here's what I found:

### ✅ Working Endpoints
1. `GET /analytics/users/:id` - User Performance Analytics
2. `GET /analytics/users/:id/history` - User Exam History  
3. `GET /analytics/users/:id/topics` - User Topic Performance
4. `GET /analytics/users/:id/trend` - User Improvement Trend
5. `GET /analytics/system` - System Analytics (Admin)
6. `GET /analytics/topics/top-performing` - Top Performing Topics (Admin)
7. `GET /analytics/exams/:id/detailed` - Detailed Exam Results (Admin)

### ❌ Issues Found

#### 1. `/analytics/exams/usage` - HTTP 400 Error
**Problem**: Endpoint expects an exam ID but specification shows it should return all exam usage stats
**Current Error**: `{"error":{"code":"ANALYTICS_ERROR","message":"Exam not found"}}`
**Expected**: Should return array of all exam usage statistics

#### 2. Response Format Differences
**Problem**: Some endpoints return different field names than specified
**Example**: 
- Specification expects: `user_id`, `total_attempts`, `completed_attempts`
- Backend returns: `userId`, `totalExamsTaken`, `completedExams`

## Debugging Steps

### Step 1: Test All Endpoints
```bash
# Use the provided test script with a valid token
TOKEN="your-firebase-token" ./scripts/test_analytics_endpoints.sh
```

### Step 2: Check Backend Logs
Look for these common issues in your backend logs:
- Database connection errors
- Query execution errors
- Authentication/authorization failures
- Missing data or null values

### Step 3: Verify Database Schema
Ensure your database has the required tables and relationships:
- `users` table with proper fields
- `exam_attempts` table with status tracking
- `exam_answers` table for detailed analytics
- Proper foreign key relationships

## Required Fixes

### Fix 1: `/analytics/exams/usage` Endpoint
The endpoint should return usage stats for ALL exams, not require an exam ID.

**Current (incorrect)**: `GET /analytics/exams/usage` → expects exam ID
**Should be**: `GET /analytics/exams/usage` → returns array of all exam stats

### Fix 2: Standardize Response Fields
Update backend to match API specification field names:

**User Performance Analytics** should return:
```json
{
  "user_id": "string",           // not "userId"
  "total_attempts": number,      // not "totalExamsTaken"  
  "completed_attempts": number,  // not "completedExams"
  "average_score": number,       // not "averageScore"
  "best_score": number,          // add if missing
  "total_time_spent_minutes": number, // add if missing
  "improvement_trend": "IMPROVING|STABLE|DECLINING", // not array
  "topic_performance": [...]     // not "topicWisePerformance"
}
```

### Fix 3: Add Missing Fields
Some endpoints are missing required fields from the specification:
- `best_score` in user performance
- `total_time_spent_minutes` in user performance  
- `question_analytics` in exam analytics
- Proper `improvement_trend` enum values

## Testing Commands

### Test with Valid Token
```bash
# Replace with your actual token
export TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Test specific endpoint
curl -X GET "http://localhost:8000/api/v1/analytics/system" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test problematic endpoint
curl -X GET "http://localhost:8000/api/v1/analytics/exams/usage" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Debug Database Queries
Add logging to your backend to see what SQL queries are being executed:
```javascript
// Example logging for debugging
console.log('Executing query:', query);
console.log('Query parameters:', params);
console.log('Query result:', result);
```

## Expected vs Actual Comparison

| Endpoint | Status | Expected Format | Actual Format | Action Needed |
|----------|--------|----------------|---------------|---------------|
| `/analytics/users/:id` | ✅ Working | Specification format | Different field names | Update field names |
| `/analytics/users/:id/history` | ✅ Working | Array of attempts | Working correctly | None |
| `/analytics/users/:id/topics` | ✅ Working | Array of topics | Working correctly | None |
| `/analytics/users/:id/trend` | ✅ Working | Trend object | Different format | Update format |
| `/analytics/exams/:id` | ⚠️ Needs testing | Exam analytics | Unknown | Test with valid exam ID |
| `/analytics/exams/:id/detailed` | ✅ Working | Detailed results | Working correctly | None |
| `/analytics/system` | ✅ Working | System stats | Working correctly | None |
| `/analytics/exams/usage` | ❌ Broken | Array of exam stats | Expects exam ID | Fix routing |
| `/analytics/topics/top-performing` | ✅ Working | Array of topics | Working correctly | None |

## Quick Fixes for Backend

### 1. Fix Exam Usage Endpoint
```javascript
// Current (wrong): expects exam ID
app.get('/analytics/exams/usage/:examId', ...)

// Should be: returns all exam usage
app.get('/analytics/exams/usage', async (req, res) => {
  // Return usage stats for ALL exams
  const examUsageStats = await getAllExamUsageStats();
  res.json({ success: true, data: examUsageStats });
});
```

### 2. Standardize Field Names
Update your database queries to return fields matching the specification:
```javascript
// Instead of: userId, totalExamsTaken, completedExams
// Return: user_id, total_attempts, completed_attempts
```

### 3. Add Error Handling
```javascript
try {
  const result = await analyticsQuery();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Analytics error:', error);
  res.status(500).json({
    error: {
      code: 'ANALYTICS_ERROR',
      message: 'Failed to fetch analytics data',
      timestamp: new Date().toISOString()
    }
  });
}
```

## Verification Checklist

After making fixes, verify:
- [ ] All endpoints return HTTP 200 for valid requests
- [ ] Response field names match API specification exactly
- [ ] `/analytics/exams/usage` returns array without requiring exam ID
- [ ] Error responses follow standard format
- [ ] Admin-only endpoints properly check permissions
- [ ] Self-access endpoints allow users to view their own data

## Next Steps

1. **Fix the routing issue** for `/analytics/exams/usage`
2. **Update field names** to match specification
3. **Add missing fields** like `best_score`, `total_time_spent_minutes`
4. **Test all endpoints** with the provided test script
5. **Add proper error handling** and logging
6. **Update frontend** if any breaking changes are made

Use the test script to verify all fixes: `TOKEN="your-token" ./scripts/test_analytics_endpoints.sh`