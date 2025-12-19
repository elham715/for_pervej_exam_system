import { useState, useEffect, useCallback, useRef } from 'react';
import { examApi, attemptApi } from '../../lib/api';
import { 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  Send,
  Grid3x3,
  BookOpen
} from 'lucide-react';
import { TextWithLaTeX } from '../TextWithLaTeX';
import { ExamTimer } from '../ExamTimer';

interface StudentExamInterfaceProps {
  examId?: string;
  examLink?: string;
  onComplete?: (attemptId: string) => void;
}

interface Question {
  id: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  video_solution_url?: string;
  topic?: {
    id: string;
    name: string;
  };
  options: Array<{
    id?: string;
    option_index: number;
    option_text: string;
  }>;
}

interface QuestionSet {
  id: string;
  title: string;
  question_set_questions: Array<{
    position: number;
    question: Question;
  }>;
}

interface Exam {
  id: string;
  title: string;
  time_limit_seconds: number;
  exam_link: string;
  exam_question_sets?: Array<{
    position: number;
    question_set: QuestionSet;
  }>;
}

export function StudentExamInterface({ examId, examLink, onComplete }: StudentExamInterfaceProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number | null>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [uiLocked, setUiLocked] = useState(false); // Lock UI when time expires
  const hasAutoSubmitted = useRef(false);
  const hasInitialized = useRef(false); // Prevent double initialization

  // Flatten all questions from exam
  const allQuestions: Question[] = exam?.exam_question_sets
    ?.flatMap(eqs => eqs.question_set.question_set_questions
      .sort((a, b) => a.position - b.position)
      .map(qsq => qsq.question)
    ) || [];

  const currentQuestion = allQuestions[currentQuestionIndex];

  // Load exam and start attempt
  useEffect(() => {
    // Prevent double initialization (React 18 Strict Mode runs effects twice in dev)
    if (hasInitialized.current) {
      console.log('⚠️ Skipping duplicate initialization');
      return;
    }
    
    hasInitialized.current = true;
    
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch exam
        let examData: Exam;
        if (examLink) {
          examData = await examApi.getByLink(examLink);
        } else if (examId) {
          examData = await examApi.getById(examId);
        } else {
          throw new Error('Either examId or examLink is required');
        }
        
        setExam(examData);

        // Start or resume attempt
        const attempt = await attemptApi.start(examData.id);
        
        // Check if attempt is already finished
        if (attempt.status === 'SUBMITTED') {
          console.log('Exam already finished, redirecting to results');
          if (onComplete) {
            onComplete(attempt.id);
          }
          return;
        }
        
        setAttemptId(attempt.id);
        
        // Store total_time_seconds for timer
        if (attempt.total_time_seconds) {
          console.log('🔥 Backend response:', {
            attemptId: attempt.id,
            status: attempt.status,
            total_time_seconds: attempt.total_time_seconds
          });
          setTotalTimeSeconds(attempt.total_time_seconds);
        } else {
          throw new Error('No total_time_seconds received from backend');
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load exam');
        console.error('Error loading exam:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [examId, examLink]);

  // Auto-submit when time expires (idempotent) - DEFINED BEFORE USE
  const handleAutoSubmit = useCallback(async (attemptIdToSubmit: string) => {
    if (hasAutoSubmitted.current) {
      console.log('Auto-submit already in progress, skipping');
      return;
    }
    
    hasAutoSubmitted.current = true;
    setIsSubmitting(true);
    setUiLocked(true);
    
    try {
      console.log('Auto-submitting exam due to time expiry:', attemptIdToSubmit);
      
      // Submit null answers for all unattempted questions before final submit
      const unattemptedQuestions = allQuestions.filter(q => !answers.has(q.id));
      if (unattemptedQuestions.length > 0) {
        console.log(`Auto-submit: Submitting ${unattemptedQuestions.length} unattempted questions with null answers`);
        for (const question of unattemptedQuestions) {
          try {
            await attemptApi.submitAnswer(attemptIdToSubmit, {
              question_id: question.id,
              selected_option_index: null,
            });
          } catch (err) {
            console.error(`Failed to submit null answer for question ${question.id}:`, err);
            // Continue with other questions even if one fails
          }
        }
      }
      
      await attemptApi.submit(attemptIdToSubmit);
      
      // Small delay to show "time's up" message before redirect
      setTimeout(() => {
        if (onComplete) {
          onComplete(attemptIdToSubmit);
        } else {
          alert('Time expired! Your exam has been automatically submitted.');
          window.location.href = '/';
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error auto-submitting exam:', err);
      // Even if auto-submit fails, still try to navigate (backend may have already submitted)
      setTimeout(() => {
        if (onComplete) {
          onComplete(attemptIdToSubmit);
        } else {
          window.location.href = '/';
        }
      }, 2000);
    }
  }, [allQuestions, answers, onComplete]);

  // Backup safety check: Periodically verify time hasn't expired (every 10 seconds)
  // This ensures auto-submit happens even if timer component has issues or tab was closed
  useEffect(() => {
    if (!attemptId || !totalTimeSeconds || isSubmitting || hasAutoSubmitted.current) {
      return;
    }

    const timerStartKey = `exam_timer_start_${attemptId}`;

    const checkTimeExpiry = () => {
      const startTime = localStorage.getItem(timerStartKey);
      if (!startTime) return;
      
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      
      if (elapsed >= totalTimeSeconds && !hasAutoSubmitted.current && !isTimeUp) {
        console.log('Safety check: Time expired, triggering auto-submit');
        setIsTimeUp(true);
        setUiLocked(true);
        handleAutoSubmit(attemptId);
      }
    };

    const interval = setInterval(checkTimeExpiry, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [totalTimeSeconds, isSubmitting, isTimeUp, attemptId, handleAutoSubmit]);

  // Handle time up event from ExamTimer
  const handleTimeUp = useCallback(() => {
    if (hasAutoSubmitted.current || !attemptId) return;
    
    console.log('Time is up! Initiating auto-submit...');
    setIsTimeUp(true);
    setUiLocked(true); // Lock UI immediately to prevent further interactions
    handleAutoSubmit(attemptId);
  }, [attemptId, handleAutoSubmit]);

  // Handle answer selection
  const handleSelectAnswer = async (optionIndex: number) => {
    // Don't allow answer changes if UI is locked (time expired)
    if (uiLocked || !attemptId || !currentQuestion || isTimeUp) {
      return;
    }

    const newAnswers = new Map(answers);
    const currentAnswer = answers.get(currentQuestion.id);
    
    // Toggle: if same option clicked, deselect it
    const newAnswer = currentAnswer === optionIndex ? null : optionIndex;
    newAnswers.set(currentQuestion.id, newAnswer);
    setAnswers(newAnswers);

    // Submit answer to backend
    try {
      await attemptApi.submitAnswer(attemptId, {
        question_id: currentQuestion.id,
        selected_option_index: newAnswer,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save answer');
      console.error('Error saving answer:', err);
    }
  };

  // Navigation - disabled when UI is locked
  const goToNextQuestion = () => {
    if (uiLocked || isTimeUp) return;
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowQuestionGrid(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (uiLocked || isTimeUp) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowQuestionGrid(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (uiLocked || isTimeUp) return;
    setCurrentQuestionIndex(index);
    setShowQuestionGrid(false);
  };

  // Manual submit exam
  const handleSubmit = useCallback(async () => {
    if (!attemptId || isSubmitting || uiLocked) return;

    const unanswered = allQuestions.length - answers.size;
    if (unanswered > 0 && !isTimeUp) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      setUiLocked(true); // Lock UI during submission
      setError(null);
      
      console.log('Submitting exam attempt:', attemptId);
      
      // Submit null answers for all unattempted questions
      const unattemptedQuestions = allQuestions.filter(q => !answers.has(q.id));
      if (unattemptedQuestions.length > 0) {
        console.log(`Submitting ${unattemptedQuestions.length} unattempted questions with null answers`);
        for (const question of unattemptedQuestions) {
          try {
            await attemptApi.submitAnswer(attemptId, {
              question_id: question.id,
              selected_option_index: null,
            });
          } catch (err) {
            console.error(`Failed to submit null answer for question ${question.id}:`, err);
            // Continue with other questions even if one fails
          }
        }
      }
      
      // Now submit the attempt
      await attemptApi.submit(attemptId);
      
      if (onComplete) {
        onComplete(attemptId);
      } else {
        alert('Exam submitted successfully!');
        window.location.href = '/'; // Redirect to home
      }
    } catch (err: any) {
      // Handle submission errors
      if (err.message?.includes('already submitted')) {
        setError('This exam has already been submitted.');
        if (onComplete) {
          onComplete(attemptId);
        }
      } else {
        setError(err.message || 'Failed to submit exam');
        console.error('Error submitting exam:', err);
        setIsSubmitting(false);
        setUiLocked(false);
      }
    }
  }, [attemptId, isSubmitting, uiLocked, allQuestions, answers, isTimeUp, onComplete]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Exam...</h2>
          <p className="text-gray-600">Please wait while we prepare your exam.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!exam || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h2>
          <p className="text-gray-600">This exam has no questions. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  const answeredCount = answers.size;
  const progressPercentage = (answeredCount / allQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Question {currentQuestionIndex + 1} of {allQuestions.length}
              </p>
            </div>
            
            {/* Timer */}
            <div className="flex items-center gap-4">
              {attemptId && totalTimeSeconds && (
                <ExamTimer 
                  totalTimeSeconds={totalTimeSeconds}
                  attemptId={attemptId}
                  onTimeUp={handleTimeUp}
                  showWarnings={true}
                />
              )}

              <button
                onClick={() => setShowQuestionGrid(!showQuestionGrid)}
                disabled={uiLocked}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Grid3x3 className="w-5 h-5" />
                <span className="font-medium">Questions</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {answeredCount} of {allQuestions.length} questions answered
          </p>
        </div>
      </div>

      {/* Question Grid Overlay */}
      {showQuestionGrid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Question Navigator</h3>
              <button
                onClick={() => setShowQuestionGrid(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {allQuestions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`aspect-square rounded-lg border-2 font-semibold text-sm transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white border-blue-600'
                      : answers.has(q.id)
                      ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-300"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-100 border-2 border-gray-300"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Time's Up Banner */}
        {isTimeUp && (
          <div className="mb-6 bg-red-100 border-2 border-red-500 rounded-xl p-6 text-center animate-pulse">
            <div className="flex items-center justify-center gap-3 text-red-700 mb-2">
              <AlertCircle className="w-8 h-8" />
              <span className="text-2xl font-bold">⏰ TIME'S UP!</span>
            </div>
            <p className="text-red-600 text-lg font-medium">
              {isSubmitting ? 'Submitting your exam automatically...' : 'Your exam has been submitted.'}
            </p>
            {isSubmitting && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Topic Badge */}
            {currentQuestion.topic && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" />
                {currentQuestion.topic.name}
              </div>
            )}

            {/* Question */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Question {currentQuestionIndex + 1}
              </h2>
              
              {currentQuestion.question_text && (
                <div className="text-gray-900 text-lg mb-3">
                  <TextWithLaTeX text={currentQuestion.question_text} />
                </div>
              )}

              {currentQuestion.question_latex && (
                <div className="text-gray-900 text-lg mb-3">
                  <TextWithLaTeX text={currentQuestion.question_latex} />
                </div>
              )}

              {currentQuestion.image_url && (
                <div className="mb-4">
                  <img
                    src={currentQuestion.image_url}
                    alt="Question"
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options
                .sort((a, b) => a.option_index - b.option_index)
                .map((option) => {
                  const isSelected = answers.get(currentQuestion.id) === option.option_index;
                  
                  return (
                    <button
                      key={option.option_index}
                      onClick={() => handleSelectAnswer(option.option_index)}
                      disabled={uiLocked || isTimeUp}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                      } ${(uiLocked || isTimeUp) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-400'
                        }`}>
                          {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="inline-block mr-2 font-semibold text-gray-700">
                            {String.fromCharCode(65 + option.option_index - 1)}.
                          </span>
                          <TextWithLaTeX text={option.option_text} />
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0 || uiLocked}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestionIndex === allQuestions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || uiLocked}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : isTimeUp ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Time Expired
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Exam
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  disabled={uiLocked}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Submit Button (always visible) */}
            {!isTimeUp && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || uiLocked}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Exam Early'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
