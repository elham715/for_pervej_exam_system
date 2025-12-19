import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:8000/api/v1';

// API Response types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
};

// Helper function to make authenticated API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    if ('error' in data) {
      throw new Error(data.error.message || 'API request failed');
    }
    throw new Error('API request failed');
  }

  if ('success' in data && data.success) {
    return data.data;
  }

  throw new Error('Invalid API response format');
};

// GET /me response type with firebase_info
interface GetMeResponse {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
  firebase_info?: {
    email_verified: boolean;
    uid: string;
  };
}

// PATCH /me response type
interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

// PATCH /me request body type
interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  college_name?: string;
  address?: string;
}

// Topic API types
interface TopicResponse {
  id: string;
  name: string;
  explanation_video_url?: string;
  created_at: string;
  _count?: {
    questions: number;
  };
}

interface CreateTopicRequest {
  name: string;
  explanation_video_url?: string;
}

interface UpdateTopicRequest {
  name?: string;
  explanation_video_url?: string;
}

interface GetTopicsParams {
  skip?: number;
  take?: number;
  include_count?: boolean;
}

// Admin User Management API types
interface AdminUserResponse {
  id: string;
  firebase_uid?: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: 'ADMIN' | 'STUDENT';
  isEnrolled?: boolean;
  search?: string;
}

interface GetUsersResponse {
  users: AdminUserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UpdateUserRequest {
  name?: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled?: boolean;
  role?: 'ADMIN' | 'STUDENT';
}

interface UpdateEnrollmentRequest {
  is_enrolled: boolean;
}

interface BatchUpdateEnrollmentRequest {
  user_ids: string[];
  is_enrolled: boolean;
}

interface BatchUpdateEnrollmentResponse {
  updated_count: number;
  total_requested: number;
  is_enrolled: boolean;
}

// User API endpoints
export const userApi = {
  /**
   * Get current authenticated user profile
   * GET /me
   * Returns user profile with firebase_info
   */
  getCurrentUser: async (): Promise<GetMeResponse> => {
    return apiCall<GetMeResponse>('/me');
  },

  /**
   * Update user profile
   * PATCH /me
   * Request: { name?, phone?, college_name?, address? }
   * Response includes updated profile and success message
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      throw new Error('Name is required and must be a non-empty string');
    }
    
    return apiCall<UpdateProfileResponse>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ============ ADMIN USER MANAGEMENT ENDPOINTS ============

  /**
   * Get all users with filtering and pagination (Admin only)
   * GET /users
   * Query params: page, limit, role, isEnrolled, search
   */
  getAllUsers: async (params?: GetUsersParams): Promise<GetUsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isEnrolled !== undefined) queryParams.append('isEnrolled', params.isEnrolled.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return apiCall<GetUsersResponse>(`/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get user by ID (Admin only)
   * GET /users/:id
   */
  getUserById: async (userId: string): Promise<AdminUserResponse> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Valid user ID is required');
    }
    return apiCall<AdminUserResponse>(`/users/${userId}`);
  },

  /**
   * Update user profile (Admin or self)
   * PATCH /users/:id
   */
  updateUser: async (userId: string, data: UpdateUserRequest): Promise<AdminUserResponse> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Valid user ID is required');
    }
    return apiCall<AdminUserResponse>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update enrollment status (Admin only)
   * PATCH /users/:id/enrollment
   */
  updateEnrollment: async (userId: string, data: UpdateEnrollmentRequest): Promise<AdminUserResponse> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Valid user ID is required');
    }
    if (typeof data.is_enrolled !== 'boolean') {
      throw new Error('Enrollment status must be a boolean');
    }
    return apiCall<AdminUserResponse>(`/users/${userId}/enrollment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Batch update enrollment status (Admin only)
   * PATCH /users/batch/enrollment
   */
  batchUpdateEnrollment: async (data: BatchUpdateEnrollmentRequest): Promise<BatchUpdateEnrollmentResponse> => {
    if (!data.user_ids || data.user_ids.length === 0) {
      throw new Error('User IDs array is required and must not be empty');
    }
    if (typeof data.is_enrolled !== 'boolean') {
      throw new Error('Enrollment status must be a boolean');
    }
    return apiCall<BatchUpdateEnrollmentResponse>('/users/batch/enrollment', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Topic API endpoints
export const topicApi = {
  /**
   * Get all topics with optional pagination
   * GET /topics
   * Query params: skip, take, include_count
   */
  getAll: async (params?: GetTopicsParams): Promise<TopicResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    if (params?.include_count !== undefined) queryParams.append('include_count', params.include_count.toString());
    
    const endpoint = queryParams.toString() ? `/topics?${queryParams.toString()}` : '/topics';
    return apiCall<TopicResponse[]>(endpoint);
  },

  /**
   * Get topic by ID
   * GET /topics/:id
   */
  getById: async (id: string): Promise<TopicResponse> => {
    return apiCall<TopicResponse>(`/topics/${id}`);
  },

  /**
   * Create new topic (Admin only)
   * POST /topics
   */
  create: async (data: CreateTopicRequest): Promise<TopicResponse> => {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Topic name is required and must be a non-empty string');
    }
    
    return apiCall<TopicResponse>('/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update topic (Admin only)
   * PATCH /topics/:id
   */
  update: async (id: string, data: UpdateTopicRequest): Promise<TopicResponse> => {
    return apiCall<TopicResponse>(`/topics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete topic (Admin only)
   * DELETE /topics/:id
   */
  delete: async (id: string): Promise<void> => {
    return apiCall<void>(`/topics/${id}`, {
      method: 'DELETE',
    });
  },
};

// Question API types
interface QuestionOption {
  id?: string;
  option_index: number;
  option_text: string;
}

interface QuestionResponse {
  id: string;
  topic_id: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  correct_answer_index?: number; // Not included for students
  explanation_latex?: string;
  video_solution_url?: string;
  created_at: string;
  topic?: {
    id: string;
    name: string;
  };
  options: QuestionOption[];
}

interface CreateQuestionRequest {
  topic_id: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  correct_answer_index: number;
  explanation_latex?: string;
  video_solution_url?: string;
  options: Array<{
    option_index: number;
    option_text: string;
  }>;
}

interface UpdateQuestionRequest {
  topic_id?: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  correct_answer_index?: number;
  explanation_latex?: string;
  video_solution_url?: string;
  options?: Array<{
    option_index: number;
    option_text: string;
  }>;
}

interface GetQuestionsParams {
  topic_id?: string;
  skip?: number;
  take?: number;
}

// Question API endpoints
export const questionApi = {
  /**
   * Get all questions with filtering and pagination
   * GET /questions
   */
  getAll: async (params?: GetQuestionsParams): Promise<QuestionResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.topic_id) queryParams.append('topic_id', params.topic_id);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() ? `/questions?${queryParams.toString()}` : '/questions';
    return apiCall<QuestionResponse[]>(endpoint);
  },

  /**
   * Get question by ID
   * GET /questions/:id
   */
  getById: async (id: string): Promise<QuestionResponse> => {
    return apiCall<QuestionResponse>(`/questions/${id}`);
  },

  /**
   * Create new question (Admin only)
   * POST /questions
   */
  create: async (data: CreateQuestionRequest): Promise<QuestionResponse> => {
    // Validation
    if (!data.topic_id || data.topic_id.trim() === '') {
      throw new Error('topic_id is required and must be a string');
    }
    if (data.correct_answer_index < 1 || data.correct_answer_index > 4) {
      throw new Error('correct_answer_index must be an integer between 1 and 4');
    }
    if (!data.question_text && !data.question_latex && !data.image_url) {
      throw new Error('At least one of question_text, question_latex, or image_url must be provided');
    }
    if (!data.options || data.options.length !== 4) {
      throw new Error('Exactly 4 options are required');
    }
    
    // Validate options
    const indices = data.options.map(o => o.option_index);
    if (indices.some(i => i < 1 || i > 4)) {
      throw new Error('Each option must have option_index between 1 and 4');
    }
    if (new Set(indices).size !== indices.length) {
      throw new Error('Duplicate option indices are not allowed');
    }
    
    return apiCall<QuestionResponse>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update question (Admin only)
   * PATCH /questions/:id
   */
  update: async (id: string, data: UpdateQuestionRequest): Promise<QuestionResponse> => {
    return apiCall<QuestionResponse>(`/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete question (Admin only)
   * DELETE /questions/:id
   */
  delete: async (id: string): Promise<void> => {
    return apiCall<void>(`/questions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Question Set API types
interface QuestionSetResponse {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  question_set_questions?: Array<{
    position: number;
    question: QuestionResponse;
  }>;
}

interface CreateQuestionSetRequest {
  title: string;
  description?: string;
}

interface UpdateQuestionSetRequest {
  title?: string;
  description?: string;
}

interface SetQuestionsRequest {
  questions: Array<{
    question_id: string;
    position: number;
  }>;
}

interface GetQuestionSetsParams {
  skip?: number;
  take?: number;
}

// Question Set API endpoints
export const questionSetApi = {
  /**
   * Get all question sets with pagination
   * GET /question-sets
   */
  getAll: async (params?: GetQuestionSetsParams): Promise<QuestionSetResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() ? `/question-sets?${queryParams.toString()}` : '/question-sets';
    return apiCall<QuestionSetResponse[]>(endpoint);
  },

  /**
   * Get question set by ID with questions
   * GET /question-sets/:id
   */
  getById: async (id: string): Promise<QuestionSetResponse> => {
    return apiCall<QuestionSetResponse>(`/question-sets/${id}`);
  },

  /**
   * Create new question set (Admin only)
   * POST /question-sets
   */
  create: async (data: CreateQuestionSetRequest): Promise<QuestionSetResponse> => {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Question set title is required and must be a non-empty string');
    }
    
    return apiCall<QuestionSetResponse>('/question-sets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update question set (Admin only)
   * PATCH /question-sets/:id
   */
  update: async (id: string, data: UpdateQuestionSetRequest): Promise<QuestionSetResponse> => {
    return apiCall<QuestionSetResponse>(`/question-sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete question set (Admin only)
   * DELETE /question-sets/:id
   */
  delete: async (id: string): Promise<void> => {
    return apiCall<void>(`/question-sets/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set questions in question set (Admin only)
   * PUT /question-sets/:id/questions
   */
  setQuestions: async (id: string, data: SetQuestionsRequest): Promise<QuestionSetResponse> => {
    // Validation
    if (!Array.isArray(data.questions)) {
      throw new Error('questions must be an array');
    }
    if (data.questions.length === 0) {
      throw new Error('At least one question is required');
    }
    
    const positions = data.questions.map(q => q.position);
    const questionIds = data.questions.map(q => q.question_id);
    
    // Check sequential positions starting from 1
    const sortedPositions = [...positions].sort((a, b) => a - b);
    if (sortedPositions[0] !== 1 || sortedPositions.some((p, i) => p !== i + 1)) {
      throw new Error('Positions must start from 1 and be sequential without gaps');
    }
    
    // Check for duplicates
    if (new Set(positions).size !== positions.length) {
      throw new Error('Duplicate positions are not allowed');
    }
    if (new Set(questionIds).size !== questionIds.length) {
      throw new Error('Duplicate questions are not allowed in the same question set');
    }
    
    return apiCall<QuestionSetResponse>(`/question-sets/${id}/questions`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove question from question set (Admin only)
   * DELETE /question-sets/:id/questions/:questionId
   */
  removeQuestion: async (id: string, questionId: string): Promise<void> => {
    return apiCall<void>(`/question-sets/${id}/questions/${questionId}`, {
      method: 'DELETE',
    });
  },
};

// Exam API types
interface ExamResponse {
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

interface CreateExamRequest {
  title: string;
  time_limit_seconds: number;
  exam_link: string;
}

interface UpdateExamRequest {
  title?: string;
  time_limit_seconds?: number;
  exam_link?: string;
}

interface SetQuestionSetsRequest {
  question_sets: Array<{
    question_set_id: string;
    position: number;
  }>;
}

interface GetExamsParams {
  skip?: number;
  take?: number;
}

// Exam API endpoints
export const examApi = {
  /**
   * Get all exams with pagination
   * GET /exams
   */
  getAll: async (params?: GetExamsParams): Promise<ExamResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() ? `/exams?${queryParams.toString()}` : '/exams';
    return apiCall<ExamResponse[]>(endpoint);
  },

  /**
   * Get exam by ID
   * GET /exams/:id
   */
  getById: async (id: string): Promise<ExamResponse> => {
    return apiCall<ExamResponse>(`/exams/${id}`);
  },

  /**
   * Get exam by link
   * GET /exams/link/:examLink
   */
  getByLink: async (examLink: string): Promise<ExamResponse> => {
    return apiCall<ExamResponse>(`/exams/link/${examLink}`);
  },

  /**
   * Create new exam (Admin only)
   * POST /exams
   */
  create: async (data: CreateExamRequest): Promise<ExamResponse> => {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Exam title is required and must be a non-empty string');
    }
    if (!data.time_limit_seconds || data.time_limit_seconds <= 0) {
      throw new Error('time_limit_seconds is required and must be a positive integer');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(data.exam_link)) {
      throw new Error('exam_link can only contain letters, numbers, hyphens, and underscores');
    }
    
    return apiCall<ExamResponse>('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update exam (Admin only)
   * PATCH /exams/:id
   */
  update: async (id: string, data: UpdateExamRequest): Promise<ExamResponse> => {
    return apiCall<ExamResponse>(`/exams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete exam (Admin only)
   * DELETE /exams/:id
   */
  delete: async (id: string): Promise<void> => {
    return apiCall<void>(`/exams/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set question sets in exam (Admin only)
   * PUT /exams/:id/question-sets
   */
  setQuestionSets: async (id: string, data: SetQuestionSetsRequest): Promise<ExamResponse> => {
    // Validation
    if (!Array.isArray(data.question_sets)) {
      throw new Error('question_sets must be an array');
    }
    if (data.question_sets.length === 0) {
      throw new Error('At least one question set is required');
    }
    
    const positions = data.question_sets.map(q => q.position);
    const questionSetIds = data.question_sets.map(q => q.question_set_id);
    
    // Check sequential positions starting from 1
    const sortedPositions = [...positions].sort((a, b) => a - b);
    if (sortedPositions[0] !== 1 || sortedPositions.some((p, i) => p !== i + 1)) {
      throw new Error('Positions must start from 1 and be sequential without gaps');
    }
    
    // Check for duplicates
    if (new Set(positions).size !== positions.length) {
      throw new Error('Duplicate positions are not allowed');
    }
    if (new Set(questionSetIds).size !== questionSetIds.length) {
      throw new Error('Duplicate question sets are not allowed in the same exam');
    }
    
    return apiCall<ExamResponse>(`/exams/${id}/question-sets`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove question set from exam (Admin only)
   * DELETE /exams/:id/question-sets/:questionSetId
   */
  removeQuestionSet: async (id: string, questionSetId: string): Promise<void> => {
    return apiCall<void>(`/exams/${id}/question-sets/${questionSetId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all attempts for an exam (Admin only)
   * GET /exams/:id/attempts
   */
  getAttempts: async (id: string, params?: { skip?: number; take?: number }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() 
      ? `/exams/${id}/attempts?${queryParams.toString()}` 
      : `/exams/${id}/attempts`;
    return apiCall<any[]>(endpoint);
  },
};

// Exam Attempt API types
interface AttemptResponse {
  id: string;
  exam_id: string;
  user_id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  total_time_seconds: number;
  submitted_at?: string;
  completed_at?: string;
  score?: number;
  total_questions?: number;
  time_taken_seconds?: number;
  correct_answers?: number;
  topic_performance?: Array<{
    topic_name: string;
    total_questions: number;
    correct_answers: number;
    percentage: number;
  }>;
  exam?: any;
  user?: any;
  answers?: any[];
  questions?: Array<{
    questionSetPosition: number;
    questionPosition: number;
    question: {
      id: string;
      text: string;
      question_latex?: string;
      image_url?: string;
      options: string[];
      marks: number;
      topic?: {
        name: string;
      };
    };
  }>;
}

interface SubmitAnswerRequest {
  question_id: string;
  selected_option_index: number | null;
}

// Exam Attempt API endpoints
export const attemptApi = {
  /**
   * Start a new exam attempt
   * POST /exams/:id/start
   */
  start: async (examId: string): Promise<AttemptResponse> => {
    return apiCall<AttemptResponse>(`/exams/${examId}/start`, {
      method: 'POST',
    });
  },

  /**
   * Submit an answer for a question
   * POST /attempts/:attemptId/answer
   */
  submitAnswer: async (attemptId: string, data: SubmitAnswerRequest): Promise<any> => {
    if (!data.question_id) {
      throw new Error('Question ID is required');
    }
    if (data.selected_option_index !== null && 
        (data.selected_option_index < 1 || data.selected_option_index > 4)) {
      throw new Error('selected_option_index must be an integer between 1 and 4, or null');
    }
    
    return apiCall<any>(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Submit and finalize exam attempt
   * POST /attempts/:attemptId/submit
   */
  submit: async (attemptId: string): Promise<AttemptResponse> => {
    return apiCall<AttemptResponse>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
    });
  },

  /**
   * Get attempt details
   * GET /attempts/:attemptId
   */
  getById: async (attemptId: string): Promise<AttemptResponse> => {
    return apiCall<AttemptResponse>(`/attempts/${attemptId}`);
  },

  /**
   * Get time remaining for an attempt
   * GET /attempts/:attemptId/time-remaining
   */
  getTimeRemaining: async (attemptId: string): Promise<{ time_remaining_seconds: number }> => {
    return apiCall<{ time_remaining_seconds: number }>(`/attempts/${attemptId}/time-remaining`);
  },

  /**
   * Get topic-wise performance for an attempt
   * GET /attempts/:attemptId/topic-performance
   */
  getTopicPerformance: async (attemptId: string): Promise<any[]> => {
    return apiCall<any[]>(`/attempts/${attemptId}/topic-performance`);
  },

  /**
   * Get current user's attempt history
   * GET /me/attempts
   */
  getMyAttempts: async (params?: { skip?: number; take?: number }): Promise<AttemptResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() ? `/me/attempts?${queryParams.toString()}` : '/me/attempts';
    return apiCall<AttemptResponse[]>(endpoint);
  },
};

// ============================================================================
// ANALYTICS API
// ============================================================================

interface UserPerformanceAnalytics {
  userId: string;
  userName: string;
  totalExamsTaken: number;
  completedExams: number;
  averageScore: number | null;
  averageTimeSpent: number;
  completionRate: number;
  topicWisePerformance: Array<{
    topicName: string;
    attempts: number;
    averageScore: number;
    bestScore: number;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    examId: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    scorePercentage: number;
    timeTaken: number;
    completedAt: string | null;
    status: string;
  }>;
  improvementTrend: Array<{
    period: string;
    averageScore: number;
    attemptsCount: number;
  }>;
}

interface ExamHistoryItem {
  attempt_id: string;
  exam_title: string;
  score: number;
  started_at: string;
  submitted_at: string;
  time_taken_minutes: number;
  status: string;
}

interface TopicPerformance {
  topic_id: string;
  topic_name: string;
  total_questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_time_per_question_seconds: number;
}

interface ImprovementTrend {
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  score_progression: Array<{
    exam_date: string;
    score: number;
  }>;
  improvement_rate: number;
}

interface DetailedAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  started_at: string;
  submitted_at: string | null;
  exam: {
    id: string;
    title: string;
    time_limit_seconds: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  exam_answers: Array<{
    id: string;
    question_id: string;
    selected_option_index: number | null;
    is_correct?: boolean; // Only present for SUBMITTED/EXPIRED attempts
    answered_at: string;
    question: {
      id: string;
      question_text: string;
      correct_answer_index?: number; // Only present for SUBMITTED/EXPIRED attempts
      explanation_latex?: string; // Only present for SUBMITTED/EXPIRED attempts
      video_solution_url?: string; // Only present for SUBMITTED/EXPIRED attempts
      image_url?: string;
      options: Array<{
        id: string;
        option_index: number;
        option_text: string;
      }>;
      topic: {
        id: string;
        name: string;
        explanation_video_url?: string; // Only present for SUBMITTED/EXPIRED attempts
      };
    };
  }>;
}

interface ExamAnalytics {
  exam_id: string;
  exam_title: string;
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  average_completion_time_minutes: number;
  question_analytics: Array<{
    question_id: string;
    question_text: string;
    correct_answers: number;
    total_attempts: number;
    accuracy_percentage: number;
  }>;
}

interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  totalAttempts: number;
  completedAttempts: number;
  systemCompletionRate: number;
  averageSystemScore: number;
  topPerformingTopics: Array<{
    topicId: string;
    topicName: string;
    totalQuestions: number;
    totalAttempts: number;
    averageAccuracy: number;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageAttemptsPerUser: number;
  };
  examUsageStats: Array<{
    examId: string;
    examTitle: string;
    totalAttempts: number;
    uniqueUsers: number;
    averageScore: number;
    popularity: number;
  }>;
}

interface ExamUsageStats {
  exam_id: string;
  exam_title: string;
  total_attempts: number;
  unique_users: number;
  completion_rate: number;
  average_score: number;
}

interface TopPerformingTopic {
  topicId: string;
  topicName: string;
  totalQuestions: number;
  totalAttempts: number;
  averageAccuracy: number;
}

export const analyticsApi = {
  /**
   * Get user performance analytics
   * GET /analytics/users/:id
   */
  getUserPerformance: async (userId: string): Promise<UserPerformanceAnalytics> => {
    return apiCall<UserPerformanceAnalytics>(`/analytics/users/${userId}`);
  },

  /**
   * Get user exam history
   * GET /analytics/users/:id/history
   */
  getUserHistory: async (userId: string, params?: { skip?: number; take?: number }): Promise<ExamHistoryItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() 
      ? `/analytics/users/${userId}/history?${queryParams.toString()}` 
      : `/analytics/users/${userId}/history`;
    return apiCall<ExamHistoryItem[]>(endpoint);
  },

  /**
   * Get user topic performance
   * GET /analytics/users/:id/topics
   */
  getUserTopicPerformance: async (userId: string): Promise<TopicPerformance[]> => {
    return apiCall<TopicPerformance[]>(`/analytics/users/${userId}/topics`);
  },

  /**
   * Get user improvement trend
   * GET /analytics/users/:id/trend
   */
  getUserTrend: async (userId: string): Promise<ImprovementTrend> => {
    return apiCall<ImprovementTrend>(`/analytics/users/${userId}/trend`);
  },

  /**
   * Get detailed user attempts with questions and answers (Admin only)
   * GET /analytics/users/:userId/attempts/detailed
   */
  getUserDetailedAttempts: async (userId: string, params?: { skip?: number; take?: number }): Promise<DetailedAttempt[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());
    
    const endpoint = queryParams.toString() 
      ? `/analytics/users/${userId}/attempts/detailed?${queryParams.toString()}` 
      : `/analytics/users/${userId}/attempts/detailed`;
    
    return apiCall<DetailedAttempt[]>(endpoint);
  },



  /**
   * Get exam analytics (Admin only)
   * GET /analytics/exams/:id
   */
  getExamAnalytics: async (examId: string): Promise<ExamAnalytics> => {
    return apiCall<ExamAnalytics>(`/analytics/exams/${examId}`);
  },

  /**
   * Get detailed exam results (Admin only)
   * GET /analytics/exams/:id/detailed
   */
  getDetailedExamResults: async (examId: string, attemptId?: string): Promise<any> => {
    const queryParams = attemptId ? `?attemptId=${attemptId}` : '';
    return apiCall<any>(`/analytics/exams/${examId}/detailed${queryParams}`);
  },

  /**
   * Get system analytics (Admin only)
   * GET /analytics/system
   */
  getSystemAnalytics: async (): Promise<SystemAnalytics> => {
    return apiCall<SystemAnalytics>('/analytics/system');
  },

  /**
   * Get exam usage statistics (Admin only)
   * GET /analytics/exams/usage
   */
  getExamUsageStats: async (): Promise<ExamUsageStats[]> => {
    return apiCall<ExamUsageStats[]>('/analytics/exams/usage');
  },

  /**
   * Get top performing topics (Admin only)
   * GET /analytics/topics/top-performing
   */
  getTopPerformingTopics: async (): Promise<TopPerformingTopic[]> => {
    return apiCall<TopPerformingTopic[]>('/analytics/topics/top-performing');
  },
};

// Export API utilities
export { getAuthToken, apiCall, API_BASE_URL };
