import { useState, useEffect, useCallback, useRef } from 'react';
import { Exam } from '../../types';
import { LaTeX } from '../LaTeX';
import { attemptApi } from '../../lib/api';
import { TextWithLaTeX } from '../TextWithLaTeX';
import { ExamTimer } from '../ExamTimer';
import { AlertCircle } from 'lucide-react';

interface ExamInterfaceProps {
  exam: Exam;
  studentName: string;
  studentEmail: string;
  onSubmit: (result: { attemptId: string }) => void;
}

export function ExamInterface({ exam, studentName, studentEmail, onSubmit }: ExamInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [uiLocked, setUiLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);
  const hasInitialized = useRef(false); // Prevent double initialization

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
      const answeredQuestionIds = Object.keys(answers);
      const unattemptedQuestions = examQuestions.filter(q => !answeredQuestionIds.includes(q.id));
      
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
      
      setIsSubmitted(true);
      
      // Small delay to show "time's up" message before redirect
      setTimeout(() => {
        onSubmit({ attemptId: attemptIdToSubmit });
      }, 2000);
    } catch (err: any) {
      console.error('Error auto-submitting exam:', err);
      
      // Show error but still navigate (backend may have processed it despite error)
      setError(`Submission error: ${err.message || 'Unknown error'}. Checking results...`);
      setIsSubmitted(true);
      
      // Still navigate after delay - let results page handle the actual state
      setTimeout(() => {
        onSubmit({ attemptId: attemptIdToSubmit });
      }, 2000);
    }
  }, [answers, examQuestions, onSubmit]);

  // Handle time up event from ExamTimer
  const handleTimeUp = useCallback(() => {
    if (hasAutoSubmitted.current || !attemptId) return;
    
    console.log('Time is up! Initiating auto-submit...');
    setIsTimeUp(true);
    setUiLocked(true); // Lock UI immediately to prevent further interactions
    handleAutoSubmit(attemptId);
  }, [attemptId, handleAutoSubmit]);

  // Start the exam attempt when component mounts
  useEffect(() => {
    // Prevent double initialization (React 18 Strict Mode runs effects twice in dev)
    if (hasInitialized.current) {
      console.log('⚠️ Skipping duplicate initialization');
      return;
    }
    
    hasInitialized.current = true;
    
    const startExamAttempt = async () => {
      try {
        console.log('Starting exam attempt for exam:', exam.id);
        
        // Start the attempt - includes questions in response according to API spec
        const attemptResponse = await attemptApi.start(exam.id);
        console.log('Attempt started with response:', attemptResponse);
        
        setAttemptId(attemptResponse.id);
        
        // Check if exam is already finished
        if (attemptResponse.status === 'SUBMITTED') {
          console.log('Exam already submitted, redirecting to results');
          setIsSubmitted(true);
          onSubmit({ attemptId: attemptResponse.id });
          return;
        }
        
        // Store total_time_seconds for timer
        if (attemptResponse.total_time_seconds) {
          console.log('🔥 Backend response:', {
            attemptId: attemptResponse.id,
            status: attemptResponse.status,
            total_time_seconds: attemptResponse.total_time_seconds
          });
          setTotalTimeSeconds(attemptResponse.total_time_seconds);
        } else {
          throw new Error('No total_time_seconds received from backend');
        }
        
        // Extract questions from the start response according to API spec
        if (attemptResponse.questions && attemptResponse.questions.length > 0) {
          const questions = attemptResponse.questions.map((q: any) => {
            // According to API spec, structure is: { questionSetPosition, questionPosition, question: {...} }
            const questionData = q.question;
            
            // Handle options - according to spec, they're an array of strings
            let options = questionData.options || [];
            
            // If options are objects (from database), extract the text and sort by option_index
            if (options.length > 0 && typeof options[0] === 'object') {
              options = options
                .sort((a: any, b: any) => (a.option_index || 0) - (b.option_index || 0))
                .map((opt: any) => opt.option_text || opt.text || String(opt));
            }
            
            return {
              id: questionData.id,
              question_text: questionData.text || questionData.question_text,
              question_latex: questionData.question_latex,
              image_url: questionData.image_url,
              options: options,
              topic: questionData.topic?.name || 'Unknown',
              marks: questionData.marks || 1
            };
          });
          
          console.log('Extracted questions from start response:', questions);
          console.log('First question:', questions[0]);
          setExamQuestions(questions);
          
          if (questions.length === 0) {
            console.warn('No questions found in start response');
          }
        } else {
          console.warn('No questions found in start response');
        }
        
        setIsStarting(false);
      } catch (error: any) {
        console.error('Error starting exam:', error);
        setError(error.message || 'Failed to start exam. Please refresh and try again.');
        setIsStarting(false);
      }
    };

    startExamAttempt();
  }, [exam.id]);

  // Backup safety check: Periodically verify time hasn't expired (every 10 seconds)
  // This ensures auto-submit happens even if timer component has issues
  useEffect(() => {
    if (!attemptId || !totalTimeSeconds || isSubmitted || hasAutoSubmitted.current) {
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
  }, [totalTimeSeconds, isSubmitted, isTimeUp, attemptId, handleAutoSubmit]);

  // Show loading while starting the exam
  if (isStarting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Starting Your Exam...</h2>
          <p className="text-gray-600">Please wait while we prepare your exam.</p>
        </div>
      </div>
    );
  }

  // Type guard for questions
  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600">This exam has no questions. Please contact the administrator.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];

  const handleAnswer = async (questionId: string, answerIndex: number) => {
    // Don't allow answers if UI is locked (time expired)
    if (uiLocked || isTimeUp || isSubmitted || isSubmitting) return;

    // Update local state
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));

    // Submit answer to backend if attempt has started
    if (attemptId) {
      try {
        // answerIndex is already 0-based from our option mapping
        // Backend expects 1-based, so add 1
        const backendIndex = answerIndex + 1;
        await attemptApi.submitAnswer(attemptId, {
          question_id: questionId,
          selected_option_index: backendIndex,
        });
      } catch (err: any) {
        console.error('Error submitting answer:', err);
        // Don't alert on every answer error, just log it
      }
    }
  };

  // Manual submit exam
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting || !attemptId || uiLocked) return;

    setIsSubmitting(true);
    setUiLocked(true); // Lock UI during submission
    
    try {
      console.log('Submitting exam attempt:', attemptId);
      
      // Submit null answers for all unattempted questions
      const answeredQuestionIds = Object.keys(answers);
      const unattemptedQuestions = examQuestions.filter(q => !answeredQuestionIds.includes(q.id));
      
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
      
      // Submit the exam attempt to finalize it (idempotent)
      await attemptApi.submit(attemptId);
      
      setIsSubmitted(true);
      
      // Notify parent component with attemptId for navigation
      onSubmit({ attemptId });
    } catch (err: any) {
      console.error('Error submitting exam:', err);
      // Handle 410 Gone - attempt already expired/submitted
      if (err.message?.includes('410') || err.message?.includes('expired') || err.message?.includes('already submitted')) {
        setError('This exam has already been submitted or expired.');
        setIsSubmitted(true);
        onSubmit({ attemptId });
      } else {
        // Don't show alert for auto-submission on time up
        if (!isTimeUp) {
          alert('Failed to submit exam. Please try again.');
        }
        setIsSubmitting(false);
        setUiLocked(false);
      }
    }
  };

  const nextQuestion = () => {
    if (uiLocked || isTimeUp) return;
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (uiLocked || isTimeUp) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (uiLocked || isTimeUp) return;
    setCurrentQuestionIndex(index);
  };

  const answeredQuestions = Object.keys(answers).length;
  const progress = examQuestions.length > 0 ? (answeredQuestions / examQuestions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 truncate">
                {exam.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                {studentName} • {studentEmail}
              </p>
            </div>
            {attemptId && totalTimeSeconds > 0 && (
              <ExamTimer 
                totalTimeSeconds={totalTimeSeconds}
                attemptId={attemptId}
                onTimeUp={handleTimeUp}
                showWarnings={true}
                className="flex-shrink-0"
              />
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span className="font-medium">{answeredQuestions} of {examQuestions.length} answered</span>
              <span className="font-semibold text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        {/* Time Up Banner */}
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
        
        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Card */}
        <div className={`bg-white rounded-2xl shadow-xl border overflow-hidden ${
          isTimeUp ? 'border-red-200 opacity-75' : 'border-gray-100'
        }`}>
          {/* Question Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-sm sm:text-base">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-white/90 text-sm sm:text-base font-medium">
                  of {examQuestions.length}
                </span>
              </div>
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/20 backdrop-blur-sm text-white rounded-full font-medium">
                📚 {currentQuestion.topic}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            {/* Question Text */}
            <div className="mb-6 sm:mb-8">
              <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 leading-relaxed mb-4">
                <TextWithLaTeX text={currentQuestion.question_text} />
              </div>
              
              {currentQuestion.question_latex && (
                <div className="mb-4 p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
                  <LaTeX block>{currentQuestion.question_latex}</LaTeX>
                </div>
              )}
              
              {currentQuestion.image_url && (
                <div className="mb-4">
                  <img 
                    src={currentQuestion.image_url} 
                    alt="Question visual" 
                    className="w-full max-w-2xl mx-auto rounded-xl border-2 border-gray-200 shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {currentQuestion.options.map((option: string, index: number) => {
                // Options are now guaranteed to be strings from our mapping above
                const optionText = option || '';
                const optionIndex = index;
                
                return (
                  <label
                    key={index}
                    className={`group flex items-start sm:items-center p-4 sm:p-5 md:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      answers[currentQuestion.id] === optionIndex
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={optionIndex}
                      checked={answers[currentQuestion.id] === optionIndex}
                      onChange={() => handleAnswer(currentQuestion.id, optionIndex)}
                      disabled={uiLocked || isTimeUp || isSubmitted || isSubmitting}
                      className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 mr-3 sm:mr-4 mt-0.5 sm:mt-0 flex-shrink-0 disabled:opacity-50"
                    />
                    <div className={`text-sm sm:text-base md:text-lg flex-1 ${
                      answers[currentQuestion.id] === optionIndex ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}>
                      <TextWithLaTeX text={optionText} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0 || uiLocked || isTimeUp || isSubmitted}
                className="px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                ← Previous
              </button>
              
              <div className="flex gap-3 sm:gap-4">
                {currentQuestionIndex === examQuestions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSubmitted || uiLocked}
                    className="flex-1 sm:flex-none px-8 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : isTimeUp ? '⏰ Time Up - Submitting...' : '✓ Submit Exam'}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    disabled={uiLocked || isTimeUp || isSubmitted}
                    className="flex-1 sm:flex-none px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Grid Navigator (Mobile Hidden, Desktop Only) */}
        {examQuestions.length > 0 && (
          <div className="hidden md:block mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-10 lg:grid-cols-15 gap-2">
              {examQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  disabled={uiLocked || isTimeUp || isSubmitted}
                  className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentQuestionIndex === index
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md scale-110'
                      : answers[question.id] !== undefined
                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
