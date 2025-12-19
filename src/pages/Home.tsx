import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Settings, GraduationCap } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-6">
        <GraduationCap className="w-16 h-16 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ExamCraft</h2>
      <p className="text-lg text-gray-600 mb-12">Choose an option to get started</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div 
          onClick={() => navigate('/admin/question-sets')}
          className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
        >
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Question Set</h3>
            <p className="text-gray-600 text-center">
              Create and manage question sets with multiple questions organized by topics
            </p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/create-exam')}
          className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200"
        >
          <div className="flex flex-col items-center">
            <div className="p-4 bg-green-100 rounded-full mb-4">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Exam</h3>
            <p className="text-gray-600 text-center">
              Build exams by selecting question sets, set time limits, and generate shareable links
            </p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/manage-exams')}
          className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200"
        >
          <div className="flex flex-col items-center">
            <div className="p-4 bg-purple-100 rounded-full mb-4">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Exams</h3>
            <p className="text-gray-600 text-center">
              View all created exams, manage exam links, and delete exams when needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
