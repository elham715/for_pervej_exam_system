import { useState } from 'react';
import { Question, QuestionSet } from '../../types';
import { Link, Copy, CheckCircle, BookOpen } from 'lucide-react';
import { createExam } from '../../lib/localStorage';

interface ExamBuilderProps {
  questionSets: QuestionSet[];
  questions: Question[];
}

export function ExamBuilder({ questionSets, questions }: ExamBuilderProps) {
  const [examTitle, setExamTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [selectedQuestionSets, setSelectedQuestionSets] = useState<string[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleQuestionSet = (questionSetId: string) => {
    setSelectedQuestionSets(prev =>
      prev.includes(questionSetId)
        ? prev.filter(id => id !== questionSetId)
        : [...prev, questionSetId]
    );
  };

  const getQuestionsForSet = (questionSetId: string) => {
    const questionSet = questionSets.find(qs => qs.id === questionSetId);
    if (!questionSet) return [];
    return questions.filter(q => questionSet.question_ids.includes(q.id));
  };

  const getTotalQuestions = () => {
    return selectedQuestionSets.reduce((total, setId) => {
      return total + getQuestionsForSet(setId).length;
    }, 0);
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim() || selectedQuestionSets.length === 0) {
      alert('Please provide exam title and select at least one question set');
      return;
    }

    setIsCreating(true);
    try {
      const examLink = await createExam({
        title: examTitle,
        question_set_ids: selectedQuestionSets,
        time_limit_minutes: timeLimit
      });

      setGeneratedLink(examLink);
      
      // Reset form
      setExamTitle('');
      setSelectedQuestionSets([]);
      setTimeLimit(60);
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam. See console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Exam</h2>
        <p className="text-gray-600 mt-1">Build exams by selecting question sets and setting time limits</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Enter exam title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes) *
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
              min="1"
              max="300"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCreateExam}
              disabled={isCreating || selectedQuestionSets.length === 0}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Generate Exam Link'}
            </button>
          </div>
        </div>

        {generatedLink && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">Exam Link Generated!</h4>
                <p className="text-sm text-green-600 mt-1">Share this link with students:</p>
                <code className="block mt-2 p-2 bg-white rounded text-sm text-gray-800 break-all">
                  {generatedLink}
                </code>
              </div>
              <button
                onClick={copyLink}
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question Sets Selection */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Question Sets ({selectedQuestionSets.length} selected)
            </h3>
            <div className="text-sm text-gray-600">
              Total Questions: {getTotalQuestions()}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {questionSets.map((questionSet) => {
            const setQuestions = getQuestionsForSet(questionSet.id);
            const isSelected = selectedQuestionSets.includes(questionSet.id);
            
            return (
              <div key={questionSet.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestionSet(questionSet.id)}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{questionSet.title}</h4>
                    </div>
                    
                    {questionSet.description && (
                      <p className="text-gray-600 mb-2">{questionSet.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{setQuestions.length} questions</span>
                      <span>Created {new Date(questionSet.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Show topics in this question set */}
                    {setQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[...new Set(setQuestions.map(q => q.topic))].map(topic => (
                          <span 
                            key={topic}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {questionSets.length === 0 && (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No question sets available</p>
              <p className="text-sm text-gray-400 mt-1">Create question sets first to build exams</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}