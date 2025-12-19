import { useState, useEffect } from 'react';
import { questionSetApi, questionApi } from '../../lib/api';
import { Plus, Edit2, Trash2, List, AlertCircle, ChevronRight, Eye, X, BookOpen } from 'lucide-react';
import { LaTeX } from '../LaTeX';
import { TextWithLaTeX } from '../TextWithLaTeX';

interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  question_set_questions?: Array<{
    position: number;
    question: any;
  }>;
}

interface Question {
  id: string;
  question_text?: string;
  question_latex?: string;
  topic?: {
    name: string;
  };
}

export const QuestionSetManagerTab = () => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingQuestionsId, setManagingQuestionsId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Array<{ question_id: string; position: number }>>([]);
  const [previewSet, setPreviewSet] = useState<QuestionSet | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [setsData, questionsData] = await Promise.all([
        questionSetApi.getAll(),
        questionApi.getAll(),
      ]);
      setQuestionSets(setsData);
      setQuestions(questionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Question set title is required');
      return;
    }

    try {
      setError(null);
      await questionSetApi.create({
        title: formData.title,
        description: formData.description || undefined,
      });
      
      resetForm();
      setIsCreating(false);
      await loadData();
      
      // Show preview of the newly created set
      const updatedSets = await questionSetApi.getAll();
      const newSet = updatedSets.find(s => s.title === formData.title);
      if (newSet) {
        const detailedSet = await questionSetApi.getById(newSet.id);
        setPreviewSet(detailedSet);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create question set');
      console.error('Error creating question set:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;

    try {
      setError(null);
      await questionSetApi.update(editingId, {
        title: formData.title || undefined,
        description: formData.description || undefined,
      });
      
      resetForm();
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update question set');
      console.error('Error updating question set:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await questionSetApi.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete question set');
      console.error('Error deleting question set:', err);
    }
  };

  const startEdit = (set: QuestionSet) => {
    setEditingId(set.id);
    setFormData({
      title: set.title,
      description: set.description || '',
    });
    setIsCreating(false);
    setManagingQuestionsId(null);
  };

  const startManageQuestions = async (set: QuestionSet) => {
    setManagingQuestionsId(set.id);
    setIsCreating(false);
    setEditingId(null);
    
    // Load question set details
    try {
      const detailedSet = await questionSetApi.getById(set.id);
      if (detailedSet.question_set_questions) {
        setSelectedQuestions(
          detailedSet.question_set_questions
            .sort((a, b) => a.position - b.position)
            .map(q => ({
              question_id: q.question.id,
              position: q.position,
            }))
        );
      } else {
        setSelectedQuestions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load question set details');
    }
  };

  const handleSaveQuestions = async () => {
    if (!managingQuestionsId) return;

    if (selectedQuestions.length === 0) {
      setError('At least one question is required');
      return;
    }

    try {
      setError(null);
      await questionSetApi.setQuestions(managingQuestionsId, {
        questions: selectedQuestions,
      });
      
      setManagingQuestionsId(null);
      setSelectedQuestions([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save questions');
      console.error('Error saving questions:', err);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const existingIndex = selectedQuestions.findIndex(q => q.question_id === questionId);
    
    if (existingIndex >= 0) {
      // Remove question and reposition remaining questions
      const newSelected = selectedQuestions
        .filter((_, i) => i !== existingIndex)
        .map((q, i) => ({ ...q, position: i + 1 }));
      setSelectedQuestions(newSelected);
    } else {
      // Add question at the end
      setSelectedQuestions([
        ...selectedQuestions,
        { question_id: questionId, position: selectedQuestions.length + 1 },
      ]);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newSelected = [...selectedQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSelected.length) return;
    
    // Swap
    [newSelected[index], newSelected[targetIndex]] = [newSelected[targetIndex], newSelected[index]];
    
    // Update positions
    newSelected.forEach((q, i) => {
      q.position = i + 1;
    });
    
    setSelectedQuestions(newSelected);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setManagingQuestionsId(null);
    resetForm();
    setError(null);
    setSelectedQuestions([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading question sets...</div>
      </div>
    );
  }

  // Managing Questions View
  if (managingQuestionsId) {
    const currentSet = questionSets.find(s => s.id === managingQuestionsId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Questions</h2>
            <p className="text-gray-600 mt-1">Set: {currentSet?.title}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveQuestions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Available Questions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Available Questions</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questions.map(question => {
                const isSelected = selectedQuestions.some(q => q.question_id === question.id);
                return (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestionSelection(question.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {question.question_text || question.question_latex || 'Image question'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Topic: {question.topic?.name || 'Unknown'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Questions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Selected Questions ({selectedQuestions.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedQuestions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No questions selected. Click questions from the left to add them.
                </p>
              ) : (
                selectedQuestions.map((selected, index) => {
                  const question = questions.find(q => q.id === selected.question_id);
                  return (
                    <div
                      key={selected.question_id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-2"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === selectedQuestions.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {selected.position}. {question?.question_text || question?.question_latex || 'Image question'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Topic: {question?.topic?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Set Management</h2>
          <p className="text-gray-600 mt-1">Organize questions into reusable sets</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Question Set
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Question Set' : 'Create New Question Set'}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Basic Mathematics Set 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe this question set"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Set' : 'Create Set'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Question Sets List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questionSets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <List className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No question sets yet. Create your first set to get started!</p>
                  </td>
                </tr>
              ) : (
                questionSets.map((set) => (
                  <tr key={set.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{set.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {set.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(set.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            const detailedSet = await questionSetApi.getById(set.id);
                            setPreviewSet(detailedSet);
                          }}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview set"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startManageQuestions(set)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage questions"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(set)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit set"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(set.id, set.title)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete set"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{questionSets.length}</div>
          <div className="text-sm text-blue-700">Total Question Sets</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{questions.length}</div>
          <div className="text-sm text-green-700">Available Questions</div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Question Set Preview</h3>
              <button
                onClick={() => setPreviewSet(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Set Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <List className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{previewSet.title}</h4>
                    {previewSet.description && (
                      <p className="text-gray-700 mb-3">{previewSet.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {previewSet.question_set_questions?.length || 0} Questions
                      </span>
                      <span>Created {new Date(previewSet.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions */}
              {previewSet.question_set_questions && previewSet.question_set_questions.length > 0 ? (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-4">Questions in this Set</h5>
                  <div className="space-y-4">
                    {previewSet.question_set_questions.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                            {item.position}
                          </span>
                          <div className="flex-1">
                            {item.question?.topic && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium mb-2">
                                {item.question.topic.name}
                              </span>
                            )}
                            {item.question?.question_text && (
                              <div className="text-gray-800 mb-2">
                                <TextWithLaTeX text={item.question.question_text} />
                              </div>
                            )}
                            {item.question?.question_latex && (
                              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <LaTeX>{item.question.question_latex}</LaTeX>
                              </div>
                            )}
                            {item.question?.options && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {item.question.options.map((opt: any, optIdx: number) => (
                                  <div key={optIdx} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                                    {opt.option_index}. <TextWithLaTeX text={opt.option_text} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <List className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No questions in this set yet</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreviewSet(null);
                    startManageQuestions(previewSet);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  Manage Questions
                </button>
                <button
                  onClick={() => {
                    setPreviewSet(null);
                    startEdit(previewSet);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Set
                </button>
                <button
                  onClick={() => setPreviewSet(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
