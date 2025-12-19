import { useState, useEffect } from 'react';
import { analyticsApi, attemptApi } from '../../lib/api';
import { EnhancedAnalyticsService } from '../../lib/enhancedAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  CheckCircle, 
  BarChart3,
  Award,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StudentAnalyticsDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Student analytics
  const [userPerformance, setUserPerformance] = useState<any>(null);
  const [topicPerformance, setTopicPerformance] = useState<any[]>([]);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [userData]);

  const loadAnalytics = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading student analytics for user:', userData.id);

      // Get enhanced user performance data
      const dashboardData = await EnhancedAnalyticsService.getDashboardData(userData.id, false);
      
      console.log('Student dashboard data:', dashboardData);

      // Set user performance data
      if (dashboardData.userPerformance) {
        setUserPerformance(dashboardData.userPerformance);
      }
      // Try to load user-specific topic analytics
      try {
        const topics = await analyticsApi.getUserTopicPerformance(userData.id);
        setTopicPerformance(Array.isArray(topics) ? topics : []);
      } catch (err: any) {
        console.warn('Could not load user topic performance:', err);
        setTopicPerformance([]);
      }

      // Load all user's attempts directly from API
      try {
        const attempts = await attemptApi.getMyAttempts();
        // Filter only submitted/expired attempts
        const completedAttempts = attempts.filter(
          (attempt) => attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED'
        );
        setMyAttempts(completedAttempts);
        console.log('Loaded attempts:', completedAttempts);
      } catch (err: any) {
        console.warn('Could not load user attempts:', err);
        setMyAttempts([]);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading student analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={loadAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Performance</h2>
          <p className="text-gray-600 mt-1">
            Track your exam performance and progress over time
          </p>
        </div>
      </div>

      {/* Performance Overview */}
      {userPerformance && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {userPerformance.totalExamsTaken}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userPerformance.completedExams} completed
                  </p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(userPerformance.averageScore ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userPerformance.averageScore >= 80 ? 'Excellent!' : 
                     userPerformance.averageScore >= 60 ? 'Good work!' : 'Keep improving!'}
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(userPerformance.completionRate ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userPerformance.completionRate >= 90 ? 'Consistent!' : 'Room for improvement'}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Performance Trend */}
          {userPerformance.improvementTrend && Array.isArray(userPerformance.improvementTrend) && userPerformance.improvementTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Performance Trend</h4>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Monthly Progress</span>
                </div>
              </div>

              <div className="space-y-3">
                {userPerformance.improvementTrend.map((item: any, index: number) => (
                  <div key={item?.period ?? index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-20 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.period}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${Math.max(item.averageScore ?? 0, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {(item.averageScore ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-20 text-right">
                      {item.attemptsCount} {item.attemptsCount === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Exam History */}
          {myAttempts && myAttempts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Exam History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myAttempts.map((attempt: any, idx: number) => {
                      const scorePercentage = attempt.total_questions > 0 
                        ? ((attempt.score || 0) / attempt.total_questions) * 100 
                        : 0;
                      const timeTaken = attempt.time_taken_seconds 
                        ? Math.floor(attempt.time_taken_seconds / 60) 
                        : 0;
                      
                      return (
                        <tr key={attempt?.id ?? `attempt-${idx}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {attempt.exam?.title || 'Unknown Exam'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${
                              scorePercentage >= 80 ? 'text-green-600' :
                              scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {scorePercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.score ?? 0}/{attempt.total_questions ?? 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {timeTaken} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              attempt.status === 'SUBMITTED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {attempt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => navigate(`/exam-review/${attempt.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                            >
                              <Eye className="w-3 h-3" />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Performance Tips</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  {userPerformance.averageScore < 60 && (
                    <p>• Focus on understanding concepts better. Consider reviewing topics where you scored lower.</p>
                  )}
                  {userPerformance.completionRate < 90 && (
                    <p>• Try to complete all started exams to improve your completion rate.</p>
                  )}
                  {userPerformance.averageTimeSpent > 45 && (
                    <p>• Practice time management. Try to answer questions more efficiently.</p>
                  )}
                  {userPerformance.averageScore >= 80 && (
                    <p>• Great job! Keep up the excellent work and maintain consistency.</p>
                  )}
                  <p>• Regular practice helps improve both speed and accuracy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!userPerformance && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data Yet</h3>
          <p className="text-gray-600 mb-4">
            Start taking exams to see your performance analytics here.
          </p>
          <button 
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}