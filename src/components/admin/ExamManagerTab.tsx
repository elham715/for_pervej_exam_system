import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi, questionSetApi } from '../../lib/api';
import { Plus, Edit2, Trash2, Calendar, AlertCircle, Clock, Link2, ChevronRight, Users, Eye, X, FileText, List, BarChart3 } from 'lucide-react';
import { LaTeX } from '../LaTeX';
import { TextWithLaTeX } from '../TextWithLaTeX';

interface Exam {
  id: string;
  title: string;
  time_limit_seconds: number;
  exam_link: string;
  created_at: string;
  exam_question_sets?: Array<{
    position: number;
    question_set: any;
  }>;
}

interface QuestionSet {
  id: string;
  title: string;
  description?: string;
}

export const ExamManagerTab = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingSetsId, setManagingSetsId] = useState<string | null>(null);
  const [selectedSets, setSelectedSets] = useState<Array<{ question_set_id: string; position: number }>>([]);
  const [viewAttemptsId, setViewAttemptsId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [attemptsTab, setAttemptsTab] = useState<'list' | 'analysis'>('list');

  const [formData, setFormData] = useState({
    title: '',
    time_limit_seconds: 3600,
    exam_link: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [examsData, setsData] = await Promise.all([
        examApi.getAll(),
        questionSetApi.getAll(),
      ]);
      setExams(examsData);
      setQuestionSets(setsData);
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
      setError('Exam title is required');
      return;
    }

    if (formData.time_limit_seconds <= 0) {
      setError('Time limit must be a positive number');
      return;
    }

    if (!formData.exam_link.trim()) {
      setError('Exam link is required');
      return;
    }

    try {
      setError(null);
      await examApi.create({
        title: formData.title,
        time_limit_seconds: formData.time_limit_seconds,
        exam_link: formData.exam_link,
      });
      
      resetForm();
      setIsCreating(false);
      await loadData();
      
      // Show preview of the newly created exam
      const updatedExams = await examApi.getAll();
      const newExam = updatedExams.find(e => e.exam_link === formData.exam_link);
      if (newExam) {
        const detailedExam = await examApi.getById(newExam.id);
        setPreviewExam(detailedExam);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create exam');
      console.error('Error creating exam:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;

    try {
      setError(null);
      await examApi.update(editingId, {
        title: formData.title || undefined,
        time_limit_seconds: formData.time_limit_seconds || undefined,
        exam_link: formData.exam_link || undefined,
      });
      
      resetForm();
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update exam');
      console.error('Error updating exam:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await examApi.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exam');
      console.error('Error deleting exam:', err);
    }
  };

  const startEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setFormData({
      title: exam.title,
      time_limit_seconds: exam.time_limit_seconds,
      exam_link: exam.exam_link,
    });
    setIsCreating(false);
    setManagingSetsId(null);
    setViewAttemptsId(null);
  };

  const startManageSets = async (exam: Exam) => {
    setManagingSetsId(exam.id);
    setIsCreating(false);
    setEditingId(null);
    setViewAttemptsId(null);
    
    // Load exam details
    try {
      const detailedExam = await examApi.getById(exam.id);
      if (detailedExam.exam_question_sets) {
        setSelectedSets(
          detailedExam.exam_question_sets
            .sort((a, b) => a.position - b.position)
            .map(s => ({
              question_set_id: s.question_set.id,
              position: s.position,
            }))
        );
      } else {
        setSelectedSets([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam details');
    }
  };

  const startViewAttempts = async (exam: Exam) => {
    setViewAttemptsId(exam.id);
    setIsCreating(false);
    setEditingId(null);
    setManagingSetsId(null);
    
    try {
      const attemptsData = await examApi.getAttempts(exam.id);
      setAttempts(attemptsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load attempts');
    }
  };

  const handleSaveSets = async () => {
    if (!managingSetsId) return;

    if (selectedSets.length === 0) {
      setError('At least one question set is required');
      return;
    }

    try {
      setError(null);
      await examApi.setQuestionSets(managingSetsId, {
        question_sets: selectedSets,
      });
      
      setManagingSetsId(null);
      setSelectedSets([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save question sets');
      console.error('Error saving question sets:', err);
    }
  };

  const toggleSetSelection = (setId: string) => {
    const existingIndex = selectedSets.findIndex(s => s.question_set_id === setId);
    
    if (existingIndex >= 0) {
      // Remove set and reposition remaining sets
      const newSelected = selectedSets
        .filter((_, i) => i !== existingIndex)
        .map((s, i) => ({ ...s, position: i + 1 }));
      setSelectedSets(newSelected);
    } else {
      // Add set at the end
      setSelectedSets([
        ...selectedSets,
        { question_set_id: setId, position: selectedSets.length + 1 },
      ]);
    }
  };

  const moveSet = (index: number, direction: 'up' | 'down') => {
    const newSelected = [...selectedSets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSelected.length) return;
    
    // Swap
    [newSelected[index], newSelected[targetIndex]] = [newSelected[targetIndex], newSelected[index]];
    
    // Update positions
    newSelected.forEach((s, i) => {
      s.position = i + 1;
    });
    
    setSelectedSets(newSelected);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      time_limit_seconds: 3600,
      exam_link: '',
    });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setManagingSetsId(null);
    setViewAttemptsId(null);
    resetForm();
    setError(null);
    setSelectedSets([]);
    setAttempts([]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Generate exam link from title
  const generateExamLink = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const copyExamLink = (examLink: string) => {
    const fullLink = `${window.location.origin}/exam/${examLink}`;
    navigator.clipboard.writeText(fullLink);
    alert('Exam link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading exams...</div>
      </div>
    );
  }

  // View Attempts
  if (viewAttemptsId) {
    const currentExam = exams.find(e => e.id === viewAttemptsId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Analysis</h2>
            <p className="text-gray-600 mt-1">Exam: {currentExam?.title}</p>
          </div>
          <button
            onClick={cancelForm}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex gap-1">
          <button
            onClick={() => setAttemptsTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              attemptsTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Attempts List
          </button>
          <button
            onClick={() => setAttemptsTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              attemptsTab === 'analysis'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Detailed Question Analysis
          </button>
        </div>

        {/* Tab Content */}
        {attemptsTab === 'list' ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No attempts yet
                    </td>
                  </tr>
                ) : (
                  attempts.map(attempt => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{attempt.user?.name}</div>
                        <div className="text-sm text-gray-500">{attempt.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          attempt.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' :
                          attempt.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attempt.score !== null ? `${attempt.score?.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(attempt.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
                      </td>
                      <td className="px-6 py-4">
                        {attempt.status === 'SUBMITTED' && (
                          <button
                            onClick={() => navigate(`/admin/exam-review/${attempt.id}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Question Analysis</h3>
              <p className="text-gray-600 mb-6">
                Analyze question performance, common mistakes, and topic-wise statistics for this exam.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-900">{attempts.length}</div>
                    <div className="text-blue-700">Total Attempts</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-900">
                      {attempts.filter(a => a.status === 'SUBMITTED').length}
                    </div>
                    <div className="text-green-700">Completed</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-900">
                      {attempts.length > 0 ? 
                        Math.round(attempts.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score || 0), 0) / attempts.filter(a => a.score !== null).length) || 0
                        : 0}%
                    </div>
                    <div className="text-orange-700">Average Score</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Click on individual student attempts in the "Attempts List" tab to view detailed question-by-question analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Managing Question Sets View
  if (managingSetsId) {
    const currentExam = exams.find(e => e.id === managingSetsId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Question Sets</h2>
            <p className="text-gray-600 mt-1">Exam: {currentExam?.title}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveSets}
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
          {/* Available Question Sets */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Available Question Sets</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questionSets.map(set => {
                const isSelected = selectedSets.some(s => s.question_set_id === set.id);
                return (
                  <div
                    key={set.id}
                    onClick={() => toggleSetSelection(set.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{set.title}</div>
                    {set.description && (
                      <div className="text-xs text-gray-500 mt-1">{set.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Question Sets */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Selected Sets ({selectedSets.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedSets.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No question sets selected. Click sets from the left to add them.
                </p>
              ) : (
                selectedSets.map((selected, index) => {
                  const set = questionSets.find(s => s.id === selected.question_set_id);
                  return (
                    <div
                      key={selected.question_set_id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-2"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSet(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveSet(index, 'down')}
                          disabled={index === selectedSets.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {selected.position}. {set?.title}
                        </div>
                        {set?.description && (
                          <div className="text-xs text-gray-500 mt-1">{set.description}</div>
                        )}
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
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600 mt-1">Create and manage exams with question sets</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Exam
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
            {editingId ? 'Edit Exam' : 'Create New Exam'}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setFormData({ 
                    ...formData, 
                    title: newTitle,
                    exam_link: generateExamLink(newTitle)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics Final Exam 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (seconds) *
              </label>
              <input
                type="number"
                value={formData.time_limit_seconds}
                onChange={(e) => setFormData({ ...formData, time_limit_seconds: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3600"
                required
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formatTime(formData.time_limit_seconds)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Link (Auto-generated from title)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.exam_link}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Enter title above to generate link"
                />
                {formData.exam_link && (
                  <div className="mt-1 text-xs text-gray-500">
                    Full URL: {window.location.origin}/exam/{formData.exam_link}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Exam' : 'Create Exam'}
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

      {/* Exams List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link
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
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No exams yet. Create your first exam to get started!</p>
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{exam.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(exam.time_limit_seconds)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copyExamLink(exam.exam_link)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Link2 className="w-4 h-4" />
                        {exam.exam_link}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            const detailedExam = await examApi.getById(exam.id);
                            setPreviewExam(detailedExam);
                          }}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview exam"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startViewAttempts(exam)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View attempts"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startManageSets(exam)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage question sets"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(exam)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit exam"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete exam"
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
          <div className="text-2xl font-bold text-blue-900">{exams.length}</div>
          <div className="text-sm text-blue-700">Total Exams</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{questionSets.length}</div>
          <div className="text-sm text-green-700">Available Question Sets</div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Exam Preview</h3>
              <button
                onClick={() => setPreviewExam(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Exam Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{previewExam.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(previewExam.time_limit_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <List className="w-4 h-4" />
                        {previewExam.exam_question_sets?.length || 0} Question Sets
                      </span>
                      <span>Created {new Date(previewExam.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Exam Link:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-blue-700 font-mono">
                          {window.location.origin}/exam/{previewExam.exam_link}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/exam/${previewExam.exam_link}`);
                            alert('Link copied to clipboard!');
                          }}
                          className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Sets */}
              {previewExam.exam_question_sets && previewExam.exam_question_sets.length > 0 ? (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-4">Question Sets and Questions</h5>
                  <div className="space-y-6">
                    {previewExam.exam_question_sets.map((item, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                        {/* Question Set Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {item.position}
                            </span>
                            <div className="flex-1">
                              <h6 className="font-bold text-gray-900 mb-1">{item.question_set?.title}</h6>
                              {item.question_set?.description && (
                                <p className="text-sm text-gray-600">{item.question_set.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {item.question_set?.question_set_questions?.length || 0} Questions
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Questions */}
                        {item.question_set?.question_set_questions && item.question_set.question_set_questions.length > 0 ? (
                          <div className="p-4 space-y-4 bg-white">
                            {item.question_set.question_set_questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                {/* Question Header */}
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="flex-shrink-0 w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                    {qIdx + 1}
                                  </span>
                                  <div className="flex-1">
                                    {q.question?.topic && (
                                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-2">
                                        {q.question.topic.name}
                                      </span>
                                    )}
                                    {q.question?.question_latex ? (
                                      <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-2">
                                        <LaTeX>{q.question.question_latex}</LaTeX>
                                      </div>
                                    ) : q.question?.question_text ? (
                                      <div className="text-gray-900 font-medium mb-2">
                                        <TextWithLaTeX text={q.question.question_text} />
                                      </div>
                                    ) : null}
                                    {q.question?.question_image_url && (
                                      <img 
                                        src={q.question.question_image_url} 
                                        alt="Question" 
                                        className="max-w-full h-auto rounded border border-gray-200 mb-2"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Options */}
                                {q.question?.options && q.question.options.length > 0 && (
                                  <div className="ml-10 space-y-2">
                                    {q.question.options
                                      .sort((a: any, b: any) => a.option_index - b.option_index)
                                      .map((option: any) => {
                                        const isCorrect = option.option_index === q.question.correct_answer_index;
                                        return (
                                          <div
                                            key={option.id}
                                            className={`p-3 rounded-lg border-2 ${
                                              isCorrect
                                                ? 'bg-green-50 border-green-500'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                          >
                                            <div className="flex items-start gap-2">
                                              <span className={`font-semibold ${
                                                isCorrect ? 'text-green-700' : 'text-gray-700'
                                              }`}>
                                                {String.fromCharCode(64 + option.option_index)}.
                                              </span>
                                              <div className="flex-1">
                                                {option.option_text && (
                                                  <TextWithLaTeX text={option.option_text} />
                                                )}
                                                {option.option_image_url && (
                                                  <img 
                                                    src={option.option_image_url} 
                                                    alt={`Option ${option.option_index}`}
                                                    className="mt-2 max-w-xs h-auto rounded"
                                                  />
                                                )}
                                                {isCorrect && (
                                                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">
                                                    Correct Answer
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}

                                {/* Explanation */}
                                {q.question?.explanation && (
                                  <div className="ml-10 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Explanation:</p>
                                    <div className="text-sm text-gray-700">
                                      <TextWithLaTeX text={q.question.explanation} />
                                    </div>
                                  </div>
                                )}

                                {/* Video Solution */}
                                {q.question?.video_solution_url && (
                                  <div className="ml-10 mt-2">
                                    <a
                                      href={q.question.video_solution_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                      </svg>
                                      Video Solution
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <p className="text-sm">No questions in this set</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <List className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No question sets in this exam yet</p>
                </div>
              )}

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">Exam Summary</h5>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600 mb-1">Exam ID:</dt>
                    <dd className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">{previewExam.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Time Limit:</dt>
                    <dd className="text-gray-900">{formatTime(previewExam.time_limit_seconds)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Exam Link:</dt>
                    <dd className="text-gray-900 font-mono text-xs">{previewExam.exam_link}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Created:</dt>
                    <dd className="text-gray-900">{new Date(previewExam.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Total Question Sets:</dt>
                    <dd className="text-gray-900">{previewExam.exam_question_sets?.length || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Total Questions:</dt>
                    <dd className="text-gray-900">
                      {previewExam.exam_question_sets?.reduce((sum, set) => 
                        sum + (set.question_set?.question_set_questions?.length || 0), 0
                      ) || 0}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreviewExam(null);
                    startManageSets(previewExam);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  Manage Question Sets
                </button>
                <button
                  onClick={() => {
                    setPreviewExam(null);
                    startEdit(previewExam);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Exam
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/exam/${previewExam.exam_link}`);
                    alert('Exam link copied to clipboard!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </button>
                <button
                  onClick={() => setPreviewExam(null)}
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
