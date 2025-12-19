import { useState, useEffect } from 'react';
import { attemptApi } from '../../lib/api';
import { 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Clock, 
  Award,
  BarChart3,
  Home,
  FileText
} from 'lucide-react';

interface StudentResultsPageProps {
  attemptId: string;
  onGoHome?: () => void;
}

interface AttemptResult {
  id: string;
  exam: {
    id: string;
    title: string;
    time_limit_seconds: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  started_at: string;
  submitted_at: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  topic_performance?: Array<{
    topic_id?: string;
    topic_name: string;
    total_questions: number;
    correct_answers: number;
    percentage: number;
  }>;
  answers?: Array<{
    question_id: string;
    selected_option_index: number | null;
    is_correct: boolean;
    answered_at: string;
  }>;
}

export function StudentResultsPage({ attemptId, onGoHome }: StudentResultsPageProps) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attemptApi.getById(attemptId);
        setResult(data as AttemptResult);
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Results...</h2>
          <p className="text-gray-600">Please wait while we calculate your score.</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load results'}</p>
          <button
            onClick={onGoHome || (() => window.location.href = '/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = result.total_questions > 0 
    ? (result.correct_answers / result.total_questions) * 100 
    : 0;

  const timeTaken = result.submitted_at && result.started_at
    ? Math.floor((new Date(result.submitted_at).getTime() - new Date(result.started_at).getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getGrade = (percentage: number): { grade: string; color: string; message: string } => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500', message: 'Good Job!' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500', message: 'Fair' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500', message: 'Needs Improvement' };
    return { grade: 'F', color: 'text-red-500', message: 'Keep Trying!' };
  };

  const gradeInfo = getGrade(scorePercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6 text-center">
          <div className="mb-4">
            <Award className={`w-20 h-20 mx-auto ${gradeInfo.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Completed!</h1>
          <p className="text-lg text-gray-600 mb-4">{result.exam.title}</p>
          
          {/* Score Display */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white mb-4">
            <div className="text-5xl font-bold mb-2">{scorePercentage.toFixed(1)}%</div>
            <div className="text-xl mb-2">
              {result.correct_answers} / {result.total_questions} Correct
            </div>
            <div className={`text-2xl font-semibold ${gradeInfo.color} bg-white rounded-lg px-4 py-2 inline-block`}>
              Grade: {gradeInfo.grade}
            </div>
            <div className="text-sm mt-2 opacity-90">{gradeInfo.message}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Correct Answers</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{result.correct_answers}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Incorrect Answers</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {result.total_questions - result.correct_answers}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Time Taken</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatTime(timeTaken)}</p>
          </div>
        </div>

        {/* Topic Performance */}
        {result.topic_performance && result.topic_performance.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Topic-wise Performance</h2>
            </div>

            <div className="space-y-4">
              {result.topic_performance.map((topic, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{topic.topic_name}</h3>
                    <span className={`text-sm font-semibold ${
                      topic.percentage >= 80 ? 'text-green-600' :
                      topic.percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {topic.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          topic.percentage >= 80 ? 'bg-green-500' :
                          topic.percentage >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {topic.correct_answers} / {topic.total_questions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Performance Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Student</p>
              <p className="text-lg font-semibold text-gray-900">{result.user.name}</p>
              <p className="text-sm text-gray-500">{result.user.email}</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Submission Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(result.submitted_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGoHome || (() => window.location.href = '/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <FileText className="w-5 h-5" />
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
