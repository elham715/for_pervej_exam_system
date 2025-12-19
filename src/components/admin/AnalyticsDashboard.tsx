import { useState, useEffect } from 'react';
import { analyticsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  BarChart3,
  Award,
  Target,
  Activity
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User analytics
  const [userPerformance, setUserPerformance] = useState<any>(null);
  const [examHistory, setExamHistory] = useState<any[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<any[]>([]);
  const [improvementTrend, setImprovementTrend] = useState<any>(null);
  
  // Admin analytics
  const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
  const [examUsageStats, setExamUsageStats] = useState<any[]>([]);
  const [topPerformingTopics, setTopPerformingTopics] = useState<any[]>([]);

  const [systemAnalyticsError, setSystemAnalyticsError] = useState<string | null>(null);
  const [examUsageError, setExamUsageError] = useState<string | null>(null);
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
      setExamUsageError(null);
      setTopTopicsError(null);

      const safeArray = (value: any): any[] => (Array.isArray(value) ? value : []);

      if (isAdmin) {
        // Load admin analytics with individual error handling
        try {
          const system = await analyticsApi.getSystemAnalytics();
          setSystemAnalytics(system);
        } catch (err: any) {
          console.error('Error loading system analytics:', err);
          setSystemAnalyticsError(err?.message || 'Failed to load system analytics');
          // Set empty data instead of failing completely
          setSystemAnalytics({
            total_users: 0,
            enrolled_users: 0,
            total_exams: 0,
            total_attempts: 0,
            completed_attempts: 0,
            average_system_score: 0,
            most_popular_topics: []
          });
        }

        try {
          const usage = await analyticsApi.getExamUsageStats();
          setExamUsageStats(safeArray(usage));
        } catch (err: any) {
          console.error('Error loading exam usage stats:', err);
          setExamUsageError(err?.message || 'Failed to load exam usage statistics');
          setExamUsageStats([]);
        }

        try {
          const topTopics = await analyticsApi.getTopPerformingTopics();
          setTopPerformingTopics(safeArray(topTopics));
        } catch (err: any) {
          console.error('Error loading top topics:', err);
          setTopTopicsError(err?.message || 'Failed to load top performing topics');
          setTopPerformingTopics([]);
        }
      }

      // Load user analytics with individual error handling
      try {
        const performance = await analyticsApi.getUserPerformance(userData.id);
        setUserPerformance(performance);
      } catch (err: any) {
        console.error('Error loading user performance:', err);
        setUserPerformance(null);
      }

      try {
        const history = await analyticsApi.getUserHistory(userData.id, { take: 10 });
        setExamHistory(safeArray(history));
      } catch (err: any) {
        console.error('Error loading exam history:', err);
        setExamHistory([]);
      }

      try {
        const topics = await analyticsApi.getUserTopicPerformance(userData.id);
        setTopicPerformance(safeArray(topics));
      } catch (err: any) {
        console.error('Error loading topic performance:', err);
        setTopicPerformance([]);
      }

      try {
        const trend = await analyticsApi.getUserTrend(userData.id);
        if (trend && typeof trend === 'object') {
          setImprovementTrend({
            ...trend,
            score_progression: safeArray((trend as any).score_progression),
          });
        } else {
          setImprovementTrend(null);
        }
      } catch (err: any) {
        console.error('Error loading improvement trend:', err);
        setImprovementTrend(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
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

  const getTrendIcon = (trend: string) => {
    if (trend === 'IMPROVING') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'DECLINING') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'IMPROVING') return 'text-green-600 bg-green-50';
    if (trend === 'DECLINING') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'System-wide performance metrics' : 'Your performance metrics'}
          </p>
        </div>
      </div>

      {/* System Analytics (Admin Only) */}
      {isAdmin && systemAnalytics && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>

          {systemAnalyticsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                System analytics unavailable: {systemAnalyticsError}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.total_users}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {systemAnalytics.enrolled_users} enrolled
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Exams</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.total_exams}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {systemAnalytics.total_attempts}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {systemAnalytics.completed_attempts} completed
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg System Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(systemAnalytics.average_system_score ?? 0).toFixed(1)}%
                  </p>
                </div>
                <Award className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Exam Usage Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Exam Usage Statistics</h4>
            {examUsageError && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{examUsageError}</p>
              </div>
            )}
            {examUsageStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examUsageStats.map((exam) => (
                      <tr key={exam.exam_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exam.exam_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.total_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.unique_users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(exam.completion_rate ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(exam.average_score ?? 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>
                  {examUsageError
                    ? 'Exam usage stats could not be loaded.'
                    : 'No exam attempts yet. Create and share exams to see usage statistics.'}
                </p>
              </div>
            )}
          </div>

          {/* Top Performing Topics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Topics</h4>
            {topTopicsError && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{topTopicsError}</p>
              </div>
            )}
            {topPerformingTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformingTopics.slice(0, 6).map((topic, idx) => (
                  <div key={topic?.topic_id ?? topic?.topic_name ?? idx} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{topic.topic_name}</h5>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Avg Score: <span className="font-semibold">{(topic.average_score ?? 0).toFixed(1)}%</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Attempts: <span className="font-semibold">{topic.total_attempts ?? 0}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Questions: <span className="font-semibold">{topic.question_count}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>
                  {topTopicsError
                    ? 'Top performing topics could not be loaded.'
                    : 'No topic performance data yet. Students need to complete exams first.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Performance */}
      {userPerformance && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAdmin ? 'Your Personal Performance' : 'Your Performance'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {userPerformance.total_attempts}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userPerformance.completed_attempts} completed
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
                    {(userPerformance.average_score ?? 0).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(userPerformance.best_score ?? 0).toFixed(1)}%
                  </p>
                </div>
                <Award className="w-10 h-10 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Time Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {userPerformance.total_time_spent_minutes}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">minutes</p>
                </div>
                <Clock className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Improvement Trend */}
          {improvementTrend && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Improvement Trend</h4>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getTrendColor(improvementTrend.trend)}`}>
                  {getTrendIcon(improvementTrend.trend)}
                  <span className="text-sm font-medium">{improvementTrend.trend}</span>
                  <span className="text-sm">
                    ({(improvementTrend.improvement_rate ?? 0) > 0 ? '+' : ''}{(improvementTrend.improvement_rate ?? 0).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {Array.isArray(improvementTrend.score_progression) && improvementTrend.score_progression.length > 0 && (
                <div className="space-y-2">
                  {improvementTrend.score_progression.map((item: any, index: number) => (
                    <div key={item?.exam_date ?? index} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-32">
                        {new Date(item.exam_date).toLocaleDateString()}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2"
                          style={{ width: `${item.score ?? 0}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {(item.score ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topic Performance */}
          {Array.isArray(topicPerformance) && topicPerformance.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Topic-wise Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicPerformance.map((topic, idx) => (
                  <div key={topic?.topic_id ?? topic?.topic_name ?? idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{topic.topic_name}</h5>
                      <Target className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-semibold text-gray-900">
                          {(topic.accuracy_percentage ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Questions</span>
                        <span className="font-semibold text-gray-900">
                          {topic.correct_answers}/{topic.total_questions_attempted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Time</span>
                        <span className="font-semibold text-gray-900">
                          {topic.average_time_per_question_seconds}s
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam History */}
          {Array.isArray(examHistory) && examHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Exam History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examHistory.map((attempt, idx) => (
                      <tr key={attempt?.attempt_id ?? `${attempt?.exam_title ?? 'attempt'}-${attempt?.submitted_at ?? idx}` }>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attempt.exam_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(attempt.score ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.time_taken_minutes} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attempt.status === 'SUBMITTED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {attempt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
