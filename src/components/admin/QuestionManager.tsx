import { useState, useEffect } from 'react';
import { questionApi, topicApi } from '../../lib/api';
import { Plus, Edit2, Trash2, FileQuestion, AlertCircle, Filter, Image, Video, Eye, X } from 'lucide-react';
import { LaTeX } from '../LaTeX';
import { TextWithLaTeX } from '../TextWithLaTeX';

interface Question {
  id: string;
  topic_id: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  correct_answer_index?: number;
  explanation_latex?: string;
  video_solution_url?: string;
  created_at: string;
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

interface Topic {
  id: string;
  name: string;
}

export const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTopicId, setFilterTopicId] = useState<string>('');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    topic_id: '',
    question_text: '',
    question_latex: '',
    image_url: '',
    correct_answer_index: 1,
    explanation_latex: '',
    video_solution_url: '',
    options: ['', '', '', ''],
  });

  useEffect(() => {
    loadData();
  }, [filterTopicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [questionsData, topicsData] = await Promise.all([
        questionApi.getAll(filterTopicId ? { topic_id: filterTopicId } : undefined),
        topicApi.getAll(),
      ]);
      setQuestions(questionsData);
      setTopics(topicsData.map(t => ({ id: t.id, name: t.name })));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic_id) {
      setError('Please select a topic');
      return;
    }

    if (!formData.question_text && !formData.question_latex && !formData.image_url) {
      setError('At least one of question text, LaTeX, or image is required');
      return;
    }

    if (formData.options.some(opt => !opt.trim())) {
      setError('All 4 options are required');
      return;
    }

    try {
      setError(null);
      await questionApi.create({
        topic_id: formData.topic_id,
        question_text: formData.question_text || undefined,
        question_latex: formData.question_latex || undefined,
        image_url: formData.image_url || undefined,
        correct_answer_index: formData.correct_answer_index,
        explanation_latex: formData.explanation_latex || undefined,
        video_solution_url: formData.video_solution_url || undefined,
        options: formData.options.map((text, index) => ({
          option_index: index + 1,
          option_text: text,
        })),
      });
      
      resetForm();
      setIsCreating(false);
      await loadData();
      
      // Show preview of the newly created question
      const updatedQuestions = await questionApi.getAll({ topic_id: formData.topic_id || undefined });
      const newQuestion = updatedQuestions[updatedQuestions.length - 1]; // Latest question
      if (newQuestion) {
        setPreviewQuestion(newQuestion);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create question');
      console.error('Error creating question:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;

    try {
      setError(null);
      await questionApi.update(editingId, {
        topic_id: formData.topic_id || undefined,
        question_text: formData.question_text || undefined,
        question_latex: formData.question_latex || undefined,
        image_url: formData.image_url || undefined,
        correct_answer_index: formData.correct_answer_index,
        explanation_latex: formData.explanation_latex || undefined,
        video_solution_url: formData.video_solution_url || undefined,
        options: formData.options.map((text, index) => ({
          option_index: index + 1,
          option_text: text,
        })),
      });
      
      resetForm();
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update question');
      console.error('Error updating question:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await questionApi.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete question');
      console.error('Error deleting question:', err);
    }
  };

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setFormData({
      topic_id: question.topic_id,
      question_text: question.question_text || '',
      question_latex: question.question_latex || '',
      image_url: question.image_url || '',
      correct_answer_index: question.correct_answer_index || 1,
      explanation_latex: question.explanation_latex || '',
      video_solution_url: question.video_solution_url || '',
      options: question.options
        .sort((a, b) => a.option_index - b.option_index)
        .map(o => o.option_text),
    });
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      topic_id: '',
      question_text: '',
      question_latex: '',
      image_url: '',
      correct_answer_index: 1,
      explanation_latex: '',
      video_solution_url: '',
      options: ['', '', '', ''],
    });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Management</h2>
          <p className="text-gray-600 mt-1">Create and manage exam questions</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Question
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterTopicId}
            onChange={(e) => setFilterTopicId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>
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
            {editingId ? 'Edit Question' : 'Create New Question'}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
              <select
                value={formData.topic_id}
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a topic</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter question text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question LaTeX</label>
              <textarea
                value={formData.question_latex}
                onChange={(e) => setFormData({ ...formData, question_latex: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Enter LaTeX formula"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.options.map((option, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option {index + 1} *
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
              <select
                value={formData.correct_answer_index}
                onChange={(e) => setFormData({ ...formData, correct_answer_index: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {formData.options.map((_, index) => (
                  <option key={index} value={index + 1}>Option {index + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (LaTeX)</label>
              <textarea
                value={formData.explanation_latex}
                onChange={(e) => setFormData({ ...formData, explanation_latex: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Enter explanation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Solution URL</label>
              <input
                type="url"
                value={formData.video_solution_url}
                onChange={(e) => setFormData({ ...formData, video_solution_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/solution.mp4"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Question' : 'Create Question'}
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

      {/* Questions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No questions yet. Create your first question to get started!</p>
                  </td>
                </tr>
              ) : (
                questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {question.question_text || question.question_latex || 'Image question'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {question.topic?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                        Option {question.correct_answer_index || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {question.image_url && (
                          <span title="Has image"><Image className="w-4 h-4 text-blue-600" /></span>
                        )}
                        {question.video_solution_url && (
                          <span title="Has video solution"><Video className="w-4 h-4 text-purple-600" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewQuestion(question)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(question)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete question"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{questions.length}</div>
          <div className="text-sm text-blue-700">Total Questions</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {questions.filter(q => q.image_url).length}
          </div>
          <div className="text-sm text-green-700">With Images</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {questions.filter(q => q.video_solution_url).length}
          </div>
          <div className="text-sm text-purple-700">With Video Solutions</div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Question Preview</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Topic Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {previewQuestion.topic?.name || 'Unknown Topic'}
                </span>
              </div>

              {/* Question Content */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Question</h4>
                
                {previewQuestion.question_text && (
                  <div className="mb-4 text-gray-800">
                    <TextWithLaTeX text={previewQuestion.question_text} />
                  </div>
                )}
                
                {previewQuestion.question_latex && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-200">
                    <LaTeX block>{previewQuestion.question_latex}</LaTeX>
                  </div>
                )}
                
                {previewQuestion.image_url && (
                  <div className="mb-4">
                    <img 
                      src={previewQuestion.image_url} 
                      alt="Question visual" 
                      className="max-w-full rounded-lg border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Answer Options</h4>
                <div className="space-y-3">
                  {previewQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                        option.option_index === previewQuestion.correct_answer_index
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        option.option_index === previewQuestion.correct_answer_index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {option.option_index}
                      </span>
                      <div className="flex-1 pt-1">
                        <TextWithLaTeX text={option.option_text} />
                      </div>
                      {option.option_index === previewQuestion.correct_answer_index && (
                        <span className="text-green-600 font-semibold text-sm">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              {previewQuestion.explanation_latex && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Explanation</h5>
                  <div className="text-gray-800">
                    <LaTeX block>{previewQuestion.explanation_latex}</LaTeX>
                  </div>
                </div>
              )}

              {/* Video Solution */}
              {previewQuestion.video_solution_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Solution
                  </label>
                  <a
                    href={previewQuestion.video_solution_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Watch Solution</span>
                  </a>
                </div>
              )}

              {/* Details */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">Details</h5>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600 mb-1">Question ID:</dt>
                    <dd className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">{previewQuestion.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Created:</dt>
                    <dd className="text-gray-900">{new Date(previewQuestion.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Correct Answer:</dt>
                    <dd className="text-gray-900">Option {previewQuestion.correct_answer_index}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Has Image:</dt>
                    <dd className="text-gray-900">{previewQuestion.image_url ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreviewQuestion(null);
                    startEdit(previewQuestion);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Question
                </button>
                <button
                  onClick={() => setPreviewQuestion(null)}
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
