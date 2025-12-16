// Local storage implementation to replace Supabase
import { Question, QuestionSet, Exam, Topic, StudentResult } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'omnia_questions',
  QUESTION_SETS: 'omnia_question_sets',
  EXAMS: 'omnia_exams',
  TOPICS: 'omnia_topics',
  RESULTS: 'omnia_results',
};

// Helper functions
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Question Set Functions
export const createQuestionSet = async (questionSet: Omit<QuestionSet, 'id' | 'created_at'>) => {
  const sets = getFromStorage<QuestionSet>(STORAGE_KEYS.QUESTION_SETS);
  const newSet: QuestionSet = {
    ...questionSet,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  sets.push(newSet);
  saveToStorage(STORAGE_KEYS.QUESTION_SETS, sets);
  return newSet;
};

export const getQuestionSets = async () => {
  return getFromStorage<QuestionSet>(STORAGE_KEYS.QUESTION_SETS);
};

export const deleteQuestionSet = async (questionSetId: string) => {
  const sets = getFromStorage<QuestionSet>(STORAGE_KEYS.QUESTION_SETS);
  const filtered = sets.filter(s => s.id !== questionSetId);
  saveToStorage(STORAGE_KEYS.QUESTION_SETS, filtered);
};

// Question Functions
export const createQuestion = async (question: Omit<Question, 'id' | 'created_at'>) => {
  const questions = getFromStorage<Question>(STORAGE_KEYS.QUESTIONS);
  const newQuestion: Question = {
    ...question,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  questions.push(newQuestion);
  saveToStorage(STORAGE_KEYS.QUESTIONS, questions);
  return newQuestion;
};

export const getQuestions = async () => {
  return getFromStorage<Question>(STORAGE_KEYS.QUESTIONS);
};

export const updateQuestion = async (question: Question) => {
  const questions = getFromStorage<Question>(STORAGE_KEYS.QUESTIONS);
  const index = questions.findIndex(q => q.id === question.id);
  if (index !== -1) {
    questions[index] = question;
    saveToStorage(STORAGE_KEYS.QUESTIONS, questions);
  }
};

export const addQuestionToSet = async (questionId: string, questionSetId: string) => {
  const sets = getFromStorage<QuestionSet>(STORAGE_KEYS.QUESTION_SETS);
  const set = sets.find(s => s.id === questionSetId);
  if (set) {
    if (!set.question_ids.includes(questionId)) {
      set.question_ids.push(questionId);
      saveToStorage(STORAGE_KEYS.QUESTION_SETS, sets);
    }
  }
};

// Topic Functions
export const createTopic = async (topicName: string, explanationVideoUrl?: string) => {
  const topics = getFromStorage<Topic>(STORAGE_KEYS.TOPICS);
  const newTopic: Topic = {
    id: generateId(),
    name: topicName,
    explanation_video_url: explanationVideoUrl,
    created_at: new Date().toISOString(),
  };
  topics.push(newTopic);
  saveToStorage(STORAGE_KEYS.TOPICS, topics);
  return newTopic;
};

export const getTopics = async () => {
  return getFromStorage<Topic>(STORAGE_KEYS.TOPICS);
};

export const deleteTopic = async (topicId: string) => {
  const topics = getFromStorage<Topic>(STORAGE_KEYS.TOPICS);
  const filtered = topics.filter(t => t.id !== topicId);
  saveToStorage(STORAGE_KEYS.TOPICS, filtered);
};

// Exam Functions
export const createExam = async (exam: Omit<Exam, 'id' | 'created_at' | 'exam_link'>) => {
  const exams = getFromStorage<Exam>(STORAGE_KEYS.EXAMS);
  const id = generateId();
  const examLink = `${window.location.origin}?exam=${id}`;
  const newExam: Exam = {
    ...exam,
    id,
    exam_link: examLink,
    created_at: new Date().toISOString(),
  };
  exams.push(newExam);
  saveToStorage(STORAGE_KEYS.EXAMS, exams);
  return examLink;
};

export const getExams = async () => {
  return getFromStorage<Exam>(STORAGE_KEYS.EXAMS);
};

export const getExam = async (examId: string) => {
  const exams = getFromStorage<Exam>(STORAGE_KEYS.EXAMS);
  const exam = exams.find(e => e.id === examId);
  if (!exam) return null;

  const sets = getFromStorage<QuestionSet>(STORAGE_KEYS.QUESTION_SETS);
  const allQuestions = getFromStorage<Question>(STORAGE_KEYS.QUESTIONS);

  const examSets = sets.filter(s => exam.question_set_ids.includes(s.id));
  const questionIds = examSets.flatMap(s => s.question_ids);
  const questions = allQuestions.filter(q => questionIds.includes(q.id));

  return { ...exam, questions };
};

export const deleteExam = async (examId: string) => {
  const exams = getFromStorage<Exam>(STORAGE_KEYS.EXAMS);
  const filtered = exams.filter(e => e.id !== examId);
  saveToStorage(STORAGE_KEYS.EXAMS, filtered);
};

// Student Result Functions
export const createStudentResult = async (result: StudentResult) => {
  const results = getFromStorage<StudentResult>(STORAGE_KEYS.RESULTS);
  results.push(result);
  saveToStorage(STORAGE_KEYS.RESULTS, results);
  return result;
};

export const getStudentResults = async () => {
  return getFromStorage<StudentResult>(STORAGE_KEYS.RESULTS);
};
