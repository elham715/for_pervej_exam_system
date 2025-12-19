import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/auth';
import { userApi } from '../lib/api';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDataFromAPI = useCallback(async (user: FirebaseUser): Promise<UserData | null> => {
    try {
      const apiData = await userApi.getCurrentUser();
      return {
        id: apiData.id,
        firebase_uid: apiData.firebase_uid,
        name: apiData.name,
        email: apiData.email,
        phone: apiData.phone,
        college_name: apiData.college_name,
        address: apiData.address,
        is_enrolled: apiData.is_enrolled,
        role: apiData.role,
        created_at: apiData.created_at,
        uid: apiData.firebase_uid,
        createdAt: apiData.created_at,
      };
    } catch (error) {
      // Fallback to Firestore if API fails
      try {
        return await getUserData(user.uid);
      } catch (firestoreError) {
        console.error('Error fetching user data:', firestoreError);
        return null;
      }
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (currentUser) {
      const data = await fetchUserDataFromAPI(currentUser);
      setUserData(data);
    }
  }, [currentUser, fetchUserDataFromAPI]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Log Firebase JWT token in development environment
        if (import.meta.env.DEV) {
          try {
            const token = await user.getIdToken();
            console.log('🔑 Firebase JWT Token:', token);
            console.log('👤 User:', user.email);
          } catch (error) {
            console.error('Error getting token:', error);
          }
        }

        const data = await fetchUserDataFromAPI(user);
        setUserData(data);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserDataFromAPI]);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
