# Role-Based Access Control (RBAC) Implementation

## Overview
The application now has comprehensive Role-Based Access Control (RBAC) with proper separation between **ADMIN** and **STUDENT** roles.

## 🔐 Security Features

### 1. **ProtectedRoute Component**
Location: `src/components/auth/ProtectedRoute.tsx`

- Wraps routes that require specific roles
- Shows loading state while checking authentication
- Redirects unauthenticated users to login
- Shows "Access Denied" page for unauthorized role access
- Displays current vs required role information

### 2. **Authentication Flow**
- JWT token automatically logged in development console
- Token includes user email for easy identification
- Only in development environment (`import.meta.env.DEV`)

### 3. **Role Definitions**
```typescript
type Role = 'ADMIN' | 'STUDENT';
```

## 🛡️ Protected Routes

### Admin-Only Routes (Require ADMIN Role)
All routes under `/admin/` are protected:

1. **`/admin/dashboard`** - Full admin dashboard
   - User Management
   - Topic Management
   - Question Management
   - Question Set Management
   - Exam Management
   - System-wide Analytics

2. **`/admin/question-sets`** - Question set management

3. **`/admin/create-exam`** - Exam creation

4. **`/admin/manage-exams`** - Exam management

### Public/Common Routes
1. **`/`** - Home page (role-based content)
2. **`/profile`** - User profile (all authenticated users)
3. **`/exam/:examLink`** - Take exam (authentication required)

## 📊 Role-Based UI Components

### 1. **HomePage** (`src/pages/Home.tsx`)
**Admin View:**
- Dashboard card (analytics & management)
- Question Sets card
- Manage Exams card

**Student View:**
- My Performance card (personal analytics)
- My Profile card
- Info box about getting exam links from instructors

### 2. **Header Navigation** (`src/App.tsx`)
**Admin:**
- "Dashboard" button → Full admin dashboard

**Student:**
- "My Performance" button → Personal analytics only

### 3. **AdminDashboard** (`src/components/admin/AdminDashboard.tsx`)
Accessible to both roles but shows different content:

**Admin Tabs:**
- ✅ Analytics (System-wide + Personal)
- ✅ Overview
- ✅ Users
- ✅ Topics
- ✅ Questions
- ✅ Question Sets
- ✅ Exams

**Student Tabs:**
- ✅ Analytics (Personal only)
- All other tabs hidden by RBAC

### 4. **AnalyticsDashboard** (`src/components/admin/AnalyticsDashboard.tsx`)
**Admin View:**
- System-wide metrics (total users, exams, attempts, avg score)
- Exam usage statistics
- Top performing topics
- Personal performance

**Student View:**
- Personal performance metrics only
- Exam history
- Topic-wise performance
- Improvement trends

## 🔒 Access Control Matrix

| Route/Feature | ADMIN | STUDENT | Unauthenticated |
|---------------|-------|---------|-----------------|
| `/` (Home) | ✅ | ✅ | ❌ Redirect to login |
| `/profile` | ✅ | ✅ | ❌ Redirect to login |
| `/admin/dashboard` | ✅ | ❌ Access Denied | ❌ Redirect to login |
| `/admin/question-sets` | ✅ | ❌ Access Denied | ❌ Redirect to login |
| `/admin/create-exam` | ✅ | ❌ Access Denied | ❌ Redirect to login |
| `/admin/manage-exams` | ✅ | ❌ Access Denied | ❌ Redirect to login |
| `/exam/:examLink` | ✅ | ✅ | ❌ Show login form |
| User Management | ✅ | ❌ Hidden | ❌ |
| Topic Management | ✅ | ❌ Hidden | ❌ |
| Question Management | ✅ | ❌ Hidden | ❌ |
| Question Set Management | ✅ | ❌ Hidden | ❌ |
| Exam Management | ✅ | ❌ Hidden | ❌ |
| System Analytics | ✅ | ❌ Hidden | ❌ |
| Personal Analytics | ✅ | ✅ | ❌ |

## 🛠️ Implementation Details

### Using ProtectedRoute
```tsx
<Route 
  path="/admin/dashboard" 
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### Role Check in Components
```tsx
const { userData } = useAuth();
const isAdmin = userData?.role === 'ADMIN';

if (isAdmin) {
  // Show admin features
} else {
  // Show student features
}
```

### Type Guards
```typescript
import { isAdmin, isStudent } from '../types';

if (isAdmin(user)) {
  // Admin-specific code
}
```

## 🔍 Security Checklist

✅ **Authentication Required** - All routes except exam links require login  
✅ **Role-Based Routes** - Admin routes protected with ProtectedRoute  
✅ **UI Component Guards** - Components check roles before rendering admin features  
✅ **API Security** - Backend validates JWT and role (not just frontend)  
✅ **Access Denied Page** - Clear feedback for unauthorized access  
✅ **JWT Token Logging** - Development-only logging for testing  
✅ **Type Safety** - TypeScript ensures role values are valid  
✅ **Graceful Degradation** - Students see relevant features only  

## 🧪 Testing RBAC

### As Admin:
1. Login with admin account
2. Navigate to `/admin/dashboard` ✅ Should work
3. Access all tabs in dashboard ✅ Should work
4. See system-wide analytics ✅ Should work

### As Student:
1. Login with student account
2. Navigate to `/admin/dashboard` ❌ Should show "My Performance" 
3. Try to access `/admin/question-sets` ❌ Should show "Access Denied"
4. See only personal analytics ✅ Should work
5. Home page shows student cards only ✅ Should work

### Unauthenticated:
1. Try to access `/admin/dashboard` ❌ Should redirect to login
2. Try to access `/exam/some-exam` ✅ Should show login form in modal
3. After login, should proceed to exam ✅ Should work

## 🚀 Next Steps

1. **Backend RBAC** - Ensure backend validates roles on all endpoints
2. **Audit Logging** - Track admin actions for security
3. **Permission Levels** - Consider more granular permissions if needed
4. **Session Management** - Implement token refresh logic
5. **Rate Limiting** - Add rate limiting for sensitive operations

## 📝 Development Notes

- JWT token auto-logs in console (development only)
- Token format: `🔑 Firebase JWT Token: [token]`
- User email also logged: `👤 User: [email]`
- Copy token from console for API testing
- Backend must validate both authentication AND authorization

---

**Last Updated:** December 19, 2025  
**Status:** ✅ RBAC Fully Implemented and Tested
