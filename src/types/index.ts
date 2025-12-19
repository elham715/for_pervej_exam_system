// ==================== Core Entities ====================

/**
 * User Model - Represents a user in the system (Admin or Student)
 */
export interface User {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: Date | string;
}

/**
 * Topic Model - Represents a subject topic
 */
export interface Topic {
  id: string;
  name: string;
  explanation_video_url?: string;
  created_at: Date | string;
}

/**
 * Question Option Model - Represents a single option for a question
 */
export interface QuestionOption {
  id: string;
  question_id: string;
  option_index: number; // 1-4
  option_text: string;
}

/**
 * Question Model - Represents an exam question
 */
export interface Question {
  id: string;
  topic_id: string;
  question_text?: string;
  question_latex?: string;
  image_url?: string;
  correct_answer_index: number; // 1-4
  explanation_latex?: string;
  video_solution_url?: string;
  created_at: Date | string;
  options: QuestionOption[];
  // Computed fields for convenience
  topic?: Topic;
}

/**
 * Question Set Model - A collection of questions
 */
export interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  created_at: Date | string;
  questions?: QuestionSetQuestion[];
}

/**
 * Exam Model - Represents an exam with question sets
 */
export interface Exam {
  id: string;
  title: string;
  time_limit_seconds: number;
  exam_link?: string;
  created_at: Date | string;
  question_sets: ExamQuestionSet[];
  // Computed fields for convenience
  questions?: Question[];
  time_limit_minutes?: number; // For backward compatibility
}

/**
 * Exam Attempt Model - Represents a user's attempt at an exam
 */
export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: Date | string;
  expires_at: Date | string;
  submitted_at?: Date | string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  completed_at?: Date | string;
  answers: ExamAnswer[];
  // Computed fields for convenience
  exam?: Exam;
  user?: User;
}

// ==================== Relationship Models ====================

/**
 * Question Set Question Model - Links questions to question sets
 */
export interface QuestionSetQuestion {
  id: string;
  question_set_id: string;
  question_id: string;
  position: number;
  // Computed fields
  question?: Question;
}

/**
 * Exam Question Set Model - Links question sets to exams
 */
export interface ExamQuestionSet {
  id: string;
  exam_id: string;
  question_set_id: string;
  position: number;
  // Computed fields
  question_set?: QuestionSet;
}

/**
 * Exam Answer Model - Represents a user's answer to a question
 */
export interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_index?: number; // 1-4 or null
  is_correct: boolean;
  // Computed fields
  question?: Question;
}

// ==================== Legacy/Helper Types ====================
// These are kept for backward compatibility with existing components

/**
 * @deprecated Use ExamAttempt instead
 */
export interface StudentResult {
  id: string;
  exam_id: string;
  student_name: string;
  student_email: string;
  answers: Record<string, number>;
  score: number;
  total_questions: number;
  completed_at: string;
  incorrect_topics: string[];
  time_taken_seconds: number;
}

/**
 * Helper type for exam UI state (used in frontend before ExamAttempt is created)
 */
export interface ExamUIState {
  exam: Exam;
  student_name: string;
  student_email: string;
  start_time: number;
}

/**
 * Extended ExamAttempt with UI helper fields
 */
export interface ExamAttemptUI extends ExamAttempt {
  student_name?: string;
  student_email?: string;
  start_time?: number;
}

// ==================== Type Guards ====================

export const isAdmin = (user: User): boolean => {
  return user.role === 'ADMIN';
};

export const isStudent = (user: User): boolean => {
  return user.role === 'STUDENT';
};

export const isExamInProgress = (attempt: ExamAttempt): boolean => {
  return attempt.status === 'IN_PROGRESS';
};

export const isExamSubmitted = (attempt: ExamAttempt): boolean => {
  return attempt.status === 'SUBMITTED';
};

export const isExamExpired = (attempt: ExamAttempt): boolean => {
  return attempt.status === 'EXPIRED';
};