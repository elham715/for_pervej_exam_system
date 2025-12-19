import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, attemptApi } from '../lib/api';
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
  const [checkingExistingAttempt, setCheckingExistingAttempt] = useState(true);

  useEffect(() => {
    loadExam();
  }, [examLink]);

  const loadExam = async () => {
    if (!examLink) {
      setError('No exam link provided');
      setLoading(false);
      setCheckingExistingAttempt(false);
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
      
      // Check if there's an ongoing attempt with active timer
      if (currentUser) {
        await checkForOngoingAttempt(examData.id);
      } else {
        setCheckingExistingAttempt(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam');
      console.error('Error loading exam:', err);
      setCheckingExistingAttempt(false);
    } finally {
      setLoading(false);
    }
  };
  
  const checkForOngoingAttempt = async (examId: string) => {
    try {
      // Try to get or create an attempt
      const attempt = await attemptApi.start(examId);
      
      // Check if there's a timer running in localStorage
      const timerStartKey = `exam_timer_start_${attempt.id}`;
      const existingTimer = localStorage.getItem(timerStartKey);
      
      if (existingTimer && attempt.status === 'IN_PROGRESS') {
        // Calculate if timer is still valid
        const elapsed = Math.floor((Date.now() - parseInt(existingTimer)) / 1000);
        const remaining = Math.max(0, attempt.total_time_seconds - elapsed);
        
        if (remaining > 0) {
          console.log('🔄 Found ongoing attempt with active timer - skipping start screen', {
            attemptId: attempt.id,
            elapsed,
            remaining
          });
          setShowForm(false); // Skip the form, go directly to exam
        } else {
          console.log('⏰ Found expired attempt - clearing old timer and showing start screen');
          // Timer expired but not submitted yet - clear old timer
          localStorage.removeItem(timerStartKey);
          setShowForm(true);
        }
      } else if (attempt.status === 'IN_PROGRESS' && !existingTimer) {
        // This is a fresh IN_PROGRESS attempt with no timer yet
        // Clear any old timer data for this exam (in case of previous attempts)
        console.log('🆕 Fresh IN_PROGRESS attempt with no timer - showing start screen');
        
        // Clear all old exam timers (just in case)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('exam_timer_start_') && key !== timerStartKey) {
            console.log('🧹 Clearing old timer:', key);
            localStorage.removeItem(key);
          }
        });
        
        setShowForm(true);
      } else {
        console.log('📋 Attempt status:', attempt.status);
        setShowForm(true);
      }
    } catch (err) {
      console.error('Error checking for ongoing attempt:', err);
      setShowForm(true); // Show form on error
    } finally {
      setCheckingExistingAttempt(false);
    }
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
  };

  const handleSubmitExam = (resultData: { attemptId: string }) => {
    try {
      console.log('Exam submitted, navigating to results:', resultData);
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

  // Show loading while checking authentication or existing attempt
  if (authLoading || loading || checkingExistingAttempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingExistingAttempt ? 'Checking for ongoing exam...' : 'Loading exam...'}
          </p>
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

  // Check if student is enrolled (only for students, admins can access all exams)
  if (userData?.role === 'STUDENT' && userData?.is_enrolled === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Required</h2>
          <p className="text-gray-600 mb-6">
            You must be enrolled to take this exam. Please contact your administrator to get enrolled.
          </p>
          {exam && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
              <p className="text-sm text-gray-700 mb-1">
                <strong>Exam:</strong> {exam.title}
              </p>
              <p className="text-sm text-gray-600">
                <Clock className="inline w-4 h-4 mr-1" />
                {Math.floor(exam.time_limit_seconds / 60)} minutes
              </p>
            </div>
          )}
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
