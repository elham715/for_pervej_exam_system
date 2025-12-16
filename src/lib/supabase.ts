import { createClient } from '@supabase/supabase-js';
import { StudentResult } from '../types';

const supabaseUrl = 'https://fqqyssipgzzdrmzcyyru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXlzc2lwZ3p6ZHJtemN5eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTUxOTIsImV4cCI6MjA3NDM3MTE5Mn0.X2m45Ra_puOURZsm36UX5CfVyOiCWVeZR2WH5moexqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createQuestionSet = async (questionSet: Omit<QuestionSet, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('question_sets')
    .insert([questionSet])
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createExam = async (exam: Omit<Exam, 'id' | 'created_at' | 'exam_link'>) => {
  const { data, error } = await supabase
    .from('exams')
    .insert([exam])
    .select();

  if (error || !data) {
    throw error || new Error('Failed to create exam');
  }

  const newExam = data[0];
  const examLink = `${window.location.origin}?exam=${newExam.id}`;
  const { error: updateError } = await supabase
    .from('exams')
    .update({ exam_link: examLink })
    .eq('id', newExam.id);

  if (updateError) {
    throw updateError;
  }

  return examLink;
};

export const getQuestionSets = async () => {
  const { data, error } = await supabase.from('question_sets').select('*');
  if (error) throw error;
  return data;
};

export const getQuestions = async () => {
  const { data, error } = await supabase.from('questions').select('*');
  if (error) throw error;
  return data;
};

export const getTopics = async () => {
  const { data, error } = await supabase.from('topics').select('*');
  if (error) throw error;
  return data;
};

export const getExams = async () => {
  const { data, error } = await supabase.from('exams').select('*');
  if (error) throw error;
  return data;
};

export const getExam = async (examId: string) => {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (examError) throw examError;

  const { data: questionSets, error: questionSetsError } = await supabase
    .from('question_sets')
    .select('*')
    .in('id', exam.question_set_ids);

  if (questionSetsError) throw questionSetsError;

  const questionIds = questionSets.flatMap(qs => qs.question_ids);

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (questionsError) throw questionsError;

  return { ...exam, questions };
};

export const createQuestion = async (question: Omit<Question, 'id' | 'created_at'>) => {
  const escapedQuestion = {
    ...question,
    explanation_latex: question.explanation_latex ? question.explanation_latex.replace(/\\/g, '\\\\') : null,
  };
  const { data, error } = await supabase
    .from('questions')
    .insert([escapedQuestion])
    .select();

  if (error || !data) {
    throw error || new Error('Failed to create question');
  }

  return data[0];
};

export const addQuestionToSet = async (questionId: string, questionSetId: string) => {
  const { data: questionSet, error: fetchError } = await supabase
    .from('question_sets')
    .select('question_ids')
    .eq('id', questionSetId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const updatedQuestionIds = [...(questionSet.question_ids || []), questionId];

  const { error: updateError } = await supabase
    .from('question_sets')
    .update({ question_ids: updatedQuestionIds })
    .eq('id', questionSetId);

  if (updateError) {
    console.error('Error updating question set with new question:', updateError);
    throw updateError;
  }
};

export const deleteQuestionSet = async (questionSetId: string) => {
  const { error } = await supabase
    .from('question_sets')
    .delete()
    .eq('id', questionSetId);

  if (error) {
    throw error;
  }
};

export const updateQuestion = async (question: Question) => {
  const escapedQuestion = {
    ...question,
    explanation_latex: question.explanation_latex ? question.explanation_latex.replace(/\\/g, '\\\\') : null,
  };
  const { error } = await supabase
    .from('questions')
    .update(escapedQuestion)
    .eq('id', question.id);

  if (error) {
    throw error;
  }
};

export const createTopic = async (topicName: string, explanationVideoUrl?: string) => {
  console.log('Attempting to create topic:', { topicName, explanationVideoUrl });
  const { data, error } = await supabase
    .from('topics')
    .insert([{ name: topicName, explanation_video_url: explanationVideoUrl }])
    .select();

  if (error) {
    console.error('Error from Supabase (createTopic):', error);
    throw error;
  }
  if (!data) {
    console.error('No data returned from Supabase (createTopic).');
    throw new Error('Failed to create topic: No data returned');
  }
  console.log('Topic created successfully:', data[0]);
  return data[0];
};

export const deleteTopic = async (topicId: string) => {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) {
    throw error;
  }
};

export const deleteExam = async (examId: string) => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);

  if (error) {
    throw error;
  }
};

export const getStudentResults = async () => {
  const { data, error } = await supabase.from('student_result').select('*');
  if (error) throw error;
  return data;
};

export const createStudentResult = async (result: StudentResult) => {
  const { data, error } = await supabase
    .from('student_result')
    .insert([result]);

  if (error) {
    throw error;
  }

  return data;
};
