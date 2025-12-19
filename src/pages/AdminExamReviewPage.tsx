import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { analyticsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  Target, 
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Shield
} from 'lucide-react';
import { LaTeX } from '../components/LaTeX';
import { TextWithLaTeX } from '../components/TextWithLaTeX';

export function AdminExamReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<any>(null);

  useEffect(() => {
    if (attemptId) {
      loadAttemptDetails();
    }
  }, [attemptId]);

  const loadAttemptDetails = async () => {
    if (!attemptId) return;

    setLoading(true);
    setError(null);

    try {
      // If we have a userId from URL params, use it directly
      if (userId) {
        console.log('Using userId from URL params:', userId);
        const userDetailedAttempts = await analyticsApi.getUserDetailedAttempts(userId, { take: 100 });
        const attempt = userDetailedAttempts.find(a => a.id === attemptId);
        
        if (attempt) {
          setAttemptDetails(attempt);
          return;
        } else {
          setError('Exam attempt not found for this user');
          return;
        }
      }

      // If no userId provided, we can't efficiently find the attempt
      setError('User ID is required to load exam review. Please navigate from the user performance page.');
    } catch (err: any) {
      console.error('Error loading attempt details:', err);
      setError(err.message || 'Failed to load exam review');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number | null) => {
    if (!score) return 'text-gray-600 bg-gray-100';
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
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
          <p className="text-gray-600">Loading exam review...</p>
        </div>
      </div>
    );
  }

  if (error || !attemptDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Review</h2>
          <p className="text-gray-600 mb-4">{error || 'Exam review not available'}</p>
          <button
            onClick={() => navigate('/admin/dashboard?tab=exams')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  const correctAnswers = attemptDetails.exam_answers?.filter((a: any) => a.is_correct).length || 0;
  const totalQuestions = attemptDetails.exam_answers?.length || 0;
  const incorrectAnswers = totalQuestions - correctAnswers;

  // Get topics where student made mistakes
  const mistakeTopics = (() => {
    const topicMistakes: { [key: string]: { name: string; count: number; questions: any[] } } = {};
    
    attemptDetails.exam_answers
      ?.filter((answer: any) => !answer.is_correct)
      .forEach((answer: any) => {
        const topicName = answer.question.topic?.name || 'Unknown Topic';
        const topicId = answer.question.topic?.id || 'unknown';
        
        if (!topicMistakes[topicId]) {
          topicMistakes[topicId] = {
            name: topicName,
            count: 0,
            questions: []
          };
        }
        
        topicMistakes[topicId].count++;
        topicMistakes[topicId].questions.push({
          id: answer.question.id,
          text: answer.question.question_latex || answer.question.question_text,
          isLatex: !!answer.question.question_latex,
          selectedAnswer: answer.question.options?.find((opt: any) => opt.option_index === answer.selected_option_index)?.option_text,
          correctAnswer: answer.question.options?.find((opt: any) => opt.option_index === answer.question.correct_answer_index)?.option_text
        });
      });
    
    return Object.values(topicMistakes);
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard?tab=exams')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Admin Review: {attemptDetails.exam?.title}
                </h1>
                <p className="text-gray-600">
                  Student: {attemptDetails.user?.name} ({attemptDetails.user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(attemptDetails.status)}
              <span className="text-sm font-medium text-gray-600">{attemptDetails.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Final Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(attemptDetails.score).split(' ')[0]}`}>
                  {attemptDetails.score?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incorrect Answers</p>
                <p className="text-2xl font-bold text-red-600">{incorrectAnswers}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Taken</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor((attemptDetails.time_taken_seconds || 0) / 60)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{attemptDetails.user?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium text-gray-900">{attemptDetails.user?.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {attemptDetails.submitted_at ? new Date(attemptDetails.submitted_at).toLocaleString() : 'Not submitted'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topics Where Student Made Mistakes */}
        {mistakeTopics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Topics Where Student Made Mistakes</h3>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {mistakeTopics.length} topic{mistakeTopics.length !== 1 ? 's' : ''} need attention
              </span>
            </div>
            
            <div className="space-y-4">
              {mistakeTopics.map((topic, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {topic.name}
                    </h4>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {topic.count} mistake{topic.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="text-sm text-red-800 mb-3">
                    Student got {topic.count} question{topic.count !== 1 ? 's' : ''} wrong in this topic. 
                    This indicates a need for additional practice and review in this area.
                  </div>
                  
                  <div className="space-y-2">
                    {topic.questions.slice(0, 3).map((question, qIndex) => (
                      <div key={question.id} className="bg-white border border-red-200 rounded p-3">
                        <div className="text-sm font-medium text-gray-800 mb-2">
                          <span>Question {qIndex + 1}: </span>
                          {question.isLatex ? (
                            <LaTeX>{question.text.length > 100 ? question.text.substring(0, 100) + '...' : question.text}</LaTeX>
                          ) : (
                            <TextWithLaTeX text={question.text.length > 100 ? question.text.substring(0, 100) + '...' : question.text} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600">
                            Student's answer: <strong>{question.selectedAnswer || 'No answer'}</strong>
                          </span>
                          <span className="text-green-600">
                            Correct: <strong>{question.correctAnswer}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                    {topic.questions.length > 3 && (
                      <p className="text-xs text-gray-600 italic">
                        ... and {topic.questions.length - 3} more question{topic.questions.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions Review */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Question-by-Question Analysis</h3>
            <span className="text-sm text-gray-500">
              ({attemptDetails.exam_answers?.length || 0} questions total)
            </span>
          </div>

          {attemptDetails.exam_answers && attemptDetails.exam_answers.length > 0 ? (
            <div className="space-y-8">
              {attemptDetails.exam_answers.map((answerData: any, index: number) => {
                const question = answerData.question;
                const isCorrect = answerData.is_correct;
                const selectedIndex = answerData.selected_option_index;

                return (
                  <div 
                    key={answerData.id} 
                    className={`border-2 rounded-lg p-6 ${
                      isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                          {question.topic && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {question.topic.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {answerData.answered_at && new Date(answerData.answered_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                      <div className="font-medium text-gray-900 text-lg mb-2">
                        {question.question_latex ? (
                          <LaTeX>{question.question_latex}</LaTeX>
                        ) : question.question_text ? (
                          <TextWithLaTeX text={question.question_text} />
                        ) : (
                          'Question text not available'
                        )}
                      </div>
                      {question.image_url && (
                        <div className="mb-4">
                          <img
                            src={question.image_url}
                            alt="Question"
                            className="max-w-full h-auto rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {question.options?.map((option: any) => {
                        const isSelected = selectedIndex === option.option_index;
                        const isCorrectOption = question.correct_answer_index === option.option_index;
                        
                        return (
                          <div 
                            key={option.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isSelected && isCorrect
                                ? 'border-green-400 bg-green-100'
                                : isSelected && !isCorrect
                                ? 'border-red-400 bg-red-100'
                                : isCorrectOption
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected && isCorrect
                                  ? 'bg-green-500 text-white'
                                  : isSelected && !isCorrect
                                  ? 'bg-red-500 text-white'
                                  : isCorrectOption
                                  ? 'bg-green-400 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {String.fromCharCode(64 + option.option_index)}
                              </div>
                              <div className="flex-1 text-sm">
                                <TextWithLaTeX text={option.option_text || ''} />
                              </div>
                              <div className="flex items-center gap-1">
                                {isSelected && (
                                  <span className="text-xs font-medium text-blue-600">Student's Answer</span>
                                )}
                                {isCorrectOption && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                                {isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Performance Feedback */}
                    <div className="mb-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                        <div className="text-sm">
                          {isCorrect ? (
                            <p className="text-green-800">
                              <strong>✓ Correct!</strong> Student selected the right answer.
                            </p>
                          ) : (
                            <div className="text-red-800">
                              <p className="mb-1">
                                <strong>✗ Incorrect.</strong> Student selected option {selectedIndex ? String.fromCharCode(64 + selectedIndex) : 'None'}.
                              </p>
                              {question.correct_answer_index && (
                                <p className="text-green-700">
                                  <strong>Correct answer:</strong> Option {String.fromCharCode(64 + question.correct_answer_index)} - {question.options?.find((opt: any) => opt.option_index === question.correct_answer_index)?.option_text}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Learning Resources */}
                    <div className="space-y-4">
                      {/* Explanation */}
                      {question.explanation_latex ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h6 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Explanation
                          </h6>
                          <div className="text-sm text-blue-800 leading-relaxed">
                            <LaTeX>{question.explanation_latex}</LaTeX>
                          </div>
                        </div>
                      ) : question.explanation ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h6 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Explanation
                          </h6>
                          <div className="text-sm text-blue-800 leading-relaxed">
                            <TextWithLaTeX text={question.explanation} />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h6 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Explanation
                          </h6>
                          <p className="text-sm text-gray-600 italic">
                            No explanation available for this question yet.
                          </p>
                        </div>
                      )}

                      {/* Video Solution */}
                      {question.video_solution_url ? (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h6 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            Video Solution
                          </h6>
                          <p className="text-sm text-purple-800 mb-3">
                            Detailed step-by-step solution video for this question.
                          </p>
                          <a
                            href={question.video_solution_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Watch Solution Video
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h6 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            Video Solution
                          </h6>
                          <p className="text-sm text-gray-600 italic">
                            No video solution available for this question yet.
                          </p>
                        </div>
                      )}

                      {/* Topic Explanation Video */}
                      {question.topic?.explanation_video_url ? (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <h6 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Topic: {question.topic.name}
                          </h6>
                          <p className="text-sm text-indigo-800 mb-3">
                            Comprehensive video covering the fundamentals of {question.topic.name}.
                          </p>
                          <a
                            href={question.topic.explanation_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Learn {question.topic.name} Basics
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h6 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Topic: {question.topic?.name || 'Unknown'}
                          </h6>
                          <p className="text-sm text-gray-600 italic">
                            No topic explanation video available yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No question data available for review.</p>
            </div>
          )}
        </div>

        {/* Admin Recommendations */}
        {incorrectAnswers > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recommendations for Student
            </h4>
            <div className="text-sm text-purple-800">
              <p className="mb-2">
                This student got {incorrectAnswers} question{incorrectAnswers !== 1 ? 's' : ''} wrong across {mistakeTopics.length} topic{mistakeTopics.length !== 1 ? 's' : ''}. Consider recommending:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Review the explanations for incorrect answers</li>
                <li>Watch the video solutions for better understanding</li>
                <li>Focus additional practice on the highlighted topics</li>
                <li>Watch topic fundamental videos to strengthen foundation</li>
                <li>Provide additional practice questions in weak areas</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}