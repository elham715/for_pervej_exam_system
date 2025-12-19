import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsApi, attemptApi } from '../lib/api';
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
  AlertCircle,
  HelpCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  MousePointer
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



interface IncorrectQuestion {
  questionId: string;
  questionText: string;
  topic: string;
  examTitle: string;
  attemptId: string;
  selectedAnswer: string;
  correctAnswer: string;
  answeredAt: string;
  options: string[];
}

export function UserPerformancePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPerformance, setUserPerformance] = useState<UserPerformance | null>(null);
  const [examHistory, setExamHistory] = useState<any[]>([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState<IncorrectQuestion[]>([]);
  const [loadingIncorrect, setLoadingIncorrect] = useState(false);
  const [showIncorrectQuestions, setShowIncorrectQuestions] = useState(false);


  useEffect(() => {
    if (userId) {
      loadUserPerformance();
    }
  }, [userId]);

  const loadIncorrectQuestions = async () => {
    if (!userPerformance) return;

    setLoadingIncorrect(true);
    try {
      const incorrectQuestionsData: IncorrectQuestion[] = [];

      // Get detailed data for recent completed attempts
      const completedAttempts = userPerformance.recentAttempts
        .filter(attempt => attempt.status === 'SUBMITTED')
        .slice(0, 10); // Analyze last 10 completed attempts

      for (const attempt of completedAttempts) {
        try {
          const attemptDetails = await attemptApi.getById(attempt.attemptId);
          
          if (attemptDetails.answers && attemptDetails.questions) {
            // Create a map of questions for easy lookup
            const questionsMap = new Map();
            attemptDetails.questions.forEach(q => {
              questionsMap.set(q.question.id, q.question);
            });

            // Find incorrect answers
            attemptDetails.answers.forEach((answer: any) => {
              if (!answer.is_correct && answer.question_id) {
                const question = questionsMap.get(answer.question_id);
                if (question) {
                  incorrectQuestionsData.push({
                    questionId: answer.question_id,
                    questionText: question.text || question.question_text || 'Question text not available',
                    topic: question.topic?.name || 'Unknown Topic',
                    examTitle: attempt.examTitle,
                    attemptId: attempt.attemptId,
                    selectedAnswer: question.options?.[answer.selected_option_index - 1] || `Option ${answer.selected_option_index}`,
                    correctAnswer: 'Not available', // We don't have correct answer in student view for security
                    answeredAt: answer.answered_at,
                    options: question.options || []
                  });
                }
              }
            });
          }
        } catch (err) {
          console.warn(`Failed to load details for attempt ${attempt.attemptId}:`, err);
        }
      }

      setIncorrectQuestions(incorrectQuestionsData);
    } catch (err: any) {
      console.error('Error loading incorrect questions:', err);
    } finally {
      setLoadingIncorrect(false);
    }
  };



  const loadUserPerformance = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Loading user performance for userId:', userId);
      
      // Try to get comprehensive performance data using analytics API directly
      const [performance, history] = await Promise.allSettled([
        analyticsApi.getUserPerformance(userId),
        analyticsApi.getUserHistory(userId, { take: 20 }).catch(() => [])
      ]);

      console.log('Performance result:', performance);
      console.log('History result:', history);

      if (performance.status === 'fulfilled') {
        console.log('Setting user performance:', performance.value);
        setUserPerformance(performance.value as UserPerformance);
      } else {
        console.error('Performance fetch failed:', performance.reason);
        
        // Fallback: Try to get basic attempt data if enhanced analytics fails
        try {
          console.log('Trying fallback approach with basic attempt data...');
          // For now, create a minimal performance object
          const fallbackPerformance: UserPerformance = {
            userId: userId,
            userName: 'User',
            totalExamsTaken: 0,
            completedExams: 0,
            averageScore: 0,
            completionRate: 0,
            averageTimeSpent: 0,
            topicWisePerformance: [],
            recentAttempts: [],
            improvementTrend: []
          };
          setUserPerformance(fallbackPerformance);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          throw new Error('Failed to load user performance');
        }
      }

      if (history.status === 'fulfilled') {
        console.log('Setting exam history:', history.value);
        setExamHistory(history.value);
      }

    } catch (err: any) {
      console.error('Error in loadUserPerformance:', err);
      setError(err.message || 'Failed to load user performance data');
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
                {userPerformance.recentAttempts.slice(0, 10).map((attempt) => {
                  const attemptIncorrectCount = incorrectQuestions.filter(q => q.attemptId === attempt.attemptId).length;
                  
                  return (
                    <button
                      key={attempt.attemptId}
                      onClick={() => navigate(`/admin/exam-review/${attempt.attemptId}?userId=${userId}`)}
                      className="w-full border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-700">{attempt.examTitle}</h4>
                          {attemptIncorrectCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              <HelpCircle className="w-3 h-3 mr-1" />
                              {attemptIncorrectCount} incorrect
                            </span>
                          )}
                          <MousePointer className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
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
                      <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to open detailed exam review page →
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Topic Performance</h3>
              </div>
              {incorrectQuestions.length > 0 && (
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  {incorrectQuestions.length} incorrect questions found
                </span>
              )}
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

        {/* Incorrect Questions Analysis */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Incorrect Questions Analysis</h3>
            </div>
            <button
              onClick={() => {
                if (!showIncorrectQuestions && incorrectQuestions.length === 0) {
                  loadIncorrectQuestions();
                }
                setShowIncorrectQuestions(!showIncorrectQuestions);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={loadingIncorrect}
            >
              {loadingIncorrect ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  {showIncorrectQuestions ? 'Hide' : 'Show'} Incorrect Questions
                  {showIncorrectQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>

          {showIncorrectQuestions && (
            <div className="mt-4">
              {incorrectQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">Great! No incorrect questions found in recent attempts.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Found {incorrectQuestions.length} incorrect questions</strong> across {new Set(incorrectQuestions.map(q => q.examTitle)).size} exams. 
                      Questions are grouped by exam for easier analysis.
                    </p>
                  </div>

                  {/* Group questions by exam */}
                  {(() => {
                    const questionsByExam = incorrectQuestions.reduce((acc, question) => {
                      const examKey = `${question.examTitle}-${question.attemptId}`;
                      if (!acc[examKey]) {
                        acc[examKey] = {
                          examTitle: question.examTitle,
                          attemptId: question.attemptId,
                          questions: []
                        };
                      }
                      acc[examKey].questions.push(question);
                      return acc;
                    }, {} as Record<string, { examTitle: string; attemptId: string; questions: IncorrectQuestion[] }>);

                    return (
                      <div className="space-y-6">
                        {Object.values(questionsByExam).map((examGroup) => (
                          <div key={examGroup.attemptId} className="border border-gray-300 rounded-lg overflow-hidden">
                            {/* Exam Header */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-white">{examGroup.examTitle}</h4>
                                  <p className="text-red-100 text-sm">
                                    {examGroup.questions.length} incorrect question{examGroup.questions.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-white text-sm">Attempt ID</div>
                                  <div className="text-red-100 text-xs font-mono">{examGroup.attemptId.slice(-8)}</div>
                                </div>
                              </div>
                            </div>

                            {/* Questions for this exam */}
                            <div className="bg-white">
                              {examGroup.questions.map((question, questionIndex) => (
                                <div key={question.questionId} className={`p-6 ${questionIndex !== examGroup.questions.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          Question {questionIndex + 1}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          📚 {question.topic}
                                        </span>
                                      </div>
                                      <h5 className="font-medium text-gray-900 mb-3 text-lg leading-relaxed">
                                        {question.questionText}
                                      </h5>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-4">
                                      <Calendar className="w-3 h-3 inline mr-1" />
                                      {new Date(question.answeredAt).toLocaleDateString()}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Student's Incorrect Answer */}
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        Student's Answer (Incorrect)
                                      </p>
                                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                        <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-red-600 text-sm font-bold">✗</span>
                                          </div>
                                          <span className="text-red-800 font-medium">{question.selectedAnswer}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* All Available Options */}
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        All Answer Options
                                      </p>
                                      <div className="space-y-2">
                                        {question.options.map((option, optIndex) => (
                                          <div 
                                            key={optIndex} 
                                            className={`p-3 rounded-lg border transition-all ${
                                              option === question.selectedAnswer 
                                                ? 'bg-red-50 border-red-300 text-red-800 shadow-sm' 
                                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                option === question.selectedAnswer 
                                                  ? 'bg-red-100 text-red-600' 
                                                  : 'bg-gray-200 text-gray-600'
                                              }`}>
                                                {String.fromCharCode(65 + optIndex)}
                                              </div>
                                              <span className="flex-1">{option}</span>
                                              {option === question.selectedAnswer && (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                      <span>
                                        <strong>Security Note:</strong> Correct answers are not displayed to maintain exam integrity. 
                                        Use this information to identify knowledge gaps and review the relevant topic materials.
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Exam Summary Footer */}
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Topics in this exam: <strong>{new Set(examGroup.questions.map(q => q.topic)).size}</strong>
                                </span>
                                <span className="text-gray-600">
                                  Most common topic: <strong>
                                    {(() => {
                                      const topicCounts = examGroup.questions.reduce((acc, q) => {
                                        acc[q.topic] = (acc[q.topic] || 0) + 1;
                                        return acc;
                                      }, {} as Record<string, number>);
                                      return Object.entries(topicCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
                                    })()}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Enhanced Summary Stats */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg text-center border border-red-200">
                      <div className="text-3xl font-bold text-red-600 mb-2">{incorrectQuestions.length}</div>
                      <div className="text-sm font-medium text-red-800">Total Incorrect</div>
                      <div className="text-xs text-red-600 mt-1">Questions Missed</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg text-center border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {new Set(incorrectQuestions.map(q => q.topic)).size}
                      </div>
                      <div className="text-sm font-medium text-blue-800">Topics Affected</div>
                      <div className="text-xs text-blue-600 mt-1">Need Review</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg text-center border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {new Set(incorrectQuestions.map(q => q.examTitle)).size}
                      </div>
                      <div className="text-sm font-medium text-purple-800">Exams Involved</div>
                      <div className="text-xs text-purple-600 mt-1">With Mistakes</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg text-center border border-orange-200">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {(() => {
                          const topicCounts = incorrectQuestions.reduce((acc, q) => {
                            acc[q.topic] = (acc[q.topic] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          return Math.max(...Object.values(topicCounts), 0);
                        })()}
                      </div>
                      <div className="text-sm font-medium text-orange-800">Most Errors</div>
                      <div className="text-xs text-orange-600 mt-1">In One Topic</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}