# Project Structure - Firebase Authentication

## 📁 Updated File Structure

```
for_pervej_exam_system/
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ExamBuilder.tsx
│   │   │   ├── ExamManager.tsx
│   │   │   ├── QuestionEditForm.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── QuestionSetManager.tsx
│   │   │   └── UserProfile.tsx          ⭐ NEW - User profile component
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.tsx                 ✏️ MODIFIED - Firebase auth
│   │   │   └── SignupForm.tsx            ⭐ NEW - Standalone signup
│   │   │
│   │   ├── student/
│   │   │   ├── ExamInterface.tsx
│   │   │   ├── IncorrectQuestionReview.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   └── TopicHeader.tsx
│   │   │
│   │   ├── LaTeX.tsx
│   │   ├── TextWithLaTeX.tsx
│   │   ├── Timer.tsx
│   │   └── VideoPlayer.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx               ⭐ NEW - Auth state management
│   │
│   ├── lib/
│   │   ├── auth.ts                       ⭐ NEW - Auth functions
│   │   ├── firebase.ts                   ⭐ NEW - Firebase config
│   │   ├── localStorage.ts
│   │   └── supabase.ts
│   │
│   ├── types/
│   │   └── index.ts                      ✏️ MODIFIED - Added User type
│   │
│   ├── App.tsx                           ✏️ MODIFIED - Auth integration
│   ├── main.tsx                          ✏️ MODIFIED - AuthProvider wrapper
│   ├── index.css
│   └── vite-env.d.ts
│
├── public/
│
├── Documentation/
│   ├── FIREBASE_AUTH_README.md           ⭐ NEW - Complete guide
│   ├── FIREBASE_QUICK_REFERENCE.md       ⭐ NEW - Quick reference
│   ├── IMPLEMENTATION_SUMMARY.md         ⭐ NEW - Implementation details
│   └── SETUP_CHECKLIST.md                ⭐ NEW - Setup checklist
│
├── .gitignore
├── DATABASE_SCHEMA.md
├── eslint.config.js
├── firebase.json
├── index.html
├── LOCAL_SETUP.md
├── package.json                          ✏️ MODIFIED - Added firebase package
├── postcss.config.js
├── QUICK_START.md
├── README.md
├── src_full_copy.md
├── SRS.md
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 🆕 New Files Added (7 files)

### Core Authentication
1. **`src/lib/firebase.ts`** - Firebase initialization
2. **`src/lib/auth.ts`** - Authentication service functions
3. **`src/contexts/AuthContext.tsx`** - React Context for auth

### UI Components
4. **`src/components/auth/SignupForm.tsx`** - Standalone signup form
5. **`src/components/admin/UserProfile.tsx`** - User profile page

### Documentation
6. **`FIREBASE_AUTH_README.md`** - Comprehensive setup guide
7. **`FIREBASE_QUICK_REFERENCE.md`** - Quick reference guide
8. **`IMPLEMENTATION_SUMMARY.md`** - Implementation overview
9. **`SETUP_CHECKLIST.md`** - Pre-deployment checklist

---

## ✏️ Modified Files (4 files)

1. **`src/main.tsx`**
   - Wrapped App with AuthProvider

2. **`src/App.tsx`**
   - Added auth check
   - Shows Login when not authenticated
   - Displays user info in header
   - Updated logout function

3. **`src/components/auth/Login.tsx`**
   - Complete rewrite using Firebase Auth
   - Multi-mode: Login / Signup / Password Reset
   - Form validation

4. **`src/types/index.ts`**
   - Added User interface

5. **`package.json`**
   - Added firebase dependency

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Start                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AuthProvider (AuthContext.tsx)                  │
│  - Listens to Firebase auth state changes                   │
│  - Loads user data from Firestore                           │
│  - Provides: currentUser, userData, loading                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       App.tsx                                │
│  - Checks if currentUser exists                             │
│  - If no → Show Login component                             │
│  - If yes → Show app content                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐             ┌─────────────────────────┐
│  Login.tsx      │             │   App Content           │
│  - Sign Up      │             │   - Admin Dashboard     │
│  - Sign In      │             │   - Question Sets       │
│  - Reset Pass   │             │   - Exams               │
└────────┬────────┘             │   - Profile             │
         │                      └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Authentication                         │
│  ┌──────────────┐        ┌─────────────────┐              │
│  │   Firebase   │  ◄───► │   Firestore     │              │
│  │     Auth     │        │  users/{uid}    │              │
│  └──────────────┘        └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Sign Up Flow
```
User fills signup form
         │
         ▼
signUp() function called
         │
         ▼
Firebase creates auth account
         │
         ▼
User document created in Firestore
         │
         ▼
AuthContext updates with user data
         │
         ▼
App shows authenticated content
```

### Sign In Flow
```
User enters credentials
         │
         ▼
signIn() function called
         │
         ▼
Firebase authenticates user
         │
         ▼
User data fetched from Firestore
         │
         ▼
AuthContext updates with user data
         │
         ▼
App shows authenticated content
```

---

## 📊 Component Hierarchy

```
main.tsx
└── <AuthProvider>
    └── <App>
        ├── Not Authenticated
        │   └── <Login />
        │       ├── Login Mode
        │       ├── Signup Mode
        │       └── Reset Password Mode
        │
        └── Authenticated
            ├── Header (with user info)
            ├── Navigation
            └── Content
                ├── <AdminDashboard />
                ├── <QuestionSetManager />
                ├── <ExamBuilder />
                ├── <ExamManager />
                ├── <UserProfile />        ⭐ NEW
                ├── <ExamInterface />
                └── <ResultsPage />
```

---

## 🗄️ Firestore Database Structure

```
firestore/
└── users/
    └── {uid}/
        ├── uid: string
        ├── name: string
        ├── email: string
        ├── phone?: string
        ├── college_name?: string
        ├── address?: string
        ├── role: 'admin' | 'student'
        ├── createdAt: timestamp
        └── updatedAt: timestamp
```

---

## 🎯 Key Integration Points

### 1. Authentication Check (App.tsx)
```typescript
if (!currentUser) {
  return <Login />;
}
```

### 2. User Info Display (App.tsx Header)
```typescript
{userData && (
  <div>
    <User className="w-4 h-4" />
    <span>{userData.name}</span>
  </div>
)}
```

### 3. Using Auth in Components
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, userData } = useAuth();
  // Use user data...
}
```

---

## 🔗 Dependencies

### New Package Added
```json
{
  "dependencies": {
    "firebase": "^latest"
  }
}
```

### Firebase Services Used
- **Firebase Authentication** - User auth management
- **Cloud Firestore** - User profile storage

---