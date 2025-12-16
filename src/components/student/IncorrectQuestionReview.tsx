import { useState } from 'react';
import { Question, StudentResult } from '../../types';
import { LaTeX } from '../LaTeX';
import { BookOpen } from 'lucide-react';

interface IncorrectQuestionReviewProps {
  question: Question;
  result: StudentResult;
  questionIndex: number;
}

export function IncorrectQuestionReview({ question, result, questionIndex }: IncorrectQuestionReviewProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrectAnswer = (optionIndex: number) => optionIndex === question.correct_answer;
  const isUserAnswer = (optionIndex: number) => optionIndex === result.answers[question.id];

  return (
    <div className="bg-red-50 rounded-lg shadow-md p-2">
      <h4 className="font-medium text-gray-900 mb-2">
        Question {questionIndex + 1}: {question.question_text}
      </h4>
      
      {question.question_latex && (
        <div className="mb-3 p-3 bg-white rounded">
          <LaTeX block>{question.question_latex}</LaTeX>
        </div>
      )}
      
      {question.image_url && (
        <img 
          src={question.image_url} 
          alt="Question visual" 
          className="mb-3 max-w-sm rounded border"
        />
      )}

      <div className="space-y-2">
        {question.options.map((_option, optionIndex) => {
          if (isCorrectAnswer(optionIndex) || (isUserAnswer(optionIndex) && !isCorrectAnswer(optionIndex))) {
            return (
              <div
                key={optionIndex}
                className={`p-2 rounded text-sm ${
                  isCorrectAnswer(optionIndex)
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {isCorrectAnswer(optionIndex) && '✅ Correct: '}
                {isUserAnswer(optionIndex) && !isCorrectAnswer(optionIndex) && '❌ Your answer: '}
                                            {result.answers[question.id] != null && (
                                                <span className="text-sm sm:text-base text-red-800 break-all">{question.options[result.answers[question.id]]}</span>
                                            )}
              </div>
            );
          }
          return null;
        })}
      </div>

      {question.explanation_latex && (
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
          <h5 
            className="font-medium text-blue-900 mb-2 cursor-pointer"
            onClick={() => setShowExplanation(prev => !prev)}
          >
            Explanation: {showExplanation ? '▲' : '▼'}
          </h5>
          {showExplanation && <LaTeX block>{question.explanation_latex}</LaTeX>}
        </div>
      )}

      {question.video_solution_url && (
        <button
          onClick={() => window.open(question.video_solution_url, '_blank')}
          className="w-full bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 font-medium mt-4 flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Watch Solution Video
        </button>
      )}
    </div>
  );
}
