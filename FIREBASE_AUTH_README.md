# Firebase Authentication Setup

This document provides information about the Firebase Authentication implementation in the Exam System.

## Firebase Configuration

The Firebase project is configured with the following details:
- **Project ID**: omni-exam-system
- **Auth Domain**: omni-exam-system.firebaseapp.com
- **Storage Bucket**: omni-exam-system.firebasestorage.app

## Features Implemented

### 1. Email/Password Authentication
- User sign up with email and password
- User sign in with email and password
- Sign out functionality
- Password reset via email

### 2. User Data Storage
User profiles are stored in Firestore with the following fields:
```typescript
interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  role?: 'admin' | 'student';
  createdAt: string;
  updatedAt: string;
}
```

### 3. Auth Context
The app uses React Context to manage authentication state globally:
- `currentUser`: Firebase User object
- `userData`: User profile data from Firestore
- `loading`: Loading state during auth initialization
- `refreshUserData()`: Function to refresh user data from Firestore

## File Structure

```
src/
├── lib/
│   ├── firebase.ts          # Firebase initialization
│   └── auth.ts              # Authentication functions
├── contexts/
│   └── AuthContext.tsx      # Auth context provider
├── components/
│   └── auth/
│       └── Login.tsx        # Login/Signup component
└── types/
    └── index.ts             # User type definition
```

## Usage

### Sign Up
```typescript
import { signUp } from './lib/auth';

await signUp(email, password, {
  name: 'John Doe',
  phone: '+1234567890',
  college_name: 'XYZ College',
  address: '123 Main St',
  role: 'student'
});
```

### Sign In
```typescript
import { signIn } from './lib/auth';

const { user, userData } = await signIn(email, password);
```

### Sign Out
```typescript
import { logOut } from './lib/auth';

await logOut();
```

### Using Auth Context
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Welcome, {userData?.name}</p>
      <p>Email: {currentUser?.email}</p>
    </div>
  );
}
```

## Firebase Console Setup Required

To fully enable authentication, you need to:

1. **Enable Email/Password Authentication**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable "Email/Password" provider

2. **Set up Firestore Database**:
   - Go to Firebase Console > Firestore Database
   - Create database (start in test mode for development)
   - Create a `users` collection

3. **Configure Firestore Rules** (for production):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Configure Email Templates** (optional):
   - Go to Firebase Console > Authentication > Templates
   - Customize password reset email template
   - Customize email verification template

## Security Notes

⚠️ **Important**: The Firebase API key in the code is safe to expose in client-side code. However, you should:
- Set up proper Firestore security rules
- Enable App Check for production
- Configure authorized domains in Firebase Console

## Environment Variables (Optional)

For better security practices, you can move Firebase config to environment variables:

Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then update `src/lib/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## Testing

To test the authentication:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the app
3. Click "Sign Up" to create a new account
4. Fill in the required fields (name, email, password)
5. Optional: Add phone, college name, and address
6. Click "Sign Up" to create your account
7. You'll be automatically logged in

## Troubleshooting

### "Firebase: Error (auth/email-already-in-use)"
- This email is already registered. Use "Login" instead or try a different email.

### "Firebase: Error (auth/weak-password)"
- Password must be at least 6 characters long.

### "Firebase: Error (auth/invalid-email)"
- Check that the email format is valid.

### "Firebase: Error (auth/user-not-found)"
- No user exists with this email. Use "Sign Up" to create an account.

### "Firebase: Error (auth/wrong-password)"
- The password is incorrect. Try again or use "Forgot Password".

## Next Steps

- Implement email verification
- Add social authentication (Google, Facebook, etc.)
- Implement role-based access control (RBAC)
- Add user profile editing functionality
- Implement account deletion
