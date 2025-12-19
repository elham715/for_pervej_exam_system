import { useState, useEffect } from 'react';
import { examApi, attemptApi } from '../../lib/api';
import { 
  Clock, 
  Calendar,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BookOpen,
  History,
  Award
} from 'lucide-react';

interface StudentDashboardProps {
  onStartExam: (examId: string, examLink: string) => void;
  onViewResults: (attemptId: string) => void;
}

interface Exam {
  id: string;
  title: string;
  time_limit_seconds: number;
  exam_link: string;
  created_at: string;
}

interface Attempt {
  id: string;
  exam?: {
    id: string;
    title: string;
  };
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  started_at: string;
  submitted_at?: string;
  score?: number;
}

export function StudentDashboard({ onStartExam, onViewResults }: StudentDashboardProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [examsData, attemptsData] = await Promise.all([
          examApi.getAll(),
          attemptApi.getMyAttempts(),
        ]);
        setExams(examsData);
        setAttempts(attemptsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins} minutes`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  // Calculate stats
  const completedAttempts = attempts.filter(a => a.status === 'SUBMITTED');
  const averageScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">View available exams and your attempt history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Available Exams</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{exams.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Completed Exams</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedAttempts.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'available'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Available Exams
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Attempt History
                </div>
              </button>
            </div>
          </div>

          {/* Available Exams Tab */}
          {activeTab === 'available' && (
            <div className="p-6">
              {exams.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No exams available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {exam.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(exam.time_limit_seconds)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(exam.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onStartExam(exam.id, exam.exam_link)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <PlayCircle className="w-5 h-5" />
                        Start Exam
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attempt History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              {attempts.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attempt history yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start taking exams to see your history here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {attempt.exam?.title || 'Unknown Exam'}
                        </h3>
                        {getStatusBadge(attempt.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Started</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(attempt.started_at).toLocaleString()}
                          </p>
                        </div>

                        {attempt.submitted_at && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Submitted</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(attempt.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {attempt.score !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Score</p>
                            <p className={`text-xl font-bold ${
                              attempt.score >= 80 ? 'text-green-600' :
                              attempt.score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {attempt.score.toFixed(1)}%
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {attempt.status.toLowerCase().replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      {attempt.status === 'SUBMITTED' && (
                        <button
                          onClick={() => onViewResults(attempt.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          <TrendingUp className="w-4 h-4" />
                          View Detailed Results
                        </button>
                      )}

                      {attempt.status === 'IN_PROGRESS' && attempt.exam && (
                        <button
                          onClick={() => onStartExam(attempt.exam!.id, '')}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Continue Exam
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
