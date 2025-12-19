import { useState, useEffect } from 'react';
import { questionApi, topicApi } from '../../lib/api';
import { Plus, Edit2, Trash2, FileQuestion, AlertCircle, Filter, Image, Video } from 'lucide-react';

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
    </div>
  );
};
