import { useState, useEffect } from 'react';

import { EnhancedAnalyticsService } from '../../lib/enhancedAnalytics';
import { topicApi, questionApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  FileText, 
  Award,
  Target
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Admin analytics
  const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
  const [topPerformingTopics, setTopPerformingTopics] = useState<any[]>([]);

  const [systemAnalyticsError, setSystemAnalyticsError] = useState<string | null>(null);
  const [topTopicsError, setTopTopicsError] = useState<string | null>(null);

  const isAdmin = userData?.role === 'ADMIN';

  useEffect(() => {
    loadAnalytics();
  }, [userData]);

  const loadAnalytics = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      setError(null);
      setSystemAnalyticsError(null);
      setTopTopicsError(null);

      console.log('Loading enhanced analytics for user:', userData.id, 'isAdmin:', isAdmin);

      // Only load admin analytics - no personal user data
      if (isAdmin) {
        const dashboardData = await EnhancedAnalyticsService.getDashboardData(userData.id, true);
        
        console.log('Admin dashboard data:', dashboardData);
        console.log('System analytics:', dashboardData.systemAnalytics);
        console.log('Top topics:', dashboardData.topPerformingTopics);
        console.log('Topics count:', dashboardData.systemAnalytics?.totalTopics);
        console.log('Questions count:', dashboardData.systemAnalytics?.totalQuestions);

        if (dashboardData.systemAnalytics) {
          let analytics = { ...dashboardData.systemAnalytics };
          
          // If topics count is 0, try to get the actual count from API
          if (!analytics.totalTopics || analytics.totalTopics === 0) {
            try {
              const topics = await topicApi.getAll({ include_count: true });
              analytics.totalTopics = topics.length;
              console.log('Fetched topics count from API:', analytics.totalTopics);
              
              // Also get questions count if missing
              if (!analytics.totalQuestions || analytics.totalQuestions === 0) {
                const questions = await questionApi.getAll({ take: 100 });
                analytics.totalQuestions = questions.length;
                console.log('Fetched questions count from API:', analytics.totalQuestions);
              }
            } catch (err) {
              console.warn('Could not fetch topics/questions count:', err);
              // Fallback to topic performance data length
              if (dashboardData.topPerformingTopics?.length > 0) {
                analytics.totalTopics = dashboardData.topPerformingTopics.length;
              }
            }
          }
          
          setSystemAnalytics(analytics);
        } else {
          setSystemAnalyticsError('System analytics not available');
        }

        if (dashboardData.topPerformingTopics && dashboardData.topPerformingTopics.length > 0) {
          setTopPerformingTopics(dashboardData.topPerformingTopics);
        } else {
          setTopTopicsError('Topic performance data not available');
        }
      } else {
        // Non-admin users should not access this dashboard
        setError('Access denied. This dashboard is for administrators only.');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading enhanced analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            System-wide performance metrics and analytics
          </p>
        </div>
      </div>

      {/* System Analytics (Admin Only) */}
      {isAdmin && (
        <div className="space-y-6">

          {systemAnalyticsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                System analytics unavailable: {systemAnalyticsError}
              </p>
            </div>
          )}

          {!systemAnalytics && !systemAnalyticsError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                Loading system analytics...
              </p>
            </div>
          )}

          {systemAnalytics && (
            <>
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.activeUsers}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.totalQuestions ?? 0}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(systemAnalytics.averageSystemScore ?? 0).toFixed(1)}%
                  </p>
                </div>
                <Award className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Topics</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.totalTopics ?? topPerformingTopics.length ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {systemAnalytics.totalQuestions ?? 0} questions
                  </p>
                </div>
                <Target className="w-10 h-10 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Topics Overview - Moved to top */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Topics Overview</h4>
            {topTopicsError && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{topTopicsError}</p>
              </div>
            )}
            {topPerformingTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformingTopics.slice(0, 6).map((topic, idx) => (
                  <div key={topic?.topicId ?? topic?.topicName ?? idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h5 className="font-medium text-gray-900 mb-3">{topic.topicName}</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Questions</span>
                        <span className="font-semibold text-blue-600">{topic.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Attempts</span>
                        <span className="font-semibold text-green-600">{topic.totalAttempts ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <span className={`font-semibold ${
                          topic.averageAccuracy >= 80 ? 'text-green-600' :
                          topic.averageAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(topic.averageAccuracy ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>
                  {topTopicsError
                    ? 'Topic data could not be loaded.'
                    : 'Loading topic information...'}
                </p>
              </div>
            )}
          </div>

          {/* Exam Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Exam Performance</h4>
            {systemAnalytics.examUsageStats && Array.isArray(systemAnalytics.examUsageStats) && systemAnalytics.examUsageStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popularity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {systemAnalytics.examUsageStats.slice(0, 5).map((exam: any, idx: number) => (
                      <tr key={exam?.examId ?? idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exam.examTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.totalAttempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.uniqueUsers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(exam.averageScore ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(exam.popularity ?? 0, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {(exam.popularity ?? 0).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Exam performance data is being calculated...</p>
                <p className="text-sm mt-1">Individual exam attempt data could not be loaded due to API limitations.</p>
              </div>
            )}
          </div>


          </>
          )}
        </div>
      )}


    </div>
  );
}
