import { useState, useEffect } from 'react';
import { Question, Exam, StudentResult, Topic, QuestionSet, ExamUIState } from './types';
import { QuestionSetManager } from './components/admin/QuestionSetManager';
import { ExamBuilder } from './components/admin/ExamBuilder';
import { ExamManager } from './components/admin/ExamManager';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ExamInterface } from './components/student/ExamInterface';
import { ResultsPage } from './components/student/ResultsPage';
import Login from './components/auth/Login';
import UserMenu from './components/common/UserMenu';
import UserProfile from './components/admin/UserProfile';
import { getQuestions, getQuestionSets, getTopics, getExams, getExam, deleteExam, createStudentResult, getStudentResults } from './lib/localStorage';
import { v4 as uuidv4 } from 'uuid';
import { 
  BookOpen, 
  BarChart3, 
  User,
  Mail,
  Clock,
  GraduationCap,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

type View = 'home' | 'question-sets' | 'create-exam' | 'manage-exams' | 'dashboard' | 'profile' | 'student-info' | 'exam' | 'results';

const getInitialView = (): View => {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('exam');
  if (examId) {
    return 'student-info';
  }
  return 'home';
};

function App() {
  const { currentUser, userData, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(getInitialView());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamUIState | null>(null);
  const [currentResult, setCurrentResult] = useState<StudentResult | null>(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', email: '' });

  // Load data only when needed (lazy loading)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('exam');
    if (examId) {
      loadExamFromLink(examId);
    }
    // Don't load all data on homepage - load it when switching to admin views
  }, []);

  const loadData = async () => {
    // Only load data when actually needed
    if (questions.length > 0 && exams.length > 0) {
      return; // Data already loaded
    }
    
    try {
      const [questionsData, questionSetsData, topicsData, examsData, studentResultsData] = await Promise.all([
        getQuestions(),
        getQuestionSets(),
        getTopics(),
        getExams(),
        getStudentResults(),
      ]);
      setQuestions(questionsData || []);
      setQuestionSets(questionSetsData || []);
      setTopics(topicsData || []);
      setExams(examsData || []);
      setResults(studentResultsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadExamFromLink = async (examId: string) => {
    try {
      const exam = await getExam(examId);
      if (exam) {
        const examWithQuestions = {
          ...exam,
          questions: exam.questions || []
        };
        
        setQuestions(examWithQuestions.questions);

        setCurrentView('student-info');
        (window as any).tempExamData = examWithQuestions;
      } else {
        alert('Exam not found');
        setCurrentView('home');
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      alert('Error loading exam');
      setCurrentView('home');
    }
  };

  const handleStartExam = () => {
    if (!studentInfo.name.trim() || !studentInfo.email.trim()) {
      alert('Please fill in your name and email');
      return;
    }

    const examData = (window as any).tempExamData;
    if (!examData) {
      alert('Exam data not found');
      return;
    }

    setCurrentExam({
      exam: examData,
      student_name: studentInfo.name,
      student_email: studentInfo.email,
      start_time: Date.now()
    });
    setCurrentView('exam');
  };

  const handleSubmitExam = async (resultData: Omit<StudentResult, 'id' | 'completed_at' | 'time_taken_seconds'>) => {
    console.log('handleSubmitExam - resultData:', resultData);
    try {
      const endTime = Date.now();
      const startTime = currentExam ? currentExam.start_time : Date.now();
      const timeTakenInSeconds = Math.round((endTime - startTime) / 1000);

      const result: StudentResult = {
        id: uuidv4(),
        ...resultData,
        completed_at: new Date(endTime).toISOString(),
        time_taken_seconds: timeTakenInSeconds,
      };

      await createStudentResult(result);

      console.log('handleSubmitExam - setting currentResult:', result);
      setCurrentResult(result);
      setResults(prev => [result, ...prev]);
      setCurrentView('results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam results');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId);
      setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error; 
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('exam');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!currentUser) {
    return <Login />;
  }

  if (examId) {
    if (currentView === 'student-info') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Ready for Your Exam?</h1>
              <p className="text-gray-600 mt-2">Please enter your information to begin</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => {e.preventDefault(); handleStartExam();}}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={studentInfo.email}
                  onChange={(e) => setStudentInfo(prev => ({...prev, email: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Start Exam
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (currentView === 'exam' && currentExam) {
      return (
        <ExamInterface
          exam={currentExam.exam}
          studentName={currentExam.student_name}
          studentEmail={currentExam.student_email}
          onSubmit={handleSubmitExam}
        />
      );
    }

    if (currentView === 'results' && currentResult && currentExam) {
      return (
        <ResultsPage
          result={currentResult}
          questions={currentExam.exam.questions || []}
          topics={topics}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">ExamCraft Admin</h1>
              </button>
            </div>
            
            <nav className="flex items-center space-x-4">
              {currentView !== 'home' && (
                <button
                  onClick={() => setCurrentView('home')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Home
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  loadData(); // Load data when switching to dashboard
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <UserMenu onNavigateToProfile={() => setCurrentView('profile')} />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8">
        {currentView === 'home' && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ExamCraft</h2>
            <p className="text-lg text-gray-600 mb-12">Choose an option to get started</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div 
                onClick={() => {
                  setCurrentView('question-sets');
                  loadData(); // Load data when needed
                }}
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
                onClick={() => {
                  setCurrentView('create-exam');
                  loadData(); // Load data when needed
                }}
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
                onClick={() => {
                  setCurrentView('manage-exams');
                  loadData(); // Load data when needed
                }}
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
        )}

        {currentView === 'question-sets' && (
          <QuestionSetManager
            questionSets={questionSets}
            questions={questions}
            topics={topics}
            reloadData={loadData}
          />
        )}

        {currentView === 'create-exam' && (
          <ExamBuilder
            questionSets={questionSets}
            questions={questions}
          />
        )}

        {currentView === 'manage-exams' && (
          <ExamManager
            exams={exams}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {currentView === 'dashboard' && (
          <AdminDashboard
            results={results}
            questions={questions}
          />
        )}

        {currentView === 'profile' && <UserProfile />}
      </main>
    </div>
  );
}

export default App;
