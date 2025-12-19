import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../lib/api';
import { User, Clock, AlertCircle, LogIn } from 'lucide-react';
import { ExamInterface } from '../components/student/ExamInterface';
import { Exam } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/auth/Login';

interface ExamData extends Omit<Exam, 'exam_link'> {
  questions: any[];
}

export function ExamPage() {
  const { examLink } = useParams<{ examLink: string }>();
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    loadExam();
  }, [examLink]);

  const loadExam = async () => {
    if (!examLink) {
      setError('No exam link provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const examData = await examApi.getByLink(examLink);
      setExam({
        ...examData,
        questions: [], // Questions will be loaded when exam starts
        question_sets: []
      } as ExamData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam');
      console.error('Error loading exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
  };

  const handleSubmitExam = async (resultData: any) => {
    try {
      // The ExamInterface already handles the attempt start and answer submission
      // This receives the final result with attemptId from ExamInterface
      if (resultData.attemptId) {
        // Navigate to results page
        navigate(`/exam/${examLink}/results/${resultData.attemptId}`);
      } else {
        throw new Error('No attempt ID received');
      }
    } catch (err: any) {
      console.error('Error handling exam submission:', err);
      alert('Failed to process exam submission. Please try again.');
    }
  };

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Require authentication to take exam
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-12 px-4">
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="text-center mb-6">
              <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">
                You must be logged in to take this exam.
              </p>
              {exam && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Exam:</strong> {exam.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {Math.floor(exam.time_limit_seconds / 60)} minutes
                  </p>
                </div>
              )}
            </div>
          </div>
          <Login />
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The exam you are looking for does not exist or has been removed.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              <p className="text-gray-600 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Time Limit: {Math.floor(exam.time_limit_seconds / 60)} minutes
              </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Logged in as:</p>
                  <p className="text-sm text-gray-700">{userData?.name || currentUser?.displayName}</p>
                  <p className="text-sm text-gray-600">{userData?.email || currentUser?.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleStartExam} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Once you start the exam, the timer will begin immediately. 
                  Make sure you have a stable internet connection.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Start Exam
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExamInterface
      exam={exam as any}
      studentName={userData?.name || currentUser?.displayName || 'Student'}
      studentEmail={userData?.email || currentUser?.email || ''}
      onSubmit={handleSubmitExam}
    />
  );
}
