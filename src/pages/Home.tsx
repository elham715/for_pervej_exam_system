import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Settings, GraduationCap, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const isAdmin = userData?.role === 'ADMIN';

  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-6">
        <GraduationCap className="w-16 h-16 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to ExamCraft
      </h2>
      <p className="text-lg text-gray-600 mb-2">
        {isAdmin ? 'Administrator Dashboard' : 'Student Portal'}
      </p>
      <p className="text-sm text-gray-500 mb-12">
        Logged in as: <span className="font-semibold">{userData?.name || userData?.email}</span>
      </p>
      
      {/* Admin View */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div 
            onClick={() => navigate('/admin/dashboard')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-indigo-100 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600 text-center">
                View analytics, manage users, topics, questions, and exams
              </p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/question-sets')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Question Sets</h3>
              <p className="text-gray-600 text-center">
                Create and manage question sets with multiple questions organized by topics
              </p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/manage-exams')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Exams</h3>
              <p className="text-gray-600 text-center">
                Create, edit, and manage all exams with shareable links
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Student View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div 
            onClick={() => navigate('/admin/dashboard')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Performance</h3>
              <p className="text-gray-600 text-center">
                View your exam history, scores, and performance analytics
              </p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/profile')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-purple-100 rounded-full mb-4">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Profile</h3>
              <p className="text-gray-600 text-center">
                Update your personal information and account settings
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-100">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Need an exam link?</h4>
                <p className="text-sm text-gray-600">
                  Ask your instructor for the exam link. You can take exams directly by visiting the link they provide.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
