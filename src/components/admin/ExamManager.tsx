import React, { useState } from 'react';
import { Exam } from '../../types';
import { Trash2, Link, Copy, CheckCircle, Calendar, Clock, BookOpen } from 'lucide-react';

interface ExamManagerProps {
  exams: Exam[];
  onDeleteExam: (examId: string) => Promise<void>;
}

export function ExamManager({ exams, onDeleteExam }: ExamManagerProps) {
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the exam "${examTitle}"? This action cannot be undone.`)) {
      try {
        await onDeleteExam(examId);
        alert('Exam deleted successfully!');
      } catch (error) {
        alert('Failed to delete exam');
      }
    }
  };

  const copyLink = async (examLink: string, examId: string) => {
    try {
      await navigator.clipboard.writeText(examLink);
      setCopiedLinks(prev => new Set([...prev, examId]));
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(examId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      alert('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
        <p className="text-gray-600 mt-1">View and manage all created exams and their links</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            All Exams ({exams.length})
          </h3>
        </div>

        {exams.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Created Yet</h3>
            <p className="text-gray-600">
              Create your first exam to see it listed here. You can then manage exam links and settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <div key={exam.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{exam.time_limit_minutes} minutes</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{exam.question_set_ids.length} question set{exam.question_set_ids.length !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(exam.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Exam Link */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Link className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Exam Link:</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 text-sm text-gray-800 bg-white p-2 rounded border break-all">
                          {exam.exam_link}
                        </code>
                        <button
                          onClick={() => copyLink(exam.exam_link, exam.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          {copiedLinks.has(exam.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}