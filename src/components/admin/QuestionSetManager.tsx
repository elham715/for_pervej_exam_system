import React, { useState } from 'react';
import { Question, QuestionSet, Topic } from '../../types';
import { QuestionForm } from './QuestionForm';
import { QuestionEditForm } from './QuestionEditForm';
import { Plus, Trash2, BookOpen, CreditCard as Edit3, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { LaTeX } from '../LaTeX';
import { createQuestionSet, createQuestion, addQuestionToSet, deleteQuestionSet, createTopic, updateQuestion } from '../../lib/localStorage';

interface QuestionSetManagerProps {
  questionSets: QuestionSet[];
  questions: Question[];
  topics: Topic[];
  reloadData: () => void;
}

export function QuestionSetManager({
  questionSets,
  questions,
  topics,
  reloadData
}: QuestionSetManagerProps) {
  console.log('QuestionSetManager received topics:', topics);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [newQuestionSetData, setNewQuestionSetData] = useState({
    title: '',
    description: ''
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleCreateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionSetData.title.trim()) {
      alert('Please enter a title for the question set');
      return;
    }

    try {
      await createQuestionSet({
        title: newQuestionSetData.title,
        description: newQuestionSetData.description,
        question_ids: []
      });
      
      setNewQuestionSetData({ title: '', description: '' });
      setShowCreateForm(false);
      alert('Question set created successfully!');
      reloadData();
    } catch (error) {
      console.error('Error creating question set:', error);
      alert('Failed to create question set. See console for details.');
    }
  };

  const handleCreateQuestion = async (questionData: Omit<Question, 'id' | 'created_at'>) => {
    if (!selectedQuestionSet) {
      alert('Please select a question set first');
      return;
    }

    try {
      const newQuestion = await createQuestion(questionData);
      await addQuestionToSet(newQuestion.id, selectedQuestionSet);
      alert('Question created successfully!');
      console.log('Calling reloadData after creating question.');
      reloadData();
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question. See console for details.');
    }
  };

  const handleDeleteQuestionSet = async (questionSetId: string) => {
    if (window.confirm('Are you sure you want to delete this question set? This will also delete all questions in it.')) {
      try {
        await deleteQuestionSet(questionSetId);
        alert('Question set deleted successfully!');
        console.log('Calling reloadData after delete.');
        reloadData();
      } catch (error) {
        console.error('Error deleting question set:', error);
        alert('Failed to delete question set. See console for details.');
      }
    }
  };
  const toggleExpanded = (setId: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
    }
    setExpandedSets(newExpanded);
  };

  const getQuestionsForSet = (questionSetId: string) => {
    const questionSet = questionSets.find(qs => qs.id === questionSetId);
    if (!questionSet) return [];
    return questions.filter(q => questionSet.question_ids.includes(q.id));
  };
  const getUniqueTopics = (): Topic[] => {
    // Assuming 'topics' prop already contains all topics from DB
    return topics;
  };

  const handleCreateNewTopic = async (topicName: string, explanationVideoUrl?: string) => {
    console.log('Attempting to create new topic from UI:', { topicName, explanationVideoUrl });
    try {
      await createTopic(topicName, explanationVideoUrl);
      reloadData();
    } catch (error) {
      console.error('Error creating new topic:', error);
      alert('Failed to create new topic. See console for details.');
    }
  };

  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    try {
      await updateQuestion(updatedQuestion);
      alert('Question updated successfully!');
      setEditingQuestion(null);
      reloadData();
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question. See console for details.');
    }
  };

  if (editingQuestion) {
    return (
      <QuestionEditForm
        question={editingQuestion}
        topics={getUniqueTopics()}
        onSubmit={handleUpdateQuestion}
        onCancel={() => setEditingQuestion(null)}
        onCreateNewTopic={handleCreateNewTopic}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Set Manager</h2>
          <p className="text-gray-600 mt-1">Create and manage question sets with multiple questions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Question Set
        </button>
      </div>

      {/* Create Question Set Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Question Set</h3>
          <form onSubmit={handleCreateQuestionSet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={newQuestionSetData.title}
                onChange={(e) => setNewQuestionSetData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter question set title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newQuestionSetData.description}
                onChange={(e) => setNewQuestionSetData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Question Set
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Question Sets List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Question Sets ({questionSets.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {questionSets.map((questionSet) => {
              const setQuestions = getQuestionsForSet(questionSet.id);
              const isExpanded = expandedSets.has(questionSet.id);
              
              return (
                <div key={questionSet.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleExpanded(questionSet.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">{questionSet.title}</h4>
                      </div>
                      
                      {questionSet.description && (
                        <p className="text-sm text-gray-600 ml-7 mb-2">{questionSet.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 ml-7 text-sm text-gray-500">
                        <span>{setQuestions.length} questions</span>
                        <span>Created {new Date(questionSet.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuestionSet(questionSet.id)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          selectedQuestionSet === questionSet.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestionSet(questionSet.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions */}
                  {isExpanded && (
                    <div className="mt-4 ml-7 space-y-3">
                      {setQuestions.map((question) => (
                        <div key={question.id} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {question.topic}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">{question.question_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setEditingQuestion(question)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            {/* Add delete question button here later */}
                          </div>
                          {question.question_latex && (
                            <div className="mt-1">
                              <LaTeX>{question.question_latex}</LaTeX>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {question.options.length} options
                          </p>
                        </div>
                      ))}
                      
                      {setQuestions.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No questions in this set yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {questionSets.length === 0 && (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No question sets created yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first question set to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Question Form */}
        <div>
          {selectedQuestionSet ? (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900">
                  Adding questions to: {questionSets.find(qs => qs.id === selectedQuestionSet)?.title}
                </h3>
                <button
                  onClick={() => setSelectedQuestionSet(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  Change question set
                </button>
              </div>
              
              <QuestionForm 
                onSubmit={handleCreateQuestion}
                topics={getUniqueTopics()}
                onCreateNewTopic={handleCreateNewTopic}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Question Set</h3>
              <p className="text-gray-600">
                Choose a question set from the list to start adding questions, or create a new question set.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}  