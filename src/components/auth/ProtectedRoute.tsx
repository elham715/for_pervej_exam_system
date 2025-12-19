import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'STUDENT';
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo = '/' }: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && userData?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
              {requiredRole === 'ADMIN' && (
                <span className="block mt-2 text-sm">
                  <Shield className="inline w-4 h-4 mr-1" />
                  This page requires administrator privileges.
                </span>
              )}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Current role: <span className="font-semibold">{userData?.role || 'Unknown'}</span>
              </p>
              <p className="text-sm text-gray-500">
                Required role: <span className="font-semibold">{requiredRole}</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = redirectTo}
              className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
