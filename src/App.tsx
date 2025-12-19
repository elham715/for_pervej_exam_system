import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import UserMenu from './components/common/UserMenu';
import UserProfile from './components/admin/UserProfile';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HomePage } from './pages/Home';
import { ExamPage } from './pages/ExamPage';
import { GraduationCap, BarChart3 } from 'lucide-react';

function App() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading spinner while checking auth
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

  // Exam routes - authentication checked within components
  if (location.pathname.startsWith('/exam/')) {
    return (
      <Routes>
        <Route path="/exam/:examLink" element={<ExamPage />} />
        <Route path="/exam/:examLink/results/:attemptId" element={<div>Results Page</div>} />
      </Routes>
    );
  }

  // Require authentication for all other routes
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">ExamCraft</h1>
              </button>
            </div>
            
            <nav className="flex items-center space-x-4">
              {location.pathname !== '/' && (
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Home
                </button>
              )}
              <button
                onClick={() => navigate('/admin/dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <UserMenu onNavigateToProfile={() => navigate('/profile')} />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard results={[]} questions={[]} />} />
          <Route path="/admin/question-sets" element={<div>Question Sets Page (Coming Soon)</div>} />
          <Route path="/admin/create-exam" element={<div>Create Exam Page (Coming Soon)</div>} />
          <Route path="/admin/manage-exams" element={<div>Manage Exams Page (Coming Soon)</div>} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
