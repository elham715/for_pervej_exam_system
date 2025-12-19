import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Question, Topic } from '../../types';
import { LaTeX } from '../LaTeX';
import { TextWithLaTeX } from '../TextWithLaTeX';
import { topicApi } from '../../lib/api';

interface QuestionFormProps {
  onSubmit: (question: Omit<Question, 'id' | 'created_at'>) => void;
  topics: Topic[];
  onCreateNewTopic: (topicName: string, explanationVideoUrl?: string) => Promise<void>;
}

export function QuestionForm({ onSubmit, topics: propTopics, onCreateNewTopic }: QuestionFormProps) {
  const [topics, setTopics] = useState<Topic[]>(propTopics);
  const [loadingTopics, setLoadingTopics] = useState(false);
  
  const [formData, setFormData] = useState({
    topic: '',
    question_text: '',
    question_latex: '',
    image_url: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation_latex: '',
    video_solution_url: ''
  });

  const [showLatexPreview, setShowLatexPreview] = useState(false);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [showOptionPreview, setShowOptionPreview] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicVideoUrl, setNewTopicVideoUrl] = useState('');

  // Fetch topics from API on mount
  useEffect(() => {
    loadTopicsFromApi();
  }, []);

  // Also update from props if they change
  useEffect(() => {
    if (propTopics && propTopics.length > 0) {
      setTopics(propTopics);
    }
  }, [propTopics]);

  const loadTopicsFromApi = async () => {
    try {
      setLoadingTopics(true);
      const apiTopics = await topicApi.getAll();
      // Convert API response to Topic format
      const convertedTopics: Topic[] = apiTopics.map(t => ({
        id: t.id,
        name: t.name,
        explanation_video_url: t.explanation_video_url,
        created_at: t.created_at,
      }));
      setTopics(convertedTopics);
    } catch (error) {
      console.error('Error loading topics from API:', error);
      // Fallback to prop topics if API fails
      if (propTopics) {
        setTopics(propTopics);
      }
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalTopic = formData.topic;

    if (!finalTopic) {
      alert('Please select a topic.');
      return;
    }

    if (!finalTopic || formData.options.some(opt => !opt.trim()) || (!formData.question_text && !formData.question_latex)) {
      alert('Please fill in all required fields, and make sure to provide either a question text or a LaTeX question.');
      return;
    }

    onSubmit({
      ...formData,
      topic: finalTopic,
      options: formData.options.filter(opt => opt.trim())
    });

    // Reset form
    setFormData({
      topic: '',
      question_text: '',
      question_latex: '',
      image_url: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation_latex: '',
      video_solution_url: ''
    });
    setNewTopicName('');
    setNewTopicVideoUrl('');
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return;
    
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      options: newOptions,
      correct_answer: formData.correct_answer >= index && formData.correct_answer > 0 
        ? formData.correct_answer - 1 
        : formData.correct_answer
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900">Create New Question</h2>
      
      {/* Topic Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Existing Topic *</label>
          <select
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a topic...</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.name}>{topic.name}</option>
            ))}
          </select>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Create New Topic</h3>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new topic name"
          />
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Explanation Video URL (optional)
            </label>
            <input
              type="url"
              value={newTopicVideoUrl}
              onChange={(e) => setNewTopicVideoUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              if (newTopicName.trim()) {
                await onCreateNewTopic(newTopicName.trim(), newTopicVideoUrl);
                setNewTopicName('');
                setNewTopicVideoUrl('');
                alert('New topic created!');
              } else {
                alert('Please enter a topic name.');
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Topic
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Question Text
          </label>
          <button
            type="button"
            onClick={() => setShowQuestionPreview(!showQuestionPreview)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            {showQuestionPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showQuestionPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        <textarea
          value={formData.question_text}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the question..."
        />
        {showQuestionPreview && formData.question_text && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <TextWithLaTeX text={formData.question_text} />
          </div>
        )}
      </div>

      {/* LaTeX Question */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Question LaTeX (Optional)
          </label>
          <button
            type="button"
            onClick={() => setShowLatexPreview(!showLatexPreview)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            {showLatexPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showLatexPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        <textarea
          value={formData.question_latex}
          onChange={(e) => setFormData({ ...formData, question_latex: e.target.value })}
          rows={2}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter LaTeX formula... e.g., \frac{a}{b} = \sqrt{x^2 + y^2}"
        />
        {showLatexPreview && formData.question_latex && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <LaTeX block>{formData.question_latex}</LaTeX>
          </div>
        )}
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL (Optional)
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {formData.image_url && (
          <img 
            src={formData.image_url} 
            alt="Question visual" 
            className="mt-2 max-w-sm rounded-lg border"
            onError={() => setFormData({ ...formData, image_url: '' })}
          />
        )}
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Answer Options *
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowOptionPreview(!showOptionPreview)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              {showOptionPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOptionPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_answer"
                checked={formData.correct_answer === index}
                onChange={() => setFormData({ ...formData, correct_answer: index })}
                className="w-5 h-5 text-green-600"
              />
              {showOptionPreview ? (
                <div className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50">
                  <TextWithLaTeX text={option} />
                </div>
              ) : (
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation LaTeX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation (LaTeX)
        </label>
        <textarea
          value={formData.explanation_latex}
          onChange={(e) => setFormData({ ...formData, explanation_latex: e.target.value })}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter explanation in LaTeX format..."
        />
      </div>

      {/* Video Solution URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Solution URL
        </label>
        <input
          type="url"
          value={formData.video_solution_url}
          onChange={(e) => setFormData({ ...formData, video_solution_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
      >
        Create Question
      </button>
    </form>
  );
}
