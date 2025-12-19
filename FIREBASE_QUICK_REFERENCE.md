# Firebase Authentication - Quick Reference

## 📦 What Was Implemented

### Files Created:
1. **`src/lib/firebase.ts`** - Firebase initialization
2. **`src/lib/auth.ts`** - Authentication service functions
3. **`src/contexts/AuthContext.tsx`** - React Context for auth state
4. **`src/components/auth/SignupForm.tsx`** - Standalone signup form

### Files Modified:
1. **`src/main.tsx`** - Wrapped app with AuthProvider
2. **`src/App.tsx`** - Added auth check and Login component
3. **`src/components/auth/Login.tsx`** - Updated with Firebase auth
4. **`src/types/index.ts`** - Added User interface

## 🚀 Quick Start

### 1. Enable Authentication in Firebase Console

```bash
1. Go to https://console.firebase.google.com
2. Select your project: omni-exam-system
3. Navigate to: Authentication > Sign-in method
4. Enable "Email/Password"
5. Click "Save"
```

### 2. Set Up Firestore Database

```bash
1. Go to: Firestore Database
2. Click "Create database"
3. Select "Start in test mode"
4. Choose location (closest to users)
5. Click "Enable"
```

### 3. Test the Application

```bash
# Start the development server
npm run dev

# Open browser and navigate to the app
# You'll see the login page

# Click "Sign Up" to create a new account
# Fill in the form and submit
# You'll be logged in automatically
```

## 🔑 Key Functions

### Sign Up a New User
```typescript
import { signUp } from './lib/auth';

await signUp('user@example.com', 'password123', {
  name: 'John Doe',
  phone: '+1234567890',
  college_name: 'ABC College',
  address: '123 Main St',
  role: 'student' // or 'admin'
});
```

### Sign In
```typescript
import { signIn } from './lib/auth';

const { user, userData } = await signIn('user@example.com', 'password123');
```

### Sign Out
```typescript
import { logOut } from './lib/auth';

await logOut();
```

### Reset Password
```typescript
import { resetPassword } from './lib/auth';

await resetPassword('user@example.com');
// User will receive an email with reset link
```

### Access Current User in Components
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please login</div>;
  
  return (
    <div>
      <h1>Welcome, {userData?.name}</h1>
      <p>Email: {currentUser.email}</p>
      <p>Role: {userData?.role}</p>
    </div>
  );
}
```

## 📊 User Data Structure

```typescript
interface User {
  uid: string;              // Unique user ID from Firebase Auth
  name: string;             // Full name
  email: string;            // Email address
  phone?: string;           // Optional phone number
  college_name?: string;    // Optional college name
  address?: string;         // Optional address
  role?: 'admin' | 'student'; // User role
  createdAt: string;        // Account creation timestamp
  updatedAt: string;        // Last update timestamp
}
```

## 🔒 Security Setup (Production)

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read all users (optional)
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Firebase Authentication Settings
```bash
1. Go to Authentication > Settings
2. Add authorized domains (e.g., your-domain.com)
3. Enable email enumeration protection
4. Set password policy (optional)
```

## 🧪 Testing Accounts

To create a test admin account, use the SignupForm component:

```typescript
// In a temporary route or page
import SignupForm from './components/auth/SignupForm';

// Render this component to create admin accounts
<SignupForm />

// After creating admin account, remove this route
```

## 🐛 Common Issues

### "Firebase: Error (auth/operation-not-allowed)"
**Solution**: Enable Email/Password authentication in Firebase Console

### "Firebase: Missing or insufficient permissions"
**Solution**: Update Firestore rules to allow authenticated users to read/write

### "Auth state not updating"
**Solution**: Make sure AuthProvider wraps your App component in main.tsx

### "User data not loading"
**Solution**: Check that Firestore is enabled and user document was created

## 📱 Features Included

✅ Email/Password Sign Up  
✅ Email/Password Sign In  
✅ Sign Out  
✅ Password Reset  
✅ User Profile Storage in Firestore  
✅ Auth State Management with React Context  
✅ Loading States  
✅ Error Handling  
✅ User Role Support (admin/student)  
✅ Optional User Fields (phone, college, address)  

## 🎯 Next Steps

1. **Email Verification**: Add email verification for new accounts
2. **Social Auth**: Add Google/Facebook authentication
3. **Profile Editing**: Create user profile page
4. **Role-Based Access**: Implement admin-only routes
5. **Account Deletion**: Add account deletion feature
6. **Two-Factor Auth**: Add 2FA for enhanced security

## 📚 Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration in `src/lib/firebase.ts`
3. Ensure Firebase services are enabled in console
4. Check that packages are installed: `npm list firebase`
