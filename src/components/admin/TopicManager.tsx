import { useState, useEffect } from 'react';
import { topicApi } from '../../lib/api';
import { Plus, Edit2, Trash2, Video, BookOpen, AlertCircle, Eye, X } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  explanation_video_url?: string;
  created_at: string;
  _count?: {
    questions: number;
  };
}

export const TopicManager = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    explanation_video_url: '',
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await topicApi.getAll({ include_count: true });
      setTopics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load topics');
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Topic name is required');
      return;
    }

    try {
      setError(null);
      await topicApi.create({
        name: formData.name,
        explanation_video_url: formData.explanation_video_url || undefined,
      });
      
      // Reset form, reload, and show preview
      setFormData({ name: '', explanation_video_url: '' });
      setIsCreating(false);
      await loadTopics();
      
      // Show preview of the newly created topic
      const updatedTopics = await topicApi.getAll({ include_count: true });
      const newTopic = updatedTopics.find(t => t.name === formData.name);
      if (newTopic) {
        setPreviewTopic(newTopic);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create topic');
      console.error('Error creating topic:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;

    try {
      setError(null);
      await topicApi.update(editingId, {
        name: formData.name || undefined,
        explanation_video_url: formData.explanation_video_url || undefined,
      });
      
      // Reset form and reload
      setFormData({ name: '', explanation_video_url: '' });
      setEditingId(null);
      await loadTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to update topic');
      console.error('Error updating topic:', err);
    }
  };

  const handleDelete = async (id: string, topicName: string) => {
    if (!confirm(`Are you sure you want to delete "${topicName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await topicApi.delete(id);
      await loadTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to delete topic');
      console.error('Error deleting topic:', err);
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setFormData({
      name: topic.name,
      explanation_video_url: topic.explanation_video_url || '',
    });
    setIsCreating(false);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', explanation_video_url: '' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Topic Management</h2>
          <p className="text-gray-600 mt-1">Manage exam topics and their resources</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Topic
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
            {editingId ? 'Edit Topic' : 'Create New Topic'}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics, Physics"
                required
              />
            </div>

            <div>
              <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
                Explanation Video URL
              </label>
              <input
                type="url"
                id="video"
                value={formData.explanation_video_url}
                onChange={(e) => setFormData({ ...formData, explanation_video_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/video.mp4"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Topic' : 'Create Topic'}
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

      {/* Topics List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Video
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
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No topics yet. Create your first topic to get started!</p>
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{topic.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {topic._count?.questions ?? 0} questions
                    </td>
                    <td className="px-6 py-4">
                      {topic.explanation_video_url ? (
                        <a
                          href={topic.explanation_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Video className="w-4 h-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No video</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(topic.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewTopic(topic)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview topic"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(topic)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit topic"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id, topic.name)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete topic"
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
          <div className="text-2xl font-bold text-blue-900">{topics.length}</div>
          <div className="text-sm text-blue-700">Total Topics</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {topics.reduce((sum, t) => sum + (t._count?.questions ?? 0), 0)}
          </div>
          <div className="text-sm text-green-700">Total Questions</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {topics.filter(t => t.explanation_video_url).length}
          </div>
          <div className="text-sm text-purple-700">Topics with Videos</div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Topic Preview</h3>
              <button
                onClick={() => setPreviewTopic(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Topic Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{previewTopic.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {previewTopic._count?.questions ?? 0} Questions
                      </span>
                      <span>Created {new Date(previewTopic.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video */}
              {previewTopic.explanation_video_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation Video
                  </label>
                  <a
                    href={previewTopic.explanation_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Open Video</span>
                  </a>
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {previewTopic.explanation_video_url}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">Details</h5>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Topic ID:</dt>
                    <dd className="font-mono text-gray-900 text-xs">{previewTopic.id}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Created:</dt>
                    <dd className="text-gray-900">{new Date(previewTopic.created_at).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Video Available:</dt>
                    <dd className="text-gray-900">{previewTopic.explanation_video_url ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreviewTopic(null);
                    startEdit(previewTopic);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Topic
                </button>
                <button
                  onClick={() => setPreviewTopic(null)}
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
