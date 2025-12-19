import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptApi } from '../lib/api';
import { CheckCircle, XCircle, Clock, User, ArrowLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ExamResultsPage() {
  const { examLink, attemptId } = useParams<{ examLink: string; attemptId: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    if (!attemptId) {
      setError('No attempt ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const attemptData = await attemptApi.getById(attemptId);
      setAttempt(attemptData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam results');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load your exam results at this time.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Go Home
            </button>
            <button
              onClick={loadResults}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const score = attempt.score || 0;
  const totalQuestions = attempt.total_questions || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= 60; // Assuming 60% is passing

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam {passed ? 'Completed!' : 'Results'}
          </h1>
          <p className="text-gray-600">
            {attempt.exam?.title || 'Exam Results'}
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Student Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">
                {userData?.name || currentUser?.displayName || 'Student'}
              </p>
              <p className="text-sm text-gray-600">
                {userData?.email || currentUser?.email}
              </p>
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${
              passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {percentage}%
            </div>
            <p className="text-xl text-gray-700 mb-4">
              {score} out of {totalQuestions} correct
            </p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              passed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {passed ? '✓ Passed' : '✗ Not Passed'}
            </div>
          </div>

          {/* Attempt Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Time Taken</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {attempt.time_taken ? `${Math.floor(attempt.time_taken / 60)}m ${attempt.time_taken % 60}s` : 'N/A'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Submitted</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Score Progress</span>
              <span>{score}/{totalQuestions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  passed ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Feedback */}
          <div className={`p-4 rounded-lg ${
            passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              passed ? 'text-green-800' : 'text-red-800'
            }`}>
              {passed 
                ? 'Congratulations! You have successfully passed this exam.'
                : 'You did not meet the passing criteria for this exam. Consider reviewing the material and trying again if retakes are allowed.'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          {examLink && (
            <button
              onClick={() => navigate(`/exam/${examLink}`)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Exam Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}