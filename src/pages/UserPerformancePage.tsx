import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsApi } from '../lib/api';
import { EnhancedAnalyticsService } from '../lib/enhancedAnalytics';
import { 
  ArrowLeft, 
  User, 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Calendar,

  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Use the API types directly
interface UserPerformance {
  userId: string;
  userName: string;
  totalExamsTaken: number;
  completedExams: number;
  averageScore: number | null;
  completionRate: number;
  averageTimeSpent: number;
  topicWisePerformance: Array<{
    topicName: string;
    attempts: number;
    averageScore: number;
    bestScore: number;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    examId: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    scorePercentage: number;
    timeTaken: number;
    completedAt: string | null;
    status: string;
  }>;
  improvementTrend: Array<{
    period: string;
    averageScore: number;
    attemptsCount: number;
  }>;
}

interface ImprovementTrend {
  period: string;
  averageScore: number;
  attemptsCount: number;
}

export function UserPerformancePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPerformance, setUserPerformance] = useState<UserPerformance | null>(null);
  const [examHistory, setExamHistory] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserPerformance();
    }
  }, [userId]);

  const loadUserPerformance = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get comprehensive performance data
      const [performance, history] = await Promise.allSettled([
        EnhancedAnalyticsService.getEnhancedUserPerformance(userId),
        analyticsApi.getUserHistory(userId, { take: 20 }).catch(() => [])
      ]);

      if (performance.status === 'fulfilled') {
        setUserPerformance(performance.value as UserPerformance);
      } else {
        throw new Error('Failed to load user performance');
      }

      if (history.status === 'fulfilled') {
        setExamHistory(history.value);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load user performance data');
      console.error('Error loading user performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number | null) => {
    if (!score) return 'text-gray-600 bg-gray-100';
    const scoreValue = typeof score === 'number' ? score : 0;
    if (scoreValue >= 80) return 'text-green-600 bg-green-100';
    if (scoreValue >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'EXPIRED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user performance...</p>
        </div>
      </div>
    );
  }

  if (error || !userPerformance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Performance</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load user performance data'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  {userPerformance.userName} - Performance Analytics
                </h1>
                <p className="text-gray-600">Comprehensive performance overview and statistics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{userPerformance.totalExamsTaken}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(userPerformance.averageScore).split(' ')[0]}`}>
                  {userPerformance.averageScore?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{userPerformance.completionRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">{userPerformance.averageTimeSpent}m</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Exam Attempts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Exam Attempts</h3>
            </div>
            
            {userPerformance.recentAttempts.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No exam attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userPerformance.recentAttempts.slice(0, 10).map((attempt) => (
                  <div key={attempt.attemptId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{attempt.examTitle}</h4>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(attempt.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(attempt.scorePercentage)}`}>
                          {attempt.scorePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{attempt.score}/{attempt.totalQuestions} correct</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Topic Performance</h3>
            </div>
            
            {userPerformance.topicWisePerformance.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No topic performance data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userPerformance.topicWisePerformance.map((topic, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{topic.topicName}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(topic.averageScore)}`}>
                        {topic.averageScore?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Avg: {topic.averageScore?.toFixed(1) || '0.0'}% | Best: {topic.bestScore?.toFixed(1) || '0.0'}%</span>
                      <span>{topic.attempts} attempts</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${topic.averageScore || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Improvement Trend */}
        {userPerformance.improvementTrend.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {userPerformance.improvementTrend.map((period) => (
                <div key={period.period} className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{period.period}</p>
                  <p className="text-xl font-bold text-gray-900">{period.averageScore.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{period.attemptsCount} attempts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Exam History */}
        {examHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Complete Exam History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {examHistory.map((exam) => (
                    <tr key={exam.attemptId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{exam.examTitle}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(exam.scorePercentage)}`}>
                          {exam.scorePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {exam.timeTaken}m
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exam.status)}
                          <span className="text-sm text-gray-600">{exam.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(exam.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}