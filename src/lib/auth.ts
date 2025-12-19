import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// User data interface for Firestore (aligns with backend User model)
export interface UserData {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
  // For backward compatibility
  uid?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  userData: Omit<UserData, 'id' | 'firebase_uid' | 'email' | 'created_at' | 'is_enrolled'>
): Promise<{ user: FirebaseUser; userData: UserData }> => {
  let firebaseUser: FirebaseUser | null = null;
  
  try {
    // Step 1: Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    firebaseUser = userCredential.user;

    // Log complete Firebase Auth user object after sign up
    console.log('\n=== SUCCESSFUL SIGN UP ===(auth.ts)');
    console.log('Full Firebase User Object:', firebaseUser);
    console.log('User Credential:', userCredential);
    console.log('\nNew User Properties:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified,
      metadata: firebaseUser.metadata,
      providerData: firebaseUser.providerData,
    });

    // Step 2: Update display name in Firebase
    await updateProfile(firebaseUser, {
      displayName: userData.name,
    });

    // Step 3: Get ID token
    const idToken = await firebaseUser.getIdToken();

    // Step 4: Register user with backend API
    console.log('Registering user with backend API...');
    const API_BASE_URL = import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        phone: userData.phone,
        college_name: userData.college_name,
        address: userData.address,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Backend registration failed');
    }

    const backendResponse = await response.json();
    const userDataFromBackend = backendResponse.data;

    console.log('✅ Backend registration successful:', userDataFromBackend);

    // Step 5: Store in Firestore as fallback (optional)
    const userDataToStore: UserData = {
      id: userDataFromBackend.id || firebaseUser.uid,
      firebase_uid: firebaseUser.uid,
      name: userData.name,
      email: firebaseUser.email!,
      phone: userData.phone,
      college_name: userData.college_name,
      address: userData.address,
      is_enrolled: userDataFromBackend.is_enrolled || true,
      role: userDataFromBackend.role || userData.role || 'STUDENT',
      created_at: userDataFromBackend.created_at || new Date().toISOString(),
      // Backward compatibility fields
      uid: firebaseUser.uid,
      createdAt: userDataFromBackend.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userDataToStore);

    console.log('\nUser Data Stored in Firestore:', userDataToStore);
    console.log('========================\n');

    return { user: firebaseUser, userData: userDataToStore };
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    
    // If Firebase user was created but backend registration failed, delete Firebase user
    if (firebaseUser && auth.currentUser) {
      console.log('⚠️ Cleaning up Firebase user due to registration failure...');
      try {
        await auth.currentUser.delete();
        console.log('✅ Firebase user deleted successfully');
      } catch (deleteError) {
        console.error('❌ Failed to delete Firebase user:', deleteError);
      }
    }
    
    throw new Error(error.message || 'Failed to sign up');
  }
};

// Sign in with email and password
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: FirebaseUser; userData: UserData | null }> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Log complete Firebase Auth user object after sign in
    console.log('\n=== SUCCESSFUL SIGN IN ===(auth.ts)');
    console.log('Full Firebase User Object:', user);
    console.log('User Credential:', userCredential);
    console.log('\nExtracted User Properties:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      isAnonymous: user.isAnonymous,
      providerId: user.providerId,
      metadata: user.metadata,
      providerData: user.providerData,
      refreshToken: user.refreshToken ? 'Present (hidden for security)' : 'None',
    });

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? (userDoc.data() as UserData) : null;

    console.log('\nFirestore User Data:', userData);
    console.log('========================\n');

    return { user, userData };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as UserData) : null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get user data');
  }
};

// Update user data in Firestore
export const updateUserData = async (
  uid: string,
  data: Partial<Omit<UserData, 'id' | 'firebase_uid' | 'email' | 'created_at'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user data');
  }
};
