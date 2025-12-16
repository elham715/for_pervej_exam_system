export interface Question {
  id: string;
  topic: string;
  question_text: string;
  question_latex?: string;
  image_url?: string;
  options: string[];
  correct_answer: number;
  explanation_latex?: string;
  video_solution_url?: string;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  explanation_video_url?: string;
  created_at: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  question_ids: string[];
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  question_set_ids: string[];
  time_limit_minutes: number;
  created_at: string;
  exam_link: string;
  questions?: Question[];
}

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

export interface ExamAttempt {
  exam: Exam;
  student_name: string;
  student_email: string;
  start_time: number;
}