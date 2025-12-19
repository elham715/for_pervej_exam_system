
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Question, StudentResult } from '../../types';
import { Users, FileText, TrendingUp, Calendar as CalendarIcon, BookOpen, HelpCircle, List, FileCheck, UserCog, BarChart3 } from 'lucide-react';
import { TopicManager } from './TopicManager';
import { QuestionManager } from './QuestionManager';
import { QuestionSetManagerTab } from './QuestionSetManagerTab';
import { ExamManagerTab } from './ExamManagerTab';
import { UserManager } from './UserManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface AdminDashboardProps {
  results: StudentResult[];
  questions: Question[];
}

type DashboardTab = 'analytics' | 'users' | 'topics' | 'questions' | 'question-sets' | 'exams';

export function AdminDashboard({ results, questions }: AdminDashboardProps) {
  const [_selectedResult, _setSelectedResult] = useState<StudentResult | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab;
    if (tabParam && ['analytics', 'users', 'topics', 'questions', 'question-sets', 'exams'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Handle user performance view
  const handleViewUserPerformance = (userId: string, userName: string) => {
    navigate(`/admin/user-performance/${userId}?name=${encodeURIComponent(userName)}`);
  };

  const totalStudents = results.length;
  const averageScore = results.length > 0 
    ? results.reduce((sum, result) => sum + (result.score / result.total_questions) * 100, 0) / results.length
    : 0;

  const topicPerformance = useMemo(() => {
    const topics = [...new Set(questions.map(q => q.topic))];
    return topics.map(topic => {
      const topicQuestions = questions.filter(q => q.topic === topic);
      const topicResults = results.map(result => {
        const correct = topicQuestions.filter(q => 
          result.answers[q.id] === q.correct_answer
        ).length;
        return (correct / topicQuestions.length) * 100;
      });
      
      const avgPerformance = topicResults.length > 0
        ? topicResults.reduce((sum, score) => sum + score, 0) / topicResults.length
        : 0;
      
      return {
        topic,
        performance: Math.round(avgPerformance),
        questionsCount: topicQuestions.length,
        studentsCount: results.length
      };
    });
  }, [results, questions]);

  const overviewContent = (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Questions</p>
              <p className="text-xl font-bold text-gray-900">{questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Average Score</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Topics</p>
              <p className="text-xl font-bold text-gray-900">{topicPerformance.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Performance */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Topic Performance</h3>
        <div className="space-y-3">
          {topicPerformance.map((topic) => (
            <div key={topic.topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-sm text-gray-900">{topic.topic}</h4>
                <p className="text-xs text-gray-600">
                  {topic.questionsCount} questions • {topic.studentsCount} students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-28 bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      topic.performance >= 80 ? 'bg-green-500' :
                      topic.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(topic.performance, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 w-10 text-right">
                  {topic.performance}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Exam Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topics to Review
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                return (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.student_name}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{result.student_email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.score}/{result.total_questions}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          percentage >= 80
                            ? 'bg-green-100 text-green-800'
                            : percentage >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {result.incorrect_topics.length > 0
                          ? result.incorrect_topics.join(', ')
                          : 'None - Perfect Score!'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(result.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {results.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">
                No exam results yet. Share your exam links with students to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md p-1 inline-flex gap-1 flex-wrap">
        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-cyan-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Users
        </button>
        <button
          onClick={() => handleTabChange('topics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'topics'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Topics
        </button>
        <button
          onClick={() => handleTabChange('questions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'questions'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Questions
        </button>
        <button
          onClick={() => handleTabChange('question-sets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'question-sets'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <List className="w-4 h-4" />
          Question Sets
        </button>
        <button
          onClick={() => handleTabChange('exams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'exams'
              ? 'bg-orange-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Exams
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' ? (
        <AnalyticsDashboard />
      
      ) : activeTab === 'users' ? (
        <UserManager onViewPerformance={handleViewUserPerformance} />
      ) : activeTab === 'topics' ? (
        <TopicManager />
      ) : activeTab === 'questions' ? (
        <QuestionManager />
      ) : activeTab === 'question-sets' ? (
        <QuestionSetManagerTab />
      ) : activeTab === 'exams' ? (
        <ExamManagerTab />
      ) : (
        <AnalyticsDashboard />
      )}
    </div>
  );
}
