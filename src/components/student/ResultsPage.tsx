import { useState } from 'react';
import { StudentResult, Question, Topic } from '../../types';
import { LaTeX } from '../LaTeX';
import { Award, AlertTriangle, CheckCircle2, XCircle, Film, ArrowRight, User } from 'lucide-react';
import { VideoPlayer } from '../VideoPlayer';
import { TextWithLaTeX } from '../TextWithLaTeX';
import { TopicHeader } from './TopicHeader';

interface ResultsPageProps {
  result: StudentResult;
  questions: Question[];
  topics: Topic[];
}

export function ResultsPage({ result, questions, topics }: ResultsPageProps) {
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);
  const percentage = Math.round((result.score / result.total_questions) * 100);

  const incorrectQuestions = questions.filter(q => result.answers[q.id] !== q.correct_answer);

  const incorrectQuestionsByTopic: { [topicName: string]: Question[] } = {};
  incorrectQuestions.forEach(q => {
    const topicName = q.topic || 'Uncategorized';
    if (!incorrectQuestionsByTopic[topicName]) {
      incorrectQuestionsByTopic[topicName] = [];
    }
    incorrectQuestionsByTopic[topicName].push(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        
        {/* Header Summary Card */}
        {/* Clean Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-5">
          {/* Top Bar - Logo and Name */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">OMNIA</h1>
                <p className="text-xs text-gray-500">Exam Results</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{result.student_name}</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
          </div>

          {/* Stats Grid - Clean and Minimal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-500 mb-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Correct</p>
              <p className="text-3xl font-bold text-green-600">{result.score}</p>
            </div>

            <div className="text-center p-4 rounded-xl bg-red-50 border border-red-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500 mb-2">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Incorrect</p>
              <p className="text-3xl font-bold text-red-600">{result.total_questions - result.score}</p>
            </div>

            <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 mb-2">
                <Award className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-bold text-blue-600">{percentage}%</p>
            </div>

            <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500 mb-2">
                <Film className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.floor(result.time_taken_seconds / 60)}:{String(result.time_taken_seconds % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Topics to Review Card */}
        {result.incorrect_topics.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 mb-6 sm:mb-8 md:mb-12 border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none"></div>
            
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:text-left mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mb-4 md:mb-0 md:mr-6 shadow-xl">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-700 mb-2">
                  Topics to Review
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-amber-700">
                  Focus on these areas to improve your score 📚
                </p>
              </div>
            </div>
            
            <div className="relative flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
              {result.incorrect_topics.map((topic) => (
                <span 
                  key={topic} 
                  className="bg-white/80 backdrop-blur-sm border-2 border-amber-300 text-amber-900 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  📖 {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Perfect Score Message */}
        {result.incorrect_topics.length === 0 && (
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl p-8 sm:p-10 md:p-14 lg:p-16 mb-6 sm:mb-8 md:mb-12 text-center border-2 border-green-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 sm:mb-8 shadow-2xl animate-bounce">
                      <Award className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-4 sm:mb-6">
                    Perfect Score! 🎉
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 font-semibold max-w-3xl mx-auto">
                      Congratulations! You answered all questions correctly. Excellent work! 🌟
                  </p>
                </div>
            </div>
        )}

        {/* Question Breakdown */}
        {incorrectQuestions.length > 0 && (
            <div className="space-y-6 sm:space-y-8 md:space-y-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-slate-700 text-center mb-6 sm:mb-8 md:mb-10">
                  📝 Question Breakdown
                </h2>
                {Object.entries(incorrectQuestionsByTopic).map(([topicName, questions]) => {
                    const topic = topics.find(t => t.name === topicName);
                    return (
                        <div key={topicName} className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
                            <TopicHeader 
                                topicName={topicName} 
                                videoUrl={topic?.explanation_video_url}
                                onPlayVideo={() => setShowVideoModal(topic?.explanation_video_url || null)}
                            />
                            {showVideoModal === topic?.explanation_video_url && (
                                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVideoModal(null)}>
                                    <div className="relative bg-gray-900 p-2 rounded-xl shadow-2xl border-2 border-purple-500 transform scale-105 transition-all duration-300 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setShowVideoModal(null)}
                                            className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition-colors z-10"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                        <VideoPlayer src={showVideoModal} />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
                              {questions.map((question) => (
                                <div key={question.id} className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
                                    <div className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 md:p-8 lg:p-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-5 sm:mb-6 leading-relaxed">
                                              <TextWithLaTeX text={question.question_text} />
                                            </div>
                                            {question.question_latex && (
                                                <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl overflow-x-auto shadow-inner">
                                                    <LaTeX block>{question.question_latex}</LaTeX>
                                                </div>
                                            )}
                                            <div className="space-y-4 sm:space-y-5">
                                                {/* Your Answer */}
                                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                                                    <div className="text-sm sm:text-base md:text-lg font-bold text-red-700 w-full sm:w-40 flex-shrink-0">
                                                      ✗ Your answer
                                                    </div>
                                                    <div className="w-full flex-1 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-4 sm:p-5 flex items-center gap-3 shadow-lg">
                                                        <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 flex-shrink-0" />
                                                        <div className="text-sm sm:text-base md:text-lg text-red-900 font-medium break-words flex-1">
                                                          {result.answers[question.id] != null && <TextWithLaTeX text={question.options[result.answers[question.id]]} />}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Correct Answer */}
                                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                                                    <div className="text-sm sm:text-base md:text-lg font-bold text-green-700 w-full sm:w-40 flex-shrink-0">
                                                      ✓ Correct answer
                                                    </div>
                                                    <div className="w-full flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 sm:p-5 flex items-center gap-3 shadow-lg">
                                                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-green-500 flex-shrink-0" />
                                                        <div className="text-sm sm:text-base md:text-lg text-green-900 font-medium break-words flex-1">
                                                          <TextWithLaTeX text={question.options[question.correct_answer]} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {question.video_solution_url && (
                                                <button
                                                    onClick={() => window.open(question.video_solution_url, '_blank')}
                                                    className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-rose-500 text-white text-sm sm:text-base md:text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
                                                    title="Watch Solution Video"
                                                >
                                                    <Film className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    <span>Watch Solution 🎬</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* Final Action Button */}
        <div className="mt-10 sm:mt-12 md:mt-16 lg:mt-20 text-center">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-black py-5 px-8 sm:py-6 sm:px-12 md:py-7 md:px-16 rounded-full hover:rounded-2xl transition-all duration-300 text-lg sm:text-xl md:text-2xl shadow-2xl hover:shadow-[0_20px_60px_rgba(139,92,246,0.5)] inline-flex items-center justify-center gap-3 sm:gap-4 transform hover:scale-110 border-2 border-white/30"
          >
            <span>🚀 Take Another Exam</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}