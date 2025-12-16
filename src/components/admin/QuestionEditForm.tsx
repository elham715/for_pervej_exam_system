import React, { useState, useEffect } from 'react';
import { Question, Topic } from '../../types';
import { PlusCircle, XCircle, Plus } from 'lucide-react';
import { LaTeX } from '../LaTeX';

interface QuestionEditFormProps {
  question: Question;
  topics: Topic[];
  onSubmit: (question: Question) => void;
  onCancel: () => void;
  onCreateNewTopic: (topicName: string, explanationVideoUrl?: string) => Promise<void>;
}

export function QuestionEditForm({ question, topics, onSubmit, onCancel, onCreateNewTopic }: QuestionEditFormProps) {
  const [formData, setFormData] = useState<Question>(question);
  const [newOption, setNewOption] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicVideoUrl, setNewTopicVideoUrl] = useState('');

  useEffect(() => {
    setFormData(question);
  }, [question]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const handleAddOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      options: updatedOptions,
      correct_answer: prev.correct_answer === index ? 0 : (prev.correct_answer > index ? prev.correct_answer - 1 : prev.correct_answer)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.options.length < 2) {
      alert('Please add at least two options.');
      return;
    }

    let finalTopic = formData.topic;

    if (!finalTopic) {
      alert('Please select a topic');
      return;
    }

    onSubmit({
      ...formData,
      topic: finalTopic,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Question</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Existing Topic *</label>
            <select
              name="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a topic...</option>
              {topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
          <textarea
            name="question_text"
            value={formData.question_text}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter question text"
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question LaTeX (optional)</label>
          <textarea
            name="question_latex"
            value={formData.question_latex || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter LaTeX for question (e.g., \frac{1}{2})"
            rows={2}
          />
          {formData.question_latex && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <LaTeX>{formData.question_latex}</LaTeX>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
          <input
            type="text"
            name="image_url"
            value={formData.image_url || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter image URL"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_answer"
                  value={index}
                  checked={formData.correct_answer === index}
                  onChange={() => setFormData(prev => ({ ...prev, correct_answer: index }))}
                  className="w-5 h-5 text-blue-600"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  placeholder={`Option ${index + 1}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg"
              placeholder="Add new option"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Add Option
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Explanation LaTeX (optional)</label>
          <textarea
            name="explanation_latex"
            value={formData.explanation_latex || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter LaTeX for explanation"
            rows={2}
          />
          {formData.explanation_latex && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <LaTeX>{formData.explanation_latex}</LaTeX>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video Solution URL (optional)</label>
          <input
            type="text"
            name="video_solution_url"
            value={formData.video_solution_url || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video solution URL"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
