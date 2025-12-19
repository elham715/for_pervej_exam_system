import { useState, useEffect } from 'react';
import { Exam, StudentResult } from '../../types';
import { Timer } from '../Timer';
import { LaTeX } from '../LaTeX';
import { attemptApi } from '../../lib/api';
import { TextWithLaTeX } from '../TextWithLaTeX';

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
  const [startTime] = useState(Date.now());
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Start the exam attempt when component mounts
  useEffect(() => {
    const startExamAttempt = async () => {
      try {
        const response = await attemptApi.start(exam.id);
        setAttemptId(response.id);
        setIsStarting(false);
      } catch (error) {
        console.error('Error starting exam:', error);
        alert('Failed to start exam. Please refresh and try again.');
        setIsStarting(false);
      }
    };

    startExamAttempt();
  }, [exam.id]);

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

  // Type guard for exam.questions
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600">This exam has no questions. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  const handleAnswer = async (questionId: string, answerIndex: number) => {
    // Update local state
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));

    // Submit answer to backend if attempt has started
    if (attemptId) {
      try {
        await attemptApi.submitAnswer(attemptId, {
          question_id: questionId,
          selected_option_index: answerIndex + 1, // Backend expects 1-4, not 0-3
        });
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Don't alert on every answer error, just log it
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted || !attemptId) return;

    setIsSubmitted(true);
    
    try {
      // Submit the exam attempt to finalize it
      await attemptApi.submit(attemptId);
      
      // Notify parent component with attemptId for navigation
      onSubmit({ attemptId });
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
      setIsSubmitted(false);
    }
  };

  const handleTimeUp = () => {
    if (!isSubmitted) {
      handleSubmit();
    }
  };

  const nextQuestion = () => {
    if (exam.questions && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const answeredQuestions = Object.keys(answers).length;
  const progress = exam.questions ? (answeredQuestions / exam.questions.length) * 100 : 0;

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
            <Timer 
              duration={exam.time_limit_minutes} 
              onTimeUp={handleTimeUp}
              className="flex-shrink-0"
            />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span className="font-medium">{answeredQuestions} of {exam.questions?.length || 0} answered</span>
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
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Question Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-sm sm:text-base">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-white/90 text-sm sm:text-base font-medium">
                  of {exam.questions?.length || 0}
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
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`group flex items-start sm:items-center p-4 sm:p-5 md:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    answers[currentQuestion.id] === index
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={answers[currentQuestion.id] === index}
                    onChange={() => handleAnswer(currentQuestion.id, index)}
                    className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 mr-3 sm:mr-4 mt-0.5 sm:mt-0 flex-shrink-0"
                  />
                  <div className={`text-sm sm:text-base md:text-lg flex-1 ${
                    answers[currentQuestion.id] === index ? 'text-gray-900 font-medium' : 'text-gray-700'
                  }`}>
                    <TextWithLaTeX text={option} />
                  </div>
                </label>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                ← Previous
              </button>
              
              <div className="flex gap-3 sm:gap-4">
                {exam.questions && currentQuestionIndex === exam.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 sm:flex-none px-8 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    ✓ Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex-1 sm:flex-none px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Grid Navigator (Mobile Hidden, Desktop Only) */}
        {exam.questions && (
          <div className="hidden md:block mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-10 lg:grid-cols-15 gap-2">
              {exam.questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all duration-200 ${
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
