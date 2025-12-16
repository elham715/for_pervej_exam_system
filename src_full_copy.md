# Complete src/ folder (quick copy reference)

Generated: 2025-10-25

This document will contain every file under `src/` with a short description and the full source code for quick copy-paste. I’ll add sections below in chunks for speed.

---

## File index

- src/App.tsx — Main app, routes admin/student views, Supabase session
- src/main.tsx — React entrypoint
- src/index.css — Tailwind CSS entry
- src/vite-env.d.ts — Vite type refs
- src/lib/supabase.ts — Supabase client and data helpers
- src/types/index.ts — Shared domain types
- src/components/LaTeX.tsx — Block LaTeX renderer
- src/components/TextWithLaTeX.tsx — Inline LaTeX in text
- src/components/Timer.tsx — Countdown timer
- src/components/VideoPlayer.tsx — YouTube embed helper
- src/components/auth/Login.tsx — Admin login screen
- src/components/admin/AdminDashboard.tsx — Stats + recent results
- src/components/admin/ExamBuilder.tsx — Build exams, generate links
- src/components/admin/ExamManager.tsx — List/copy/delete exams
- src/components/admin/QuestionForm.tsx — Create new question
- src/components/admin/QuestionEditForm.tsx — Edit question
- src/components/admin/QuestionSetManager.tsx — Manage sets + questions
- src/components/student/ExamInterface.tsx — Timed exam UI
- src/components/student/ResultsPage.tsx — Results + review
- src/components/student/IncorrectQuestionReview.tsx — Per-question review
- src/components/student/TopicHeader.tsx — Topic section header

---

[Sections will be appended below]

## src/App.tsx

Description: Main application component. Handles routing between admin views (question sets, exam builder, exam manager, dashboard) and student flows (exam info, exam interface, results). Uses Supabase for auth and data operations.

```tsx
import React, { useState, useEffect } from 'react';
import { Question, Exam, StudentResult, Topic, ExamAttempt, QuestionSet } from './types';
import { QuestionSetManager } from './components/admin/QuestionSetManager';
import { ExamBuilder } from './components/admin/ExamBuilder';
import { ExamManager } from './components/admin/ExamManager';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ExamInterface } from './components/student/ExamInterface';
import { ResultsPage } from './components/student/ResultsPage';
import { supabase, getQuestions, getQuestionSets, getTopics, getExams, getExam, deleteExam, createStudentResult, getStudentResults } from './lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { 
	BookOpen, 
	BarChart3, 
	User,
	Mail,
	Clock,
	GraduationCap,
	Settings,
	Plus,
	LogOut
} from 'lucide-react';
import Login from './components/auth/Login';
import { Session } from '@supabase/supabase-js';

type View = 'home' | 'question-sets' | 'create-exam' | 'manage-exams' | 'dashboard' | 'student-info' | 'exam' | 'results';

const getInitialView = (): View => {
	const urlParams = new URLSearchParams(window.location.search);
	const examId = urlParams.get('exam');
	if (examId) {
		return 'student-info';
	}
	return 'home';
};

function App() {
	const [currentView, setCurrentView] = useState<View>(getInitialView());
	const [questions, setQuestions] = useState<Question[]>([]);
	const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
	const [exams, setExams] = useState<Exam[]>([]);
	const [results, setResults] = useState<StudentResult[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [currentExam, setCurrentExam] = useState<ExamAttempt | null>(null);
	const [currentResult, setCurrentResult] = useState<StudentResult | null>(null);
	const [studentInfo, setStudentInfo] = useState({ name: '', email: '' });
	const [session, setSession] = useState<Session | null>(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setAuthReady(true);
		});

		supabase.auth.getSession().then(({ data: { session } }) => {
				if (!session) {
						setAuthReady(true);
				}
				setSession(session)
		})

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const examId = urlParams.get('exam');
		if (examId) {
			loadExamFromLink(examId);
		}
	}, []);

	useEffect(() => {
		if (session) {
			loadData();
		}
	}, [session]);

	useEffect(() => {
		const fetchTopics = async () => {
			try {
				const topicsData = await getTopics();
				setTopics(topicsData || []);
			} catch (error) {
				console.error('Error loading topics:', error);
			}
		};
		fetchTopics();
	}, []);

	const loadData = async () => {
		try {
			const [questionsData, questionSetsData, topicsData, examsData, studentResultsData] = await Promise.all([
				getQuestions(),
				getQuestionSets(),
				getTopics(),
				getExams(),
				getStudentResults(),
			]);
			console.log('Fetched student results:', studentResultsData);
			setQuestions(questionsData || []);
			setQuestionSets(questionSetsData || []);
			console.log('Fetched question sets:', questionSetsData);
			setTopics(topicsData || []);
			console.log('Fetched topics:', topicsData);
			setExams(examsData || []);
			setResults(studentResultsData || []);
		} catch (error) {
			console.error('Error loading data:', error);
		}
	};

	const loadExamFromLink = async (examId: string) => {
		try {
			const exam = await getExam(examId);
			if (exam) {
				const examWithQuestions = {
					...exam,
					questions: exam.questions || []
				};
        
				setQuestions(examWithQuestions.questions);

				setCurrentView('student-info');
				(window as any).tempExamData = examWithQuestions;
			} else {
				alert('Exam not found');
				setCurrentView('home');
			}
		} catch (error) {
			console.error('Error loading exam:', error);
			alert('Error loading exam');
			setCurrentView('home');
		}
	};

	const handleStartExam = () => {
		if (!studentInfo.name.trim() || !studentInfo.email.trim()) {
			alert('Please fill in your name and email');
			return;
		}

		const examData = (window as any).tempExamData;
		if (!examData) {
			alert('Exam data not found');
			return;
		}

		setCurrentExam({
			exam: examData,
			student_name: studentInfo.name,
			student_email: studentInfo.email,
			start_time: Date.now()
		});
		setCurrentView('exam');
	};

	const handleSubmitExam = async (resultData: Omit<StudentResult, 'id' | 'completed_at' | 'time_taken_seconds'>) => {
		console.log('handleSubmitExam - resultData:', resultData);
		try {
			const endTime = Date.now();
			const startTime = currentExam ? currentExam.start_time : Date.now();
			const timeTakenInSeconds = Math.round((endTime - startTime) / 1000);

			const result: StudentResult = {
				id: uuidv4(),
				...resultData,
				completed_at: new Date(endTime).toISOString(),
				time_taken_seconds: timeTakenInSeconds,
			};

			await createStudentResult(result);

			console.log('handleSubmitExam - setting currentResult:', result);
			setCurrentResult(result);
			setResults(prev => [result, ...prev]);
			setCurrentView('results');
		} catch (error) {
			console.error('Error submitting exam:', error);
			alert('Failed to submit exam results');
		}
	};

	const handleDeleteExam = async (examId: string) => {
		try {
			await deleteExam(examId);
			setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
		} catch (error) {
			console.error('Error deleting exam:', error);
			throw error; 
		}
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		setCurrentView('home');
	};

	const urlParams = new URLSearchParams(window.location.search);
	const examId = urlParams.get('exam');

	if (examId) {
		if (currentView === 'student-info') {
			return (
				<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
						<div className="text-center mb-6">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
								<GraduationCap className="w-8 h-8 text-blue-600" />
							</div>
							<h1 className="text-2xl font-bold text-gray-900">Ready for Your Exam?</h1>
							<p className="text-gray-600 mt-2">Please enter your information to begin</p>
						</div>

						<form className="space-y-4" onSubmit={(e) => {e.preventDefault(); handleStartExam();}}>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									<User className="inline w-4 h-4 mr-1" />
									Full Name *
								</label>
								<input
									type="text"
									value={studentInfo.name}
									onChange={(e) => setStudentInfo(prev => ({...prev, name: e.target.value}))}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="Enter your full name"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									<Mail className="inline w-4 h-4 mr-1" />
									Email Address *
								</label>
								<input
									type="email"
									value={studentInfo.email}
									onChange={(e) => setStudentInfo(prev => ({...prev, email: e.target.value}))}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="Enter your email address"
									required
								/>
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
			);
		}

		if (currentView === 'exam' && currentExam) {
			return (
				<ExamInterface
					exam={currentExam.exam}
					studentName={currentExam.student_name}
					studentEmail={currentExam.student_email}
					onSubmit={handleSubmitExam}
				/>
			);
		}

		if (currentView === 'results' && currentResult) {
			return (
				<ResultsPage
					result={currentResult}
					questions={currentExam.exam.questions}
					topics={topics}
				/>
			);
		}
	}

	if (!authReady) {
			return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><p>Loading...</p></div>;
	}

	if (!session) {
		return <Login />;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<button
								onClick={() => setCurrentView('home')}
								className="flex items-center gap-2 hover:opacity-80"
							>
								<GraduationCap className="w-8 h-8 text-blue-600" />
								<h1 className="text-xl font-bold text-gray-900">ExamCraft Admin</h1>
							</button>
						</div>
            
						<nav className="flex items-center space-x-4">
							{currentView !== 'home' && (
								<button
									onClick={() => setCurrentView('home')}
									className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium"
								>
									Home
								</button>
							)}
							<button
								onClick={() => setCurrentView('dashboard')}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
									currentView === 'dashboard' 
										? 'bg-blue-100 text-blue-700' 
										: 'text-gray-600 hover:text-gray-900'
								}`}
							>
								<BarChart3 className="w-4 h-4" />
								Dashboard
							</button>
							<button
								onClick={handleLogout}
								className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium"
							>
								<LogOut className="w-4 h-4" />
								Logout
							</button>
						</nav>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto py-8">
				{currentView === 'home' && (
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ExamCraft</h2>
						<p className="text-lg text-gray-600 mb-12">Choose an option to get started</p>
            
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
							<div 
								onClick={() => setCurrentView('question-sets')}
								className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
							>
								<div className="flex flex-col items-center">
									<div className="p-4 bg-blue-100 rounded-full mb-4">
										<BookOpen className="w-8 h-8 text-blue-600" />
									</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">Create Question Set</h3>
									<p className="text-gray-600 text-center">
										Create and manage question sets with multiple questions organized by topics
									</p>
								</div>
							</div>

							<div 
								onClick={() => setCurrentView('create-exam')}
								className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200"
							>
								<div className="flex flex-col items-center">
									<div className="p-4 bg-green-100 rounded-full mb-4">
										<Plus className="w-8 h-8 text-green-600" />
									</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">Create Exam</h3>
									<p className="text-gray-600 text-center">
										Build exams by selecting question sets, set time limits, and generate shareable links
									</p>
								</div>
							</div>

							<div 
								onClick={() => setCurrentView('manage-exams')}
								className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200"
							>
								<div className="flex flex-col items-center">
									<div className="p-4 bg-purple-100 rounded-full mb-4">
										<Settings className="w-8 h-8 text-purple-600" />
									</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">Manage Exams</h3>
									<p className="text-gray-600 text-center">
										View all created exams, manage exam links, and delete exams when needed
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{currentView === 'question-sets' && (
					<QuestionSetManager
						questionSets={questionSets}
						questions={questions}
						topics={topics}
						reloadData={loadData}
					/>
				)}

				{currentView === 'create-exam' && (
					<ExamBuilder
						questionSets={questionSets}
						questions={questions}
					/>
				)}

				{currentView === 'manage-exams' && (
					<ExamManager
						exams={exams}
						onDeleteExam={handleDeleteExam}
					/>
				)}

				{currentView === 'dashboard' && (
					<AdminDashboard
						results={results}
						questions={questions}
					/>
				)}
			</main>
		</div>
	);
}

export default App;
```

## src/main.tsx

Description: Entrypoint that mounts the React application into the DOM using `createRoot`.

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```

## src/index.css

Description: Tailwind entry CSS file.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## src/types/index.ts

Description: Shared TypeScript interfaces for domain models (Question, Topic, QuestionSet, Exam, StudentResult, ExamAttempt).

```ts
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
```

## src/lib/supabase.ts

Description: Supabase client initialization and all data access functions (CRUD for questions, topics, question sets, exams, and student results). Also constructs student exam link after creating an exam and expands exam to include questions for student flow.

```ts
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

```

## src/components/admin/QuestionSetManager.tsx

Description: Admin UI to create/delete question sets, pick a set to add questions, expand to view set questions, and open question edit form.

```tsx
import React, { useState } from 'react';
import { Question, QuestionSet, Topic } from '../../types';
import { QuestionForm } from './QuestionForm';
import { QuestionEditForm } from './QuestionEditForm';
import { Plus, Trash2, BookOpen, CreditCard as Edit3, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { LaTeX } from '../LaTeX';
import { createQuestionSet, createQuestion, addQuestionToSet, deleteQuestionSet, createTopic, updateQuestion } from '../../lib/supabase';

interface QuestionSetManagerProps {
	questionSets: QuestionSet[];
	questions: Question[];
	topics: Topic[];
	reloadData: () => void;
}

export function QuestionSetManager({
	questionSets,
	questions,
	topics,
	reloadData
}: QuestionSetManagerProps) {
	console.log('QuestionSetManager received topics:', topics);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedQuestionSet, setSelectedQuestionSet] = useState<string | null>(null);
	const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
	const [newQuestionSetData, setNewQuestionSetData] = useState({
		title: '',
		description: ''
	});
	const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

	const handleCreateQuestionSet = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newQuestionSetData.title.trim()) {
			alert('Please enter a title for the question set');
			return;
		}

		try {
			await createQuestionSet({
				title: newQuestionSetData.title,
				description: newQuestionSetData.description,
				question_ids: []
			});
      
			setNewQuestionSetData({ title: '', description: '' });
			setShowCreateForm(false);
			alert('Question set created successfully!');
			reloadData();
		} catch (error) {
			console.error('Error creating question set:', error);
			alert('Failed to create question set. See console for details.');
		}
	};

	const handleCreateQuestion = async (questionData: Omit<Question, 'id' | 'created_at'>) => {
		if (!selectedQuestionSet) {
			alert('Please select a question set first');
			return;
		}

		try {
			const newQuestion = await createQuestion(questionData);
			await addQuestionToSet(newQuestion.id, selectedQuestionSet);
			alert('Question created successfully!');
			console.log('Calling reloadData after creating question.');
			reloadData();
		} catch (error) {
			console.error('Error creating question:', error);
			alert('Failed to create question. See console for details.');
		}
	};

	const handleDeleteQuestionSet = async (questionSetId: string) => {
		if (window.confirm('Are you sure you want to delete this question set? This will also delete all questions in it.')) {
			try {
				await deleteQuestionSet(questionSetId);
				alert('Question set deleted successfully!');
				console.log('Calling reloadData after delete.');
				reloadData();
			} catch (error) {
				console.error('Error deleting question set:', error);
				alert('Failed to delete question set. See console for details.');
			}
		}
	};
	const toggleExpanded = (setId: string) => {
		const newExpanded = new Set(expandedSets);
		if (newExpanded.has(setId)) {
			newExpanded.delete(setId);
		} else {
			newExpanded.add(setId);
		}
		setExpandedSets(newExpanded);
	};

	const getQuestionsForSet = (questionSetId: string) => {
		const questionSet = questionSets.find(qs => qs.id === questionSetId);
		if (!questionSet) return [];
		return questions.filter(q => questionSet.question_ids.includes(q.id));
	};
	const getUniqueTopics = (): Topic[] => {
		// Assuming 'topics' prop already contains all topics from DB
		return topics;
	};

	const handleCreateNewTopic = async (topicName: string, explanationVideoUrl?: string) => {
		console.log('Attempting to create new topic from UI:', { topicName, explanationVideoUrl });
		try {
			await createTopic(topicName, explanationVideoUrl);
			reloadData();
		} catch (error) {
			console.error('Error creating new topic:', error);
			alert('Failed to create new topic. See console for details.');
		}
	};

	const handleUpdateQuestion = async (updatedQuestion: Question) => {
		try {
			await updateQuestion(updatedQuestion);
			alert('Question updated successfully!');
			setEditingQuestion(null);
			reloadData();
		} catch (error) {
			console.error('Error updating question:', error);
			alert('Failed to update question. See console for details.');
		}
	};

	if (editingQuestion) {
		return (
			<QuestionEditForm
				question={editingQuestion}
				topics={getUniqueTopics()}
				onSubmit={handleUpdateQuestion}
				onCancel={() => setEditingQuestion(null)}
				onCreateNewTopic={handleCreateNewTopic}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Question Set Manager</h2>
					<p className="text-gray-600 mt-1">Create and manage question sets with multiple questions</p>
				</div>
				<button
					onClick={() => setShowCreateForm(!showCreateForm)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					<Plus className="w-4 h-4" />
					New Question Set
				</button>
			</div>

			{/* Create Question Set Form */}
			{showCreateForm && (
				<div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Question Set</h3>
					<form onSubmit={handleCreateQuestionSet} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Title *
							</label>
							<input
								type="text"
								value={newQuestionSetData.title}
								onChange={(e) => setNewQuestionSetData(prev => ({ ...prev, title: e.target.value }))}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								placeholder="Enter question set title"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Description
							</label>
							<textarea
								value={newQuestionSetData.description}
								onChange={(e) => setNewQuestionSetData(prev => ({ ...prev, description: e.target.value }))}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								placeholder="Enter description (optional)"
								rows={3}
							/>
						</div>
						<div className="flex gap-3">
							<button
								type="submit"
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
							>
								Create Question Set
							</button>
							<button
								type="button"
								onClick={() => setShowCreateForm(false)}
								className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
				{/* Question Sets List */}
				<div className="bg-white rounded-lg shadow-md">
					<div className="p-6 border-b border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900">
							Question Sets ({questionSets.length})
						</h3>
					</div>
          
					<div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
						{questionSets.map((questionSet) => {
							const setQuestions = getQuestionsForSet(questionSet.id);
							const isExpanded = expandedSets.has(questionSet.id);
              
							return (
								<div key={questionSet.id} className="p-4">
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<button
													onClick={() => toggleExpanded(questionSet.id)}
													className="p-1 hover:bg-gray-100 rounded"
												>
													{isExpanded ? (
														<ChevronDown className="w-4 h-4 text-gray-500" />
													) : (
														<ChevronRight className="w-4 h-4 text-gray-500" />
													)}
												</button>
												<BookOpen className="w-5 h-5 text-blue-600" />
												<h4 className="font-medium text-gray-900">{questionSet.title}</h4>
											</div>
                      
											{questionSet.description && (
												<p className="text-sm text-gray-600 ml-7 mb-2">{questionSet.description}</p>
											)}
                      
											<div className="flex items-center gap-4 ml-7 text-sm text-gray-500">
												<span>{setQuestions.length} questions</span>
												<span>Created {new Date(questionSet.created_at).toLocaleDateString()}</span>
											</div>
										</div>
                    
										<div className="flex items-center gap-2">
											<button
												onClick={() => setSelectedQuestionSet(questionSet.id)}
												className={`px-3 py-1 text-sm rounded-lg ${
													selectedQuestionSet === questionSet.id
														? 'bg-blue-100 text-blue-800'
														: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
												}`}
											>
												<Edit3 className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleDeleteQuestionSet(questionSet.id)}
												className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>

									{/* Expanded Questions */}
									{isExpanded && (
										<div className="mt-4 ml-7 space-y-3">
											{setQuestions.map((question) => (
												<div key={question.id} className="border-l-2 border-gray-200 pl-4 py-2">
													<div className="flex items-center gap-2 mb-1">
														<span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
															{question.topic}
														</span>
													</div>
													<p className="text-sm text-gray-900 font-medium">{question.question_text}</p>
													<div className="flex items-center gap-2 mt-2">
														<button
															onClick={() => setEditingQuestion(question)}
															className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
														>
															<Edit className="w-3 h-3" /> Edit
														</button>
														{/* Add delete question button here later */}
													</div>
													{question.question_latex && (
														<div className="mt-1">
															<LaTeX>{question.question_latex}</LaTeX>
														</div>
													)}
													<p className="text-xs text-gray-500 mt-1">
														{question.options.length} options
													</p>
												</div>
											))}
                      
											{setQuestions.length === 0 && (
												<p className="text-sm text-gray-500 italic">No questions in this set yet</p>
											)}
										</div>
									)}
								</div>
							);
						})}
            
						{questionSets.length === 0 && (
							<div className="p-8 text-center">
								<BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-500">No question sets created yet</p>
								<p className="text-sm text-gray-400 mt-1">Create your first question set to get started</p>
							</div>
						)}
					</div>
				</div>

				{/* Question Form */}
				<div>
					{selectedQuestionSet ? (
						<div>
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
								<h3 className="font-medium text-blue-900">
									Adding questions to: {questionSets.find(qs => qs.id === selectedQuestionSet)?.title}
								</h3>
								<button
									onClick={() => setSelectedQuestionSet(null)}
									className="text-sm text-blue-600 hover:text-blue-800 mt-1"
								>
									Change question set
								</button>
							</div>
              
							<QuestionForm 
								onSubmit={handleCreateQuestion}
								topics={getUniqueTopics()}
								onCreateNewTopic={handleCreateNewTopic}
							/>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-md p-8 text-center">
							<BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">Select a Question Set</h3>
							<p className="text-gray-600">
								Choose a question set from the list to start adding questions, or create a new question set.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}  
```

## src/components/admin/QuestionForm.tsx

Description: Form to create a new question with text/LaTeX, image, dynamic options, correct answer selection, explanation LaTeX, and optional video solution; supports creating a new topic inline.

```tsx
import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Question, Topic } from '../../types';
import { LaTeX } from '../LaTeX';

import { TextWithLaTeX } from '../TextWithLaTeX';

interface QuestionFormProps {
	onSubmit: (question: Omit<Question, 'id' | 'created_at'>) => void;
	topics: Topic[];
	onCreateNewTopic: (topicName: string, explanationVideoUrl?: string) => Promise<void>;
}

export function QuestionForm({ onSubmit, topics, onCreateNewTopic }: QuestionFormProps) {
	const [formData, setFormData] = useState({
		topic: '',
		question_text: '',
		question_latex: '',
		image_url: '',
		options: ['', '', '', ''],
		correct_answer: 0,
		explanation_latex: '',
		video_solution_url: ''
	});

	const [showLatexPreview, setShowLatexPreview] = useState(false);
	const [showQuestionPreview, setShowQuestionPreview] = useState(false);
	const [showOptionPreview, setShowOptionPreview] = useState(false);
	const [newTopicName, setNewTopicName] = useState('');
	const [newTopicVideoUrl, setNewTopicVideoUrl] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
    
		let finalTopic = formData.topic;

		if (!finalTopic) {
			alert('Please select a topic.');
			return;
		}

		if (!finalTopic || formData.options.some(opt => !opt.trim()) || (!formData.question_text && !formData.question_latex)) {
			alert('Please fill in all required fields, and make sure to provide either a question text or a LaTeX question.');
			return;
		}

		onSubmit({
			...formData,
			topic: finalTopic,
			options: formData.options.filter(opt => opt.trim())
		});

		// Reset form
		setFormData({
			topic: '',
			question_text: '',
			question_latex: '',
			image_url: '',
			options: ['', '', '', ''],
			correct_answer: 0,
			explanation_latex: '',
			video_solution_url: ''
		});
		setNewTopicName('');
		setNewTopicVideoUrl('');
	};

	const updateOption = (index: number, value: string) => {
		const newOptions = [...formData.options];
		newOptions[index] = value;
		setFormData({ ...formData, options: newOptions });
	};

	const addOption = () => {
		setFormData({
			...formData,
			options: [...formData.options, '']
		});
	};

	const removeOption = (index: number) => {
		if (formData.options.length <= 2) return;
    
		const newOptions = formData.options.filter((_, i) => i !== index);
		setFormData({
			...formData,
			options: newOptions,
			correct_answer: formData.correct_answer >= index && formData.correct_answer > 0 
				? formData.correct_answer - 1 
				: formData.correct_answer
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-xl font-bold text-gray-900">Create New Question</h2>
      
			{/* Topic Selection */}
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Select Existing Topic *</label>
					<select
						value={formData.topic}
						onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
						className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a topic...</option>
						{topics.map((topic) => (
							<option key={topic.id} value={topic.name}>{topic.name}</option>
						))}
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

			{/* Question Text */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-medium text-gray-700">
						Question Text
					</label>
					<button
						type="button"
						onClick={() => setShowQuestionPreview(!showQuestionPreview)}
						className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
					>
						{showQuestionPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						{showQuestionPreview ? 'Hide' : 'Show'} Preview
					</button>
				</div>
				<textarea
					value={formData.question_text}
					onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
					rows={3}
					className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					placeholder="Enter the question..."
				/>
				{showQuestionPreview && formData.question_text && (
					<div className="mt-2 p-3 bg-gray-50 rounded-lg border">
						<TextWithLaTeX text={formData.question_text} />
					</div>
				)}
			</div>

			{/* LaTeX Question */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-medium text-gray-700">
						Question LaTeX (Optional)
					</label>
					<button
						type="button"
						onClick={() => setShowLatexPreview(!showLatexPreview)}
						className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
					>
						{showLatexPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						{showLatexPreview ? 'Hide' : 'Show'} Preview
					</button>
				</div>
				<textarea
					value={formData.question_latex}
					onChange={(e) => setFormData({ ...formData, question_latex: e.target.value })}
					rows={2}
					className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					placeholder="Enter LaTeX formula... e.g., \\frac{a}{b} = \\sqrt{x^2 + y^2}"
				/>
				{showLatexPreview && formData.question_latex && (
					<div className="mt-2 p-3 bg-gray-50 rounded-lg border">
						<LaTeX block>{formData.question_latex}</LaTeX>
					</div>
				)}
			</div>

			{/* Image URL */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Image URL (Optional)
				</label>
				<input
					type="url"
					value={formData.image_url}
					onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
					placeholder="https://example.com/image.jpg"
					className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
				{formData.image_url && (
					<img 
						src={formData.image_url} 
						alt="Question visual" 
						className="mt-2 max-w-sm rounded-lg border"
						onError={() => setFormData({ ...formData, image_url: '' })}
					/>
				)}
			</div>

			{/* Options */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-medium text-gray-700">
						Answer Options *
					</label>
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setShowOptionPreview(!showOptionPreview)}
							className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
						>
							{showOptionPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							{showOptionPreview ? 'Hide' : 'Show'} Preview
						</button>
						<button
							type="button"
							onClick={addOption}
							className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							<Plus className="w-4 h-4" />
							Add Option
						</button>
					</div>
				</div>
        
				<div className="space-y-3">
					{formData.options.map((option, index) => (
						<div key={index} className="flex items-center gap-3">
							<input
								type="radio"
								name="correct_answer"
								checked={formData.correct_answer === index}
								onChange={() => setFormData({ ...formData, correct_answer: index })}
								className="w-5 h-5 text-green-600"
							/>
							{showOptionPreview ? (
								<div className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50">
									<TextWithLaTeX text={option} />
								</div>
							) : (
								<input
									type="text"
									value={option}
									onChange={(e) => updateOption(index, e.target.value)}
									placeholder={`Option ${index + 1}`}
									className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									required
								/>
							)}
							{formData.options.length > 2 && (
								<button
									type="button"
									onClick={() => removeOption(index)}
									className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Explanation LaTeX */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Explanation (LaTeX)
				</label>
				<textarea
					value={formData.explanation_latex}
					onChange={(e) => setFormData({ ...formData, explanation_latex: e.target.value })}
					rows={3}
					className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					placeholder="Enter explanation in LaTeX format..."
				/>
			</div>

			{/* Video Solution URL */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Video Solution URL
				</label>
				<input
					type="url"
					value={formData.video_solution_url}
					onChange={(e) => setFormData({ ...formData, video_solution_url: e.target.value })}
					placeholder="https://youtube.com/watch?v=..."
					className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<button
				type="submit"
				className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
			>
				Create Question
			</button>
		</form>
	);
}

```

## src/components/admin/QuestionEditForm.tsx

Description: Admin form to edit an existing question (text/LaTeX, options, correct answer, video, topic). Supports creating a new topic inline.

```tsx
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
						placeholder="Enter LaTeX for question (e.g., \\frac{1}{2})"
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

```

## src/components/admin/ExamBuilder.tsx

Description: Admin tool to assemble an exam from selected question sets, set a time limit, and generate a shareable student exam link.

```tsx
import React, { useState } from 'react';
import { Question, Exam, QuestionSet } from '../../types';
import { Link, Clock, Copy, CheckCircle, BookOpen } from 'lucide-react';
import { createExam } from '../../lib/supabase';

interface ExamBuilderProps {
	questionSets: QuestionSet[];
	questions: Question[];
}

export function ExamBuilder({ questionSets, questions }: ExamBuilderProps) {
	const [examTitle, setExamTitle] = useState('');
	const [timeLimit, setTimeLimit] = useState(60);
	const [selectedQuestionSets, setSelectedQuestionSets] = useState<string[]>([]);
	const [generatedLink, setGeneratedLink] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);

	const toggleQuestionSet = (questionSetId: string) => {
		setSelectedQuestionSets(prev =>
			prev.includes(questionSetId)
				? prev.filter(id => id !== questionSetId)
				: [...prev, questionSetId]
		);
	};

	const getQuestionsForSet = (questionSetId: string) => {
		const questionSet = questionSets.find(qs => qs.id === questionSetId);
		if (!questionSet) return [];
		return questions.filter(q => questionSet.question_ids.includes(q.id));
	};

	const getTotalQuestions = () => {
		return selectedQuestionSets.reduce((total, setId) => {
			return total + getQuestionsForSet(setId).length;
		}, 0);
	};

	const handleCreateExam = async () => {
		if (!examTitle.trim() || selectedQuestionSets.length === 0) {
			alert('Please provide exam title and select at least one question set');
			return;
		}

		setIsCreating(true);
		try {
			const examLink = await createExam({
				title: examTitle,
				question_set_ids: selectedQuestionSets,
				time_limit_minutes: timeLimit
			});

			setGeneratedLink(examLink);
      
			// Reset form
			setExamTitle('');
			setSelectedQuestionSets([]);
			setTimeLimit(60);
		} catch (error) {
			console.error('Error creating exam:', error);
			alert('Failed to create exam. See console for details.');
		} finally {
			setIsCreating(false);
		}
	};

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(generatedLink);
			setLinkCopied(true);
			setTimeout(() => setLinkCopied(false), 2000);
		} catch (error) {
			alert('Failed to copy link');
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-900">Create Exam</h2>
				<p className="text-gray-600 mt-1">Build exams by selecting question sets and setting time limits</p>
			</div>

			<div className="bg-white p-6 rounded-lg shadow-md">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Configuration</h3>
        
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Exam Title *
						</label>
						<input
							type="text"
							value={examTitle}
							onChange={(e) => setExamTitle(e.target.value)}
							placeholder="Enter exam title"
							className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>
          
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Time Limit (minutes) *
						</label>
						<input
							type="number"
							value={timeLimit}
							onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
							min="1"
							max="300"
							className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>
          
					<div className="flex items-end">
						<button
							onClick={handleCreateExam}
							disabled={isCreating || selectedQuestionSets.length === 0}
							className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
						>
							<Link className="w-4 h-4" />
							{isCreating ? 'Creating...' : 'Generate Exam Link'}
						</button>
					</div>
				</div>

				{generatedLink && (
					<div className="p-4 bg-green-50 rounded-lg border border-green-200">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-green-800">Exam Link Generated!</h4>
								<p className="text-sm text-green-600 mt-1">Share this link with students:</p>
								<code className="block mt-2 p-2 bg-white rounded text-sm text-gray-800 break-all">
									{generatedLink}
								</code>
							</div>
							<button
								onClick={copyLink}
								className="ml-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
							>
								{linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
								{linkCopied ? 'Copied!' : 'Copy'}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Question Sets Selection */}
			<div className="bg-white rounded-lg shadow-md">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900">
							Select Question Sets ({selectedQuestionSets.length} selected)
						</h3>
						<div className="text-sm text-gray-600">
							Total Questions: {getTotalQuestions()}
						</div>
					</div>
				</div>

				<div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
					{questionSets.map((questionSet) => {
						const setQuestions = getQuestionsForSet(questionSet.id);
						const isSelected = selectedQuestionSets.includes(questionSet.id);
            
						return (
							<div key={questionSet.id} className="p-4">
								<div className="flex items-start gap-3">
									<input
										type="checkbox"
										checked={isSelected}
										onChange={() => toggleQuestionSet(questionSet.id)}
										className="mt-1 w-5 h-5 text-blue-600"
									/>
                  
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2">
											<BookOpen className="w-5 h-5 text-blue-600" />
											<h4 className="font-medium text-gray-900">{questionSet.title}</h4>
										</div>
                    
										{questionSet.description && (
											<p className="text-gray-600 mb-2">{questionSet.description}</p>
										)}
                    
										<div className="flex items-center gap-4 text-sm text-gray-500">
											<span>{setQuestions.length} questions</span>
											<span>Created {new Date(questionSet.created_at).toLocaleDateString()}</span>
										</div>

										{/* Show topics in this question set */}
										{setQuestions.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{[...new Set(setQuestions.map(q => q.topic))].map(topic => (
													<span 
														key={topic}
														className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
													>
														{topic}
													</span>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
          
					{questionSets.length === 0 && (
						<div className="p-8 text-center">
							<BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500">No question sets available</p>
							<p className="text-sm text-gray-400 mt-1">Create question sets first to build exams</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
```

## src/components/admin/ExamManager.tsx

Description: Admin list of all exams with link copy and delete actions.

```tsx
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
```

## src/components/admin/AdminDashboard.tsx

Description: Admin dashboard with summary cards, topic performance bars, and recent results table.

```tsx

import React, { useState, useEffect } from 'react';
import { Question, StudentResult, Topic } from '../../types';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';

interface AdminDashboardProps {
	results: StudentResult[];
	questions: Question[];
}

export function AdminDashboard({ results, questions }: AdminDashboardProps) {
	const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

	const totalStudents = results.length;
	const averageScore = results.length > 0 
		? results.reduce((sum, result) => sum + (result.score / result.total_questions) * 100, 0) / results.length
		: 0;

	const topicPerformance = React.useMemo(() => {
		const topics = [...new Set(questions.map(q => q.topic))];
		return topics.map(topic => {
			const topicQuestions = questions.filter(q => q.topic === topic);
			const topicResults = results.map(result => {
				const correct = topicQuestions.filter(q => 
					result.answers[q.id] === q.correct_answer
				).length;
				return (correct / topicQuestions.length) * 100;
			});
      
			const avgPerformance = topicResults.length > 0
				? topicResults.reduce((sum, score) => sum + score, 0) / topicResults.length
				: 0;
      
			return {
				topic,
				performance: Math.round(avgPerformance),
				questionsCount: topicQuestions.length,
				studentsCount: results.length
			};
		});
	}, [results, questions]);

	return (
		<div className="space-y-5">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white p-4 rounded-lg shadow-md">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Users className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-gray-600">Total Students</p>
							<p className="text-xl font-bold text-gray-900">{totalStudents}</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 rounded-lg">
							<FileText className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-gray-600">Total Questions</p>
							<p className="text-xl font-bold text-gray-900">{questions.length}</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-orange-100 rounded-lg">
							<TrendingUp className="w-5 h-5 text-orange-600" />
						</div>
						<div>
							<p className="text-xs text-gray-600">Average Score</p>
							<p className="text-xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-purple-100 rounded-lg">
							<Calendar className="w-5 h-5 text-purple-600" />
						</div>
						<div>
							<p className="text-xs text-gray-600">Topics</p>
							<p className="text-xl font-bold text-gray-900">{topicPerformance.length}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Topic Performance */}
			<div className="bg-white rounded-lg shadow-md p-5">
				<h3 className="text/base font-semibold text-gray-900 mb-3">Topic Performance</h3>
				<div className="space-y-3">
					{topicPerformance.map((topic) => (
						<div key={topic.topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div>
								<h4 className="font-medium text-sm text-gray-900">{topic.topic}</h4>
								<p className="text-xs text-gray-600">
									{topic.questionsCount} questions • {topic.studentsCount} students
								</p>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-28 bg-gray-200 rounded-full h-2.5">
									<div
										className={`h-2.5 rounded-full ${
											topic.performance >= 80 ? 'bg-green-500' : 
											topic.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
										}`}
										style={{ width: `${Math.min(topic.performance, 100)}%` }}
									/>
								</div>
								<span className="text-xs font-medium text-gray-900 w-10 text-right">
									{topic.performance}%
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Recent Results */}
			<div className="bg-white rounded-lg shadow-md">
				<div className="p-5 border-b border-gray-200">
					<h3 className="text-base font-semibold text-gray-900">Recent Exam Results</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Student
								</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Email
								</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Score
								</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Percentage
								</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Topics to Review
								</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Completed
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{results.map((result) => {
								const percentage = Math.round((result.score / result.total_questions) * 100);
								return (
									<tr key={result.id} className="hover:bg-gray-50">
										<td className="px-5 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{result.student_name}
											</div>
										</td>
										<td className="px-5 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-600">
												{result.student_email}
											</div>
										</td>
										<td className="px-5 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{result.score}/{result.total_questions}
											</div>
										</td>
										<td className="px-5 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												percentage >= 80 ? 'bg-green-100 text-green-800' :
												percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
												'bg-red-100 text-red-800'
											}`}>
												{percentage}%
											</span>
										</td>
										<td className="px-5 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-600">
												{result.incorrect_topics.length > 0 
													? result.incorrect_topics.join(', ')
													: 'None - Perfect Score!'
												}
											</div>
										</td>
										<td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
											{new Date(result.completed_at).toLocaleDateString()}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
          
					{results.length === 0 && (
						<div className="text-center py-10">
							<p className="text-gray-500 text-sm">No exam results yet. Share your exam links with students to get started!</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

```

## Next

Reply “continue” to append lib, admin, student, and shared component files immediately.

## src/components/student/ExamInterface.tsx

Description: Student exam-taking UI with timer, progress, question navigation, LaTeX rendering, and submission that computes score and incorrect topics.

```tsx
import React, { useState, useEffect } from 'react';
import { Exam, StudentResult } from '../../types';
import { Timer } from '../Timer';
import { LaTeX } from '../LaTeX';

import { TextWithLaTeX } from '../TextWithLaTeX';

interface ExamInterfaceProps {
	exam: Exam;
	studentName: string;
	studentEmail: string;
	onSubmit: (result: Omit<StudentResult, 'id' | 'completed_at'>) => void;
}

export function ExamInterface({ exam, studentName, studentEmail, onSubmit }: ExamInterfaceProps) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [isSubmitted, setIsSubmitted] = useState(false);

	const currentQuestion = exam.questions[currentQuestionIndex];

	const handleAnswer = (questionId: string, answerIndex: number) => {
		setAnswers(prev => ({
			...prev,
			[questionId]: answerIndex
		}));
	};

	const calculateResults = () => {
		let score = 0;
		const incorrectTopics = new Set<string>();

		exam.questions.forEach(question => {
			const userAnswer = answers[question.id];
			if (userAnswer === question.correct_answer) {
				score++;
			} else {
				incorrectTopics.add(question.topic);
			}
		});

		return {
			score,
			incorrect_topics: Array.from(incorrectTopics)
		};
	};

	const handleSubmit = () => {
		if (isSubmitted) return;

		const { score, incorrect_topics } = calculateResults();
    
		setIsSubmitted(true);
		onSubmit({
			exam_id: exam.id,
			student_name: studentName,
			student_email: studentEmail,
			answers,
			score,
			total_questions: exam.questions.length,
			incorrect_topics
		});
	};

	const handleTimeUp = () => {
		if (!isSubmitted) {
			handleSubmit();
		}
	};

	const nextQuestion = () => {
		if (currentQuestionIndex < exam.questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		}
	};

	const prevQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	const goToQuestion = (index: number) => {
		setCurrentQuestionIndex(index);
	};

	const answeredQuestions = Object.keys(answers).length;
	const progress = (answeredQuestions / exam.questions.length) * 100;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b sticky top-0 z-10">
				<div className="w-full mx-auto py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
							<p className="text-sm text-gray-600">
								Student: {studentName} ({studentEmail})
							</p>
						</div>
						<Timer 
							duration={exam.time_limit_minutes} 
							onTimeUp={handleTimeUp}
							className="flex-shrink-0"
						/>
					</div>
          
					{/* Progress Bar */}
					<div className="mt-4">
						<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
							<span>Progress: {answeredQuestions}/{exam.questions.length} answered</span>
							<span>{Math.round(progress)}% complete</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div 
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full mx-auto py-6">
				<div className="w-full mx-auto">
					{/* Main Question Area */}
					<div>
						<div className="bg-white rounded-lg shadow-sm p-6">
							<div className="flex items-center justify-between mb-4">
								<span className="text-sm text-gray-500">
									Question {currentQuestionIndex + 1} of {exam.questions.length}
								</span>
								<span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
									{currentQuestion.topic}
								</span>
							</div>

							{/* Question Text */}
							<div className="mb-6">
								<div className="text-base font-medium text-gray-900 mb-3">
									<TextWithLaTeX text={currentQuestion.question_text} />
								</div>
                
								{currentQuestion.question_latex && (
									<div className="mb-4 p-4 bg-gray-50 rounded-lg">
										<LaTeX block>{currentQuestion.question_latex}</LaTeX>
									</div>
								)}
                
								{currentQuestion.image_url && (
									<div className="mb-4">
										<img 
											src={currentQuestion.image_url} 
											alt="Question visual" 
											className="max-w-full h-auto rounded-lg border"
										/>
									</div>
								)}
							</div>

							{/* Answer Options */}
							<div className="space-y-3">
								{currentQuestion.options.map((option, index) => (
									<label
										key={index}
										className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
											answers[currentQuestion.id] === index
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
										}`}
									>
										<input
											type="radio"
											name={`question-${currentQuestion.id}`}
											value={index}
											checked={answers[currentQuestion.id] === index}
											onChange={() => handleAnswer(currentQuestion.id, index)}
											className="w-5 h-5 text-blue-600 mr-3"
										/>
										<div className="text-sm text-gray-900">
											<TextWithLaTeX text={option} />
										</div>
									</label>
								))}
							</div>

							{/* Navigation Buttons */}
							<div className="flex items-center justify-between mt-8">
								<button
									onClick={prevQuestion}
									disabled={currentQuestionIndex === 0}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
                
								<div className="flex gap-3">
									{currentQuestionIndex === exam.questions.length - 1 ? (
										<button
											onClick={handleSubmit}
											className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
										>
											Submit Exam
										</button>
									) : (
										<button
											onClick={nextQuestion}
											className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
										>
											Next
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

```

## src/components/student/ResultsPage.tsx

Description: Post-exam results page with summary metrics, topics to review, and detailed incorrect-question breakdown with LaTeX and optional topic videos.

```tsx
import React, { useState } from 'react';
import { StudentResult, Question, Topic } from '../../types';
import { LaTeX } from '../LaTeX';
import { Award, AlertTriangle, CheckCircle2, XCircle, Film, ArrowRight, User } from 'lucide-react';
import { VideoPlayer } from '../VideoPlayer';
import { TextWithLaTeX } from '../TextWithLaTeX';
import { TopicHeader } from './TopicHeader';

interface ResultsPageProps {
	result: StudentResult;
	questions: Question[];
	topics: Topic[];
}

export function ResultsPage({ result, questions, topics }: ResultsPageProps) {
	const [showVideoModal, setShowVideoModal] = useState<string | null>(null);
	const percentage = Math.round((result.score / result.total_questions) * 100);

	const incorrectQuestions = questions.filter(q => result.answers[q.id] !== q.correct_answer);

	const incorrectQuestionsByTopic: { [topicName: string]: Question[] } = {};
	incorrectQuestions.forEach(q => {
		const topicName = q.topic || 'Uncategorized';
		if (!incorrectQuestionsByTopic[topicName]) {
			incorrectQuestionsByTopic[topicName] = [];
		}
		incorrectQuestionsByTopic[topicName].push(q);
	});

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
			<div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
        
				{/* Header Summary Card */}
				<div className="bg-white rounded-xl shadow-lg p-6 md:p-10 lg:p-12 mb-8 md:mb-10 border border-gray-100">
					<div className="flex flex-col items-center text-center">
						<div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 md:mb-5">
							<User className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
						</div>
						<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">Exam Results</h1>
						<p className="text-base md:text-lg text-gray-500 mb-8 md:mb-10">
							Here's a summary of your performance.
						</p>
            
						<div className="grid grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl">
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
								<p className="text-sm md:text-base font-medium text-green-700">Correct</p>
								<p className="text-3xl md:text-4xl font-bold text-green-600">{result.score}</p>
							</div>
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
								<p className="text-sm md:text-base font-medium text-red-700">Incorrect</p>
								<p className="text-3xl md:text-4xl font-bold text-red-600">{result.total_questions - result.score}</p>
							</div>
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
								<p className="text-sm md:text-base font-medium text-blue-700">Score</p>
								<p className="text-3xl md:text-4xl font-bold text-blue-600">{percentage}%</p>
							</div>
							<div className="bg-gray-100 border border-gray-200 rounded-lg p-4 md:p-6">
								<p className="text-sm md:text-base font-medium text-gray-700">Time</p>
								<p className="text-3xl md:text-4xl font-bold text-gray-600">
									{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Topics to Review Card */}
				{result.incorrect_topics.length > 0 && (
					<div className="bg-amber-50 rounded-xl shadow-lg p-6 md:p-10 mb-8 md:mb-10 border border-amber-200">
						<div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left mb-6">
							<div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mb-4 md:mb-0 md:mr-6">
								<AlertTriangle className="w-8 h-8 text-amber-600" />
							</div>
							<div>
								<h2 className="text-2xl md:text-3xl font-bold text-amber-900">Topics to Review</h2>
								<p className="text-base md:text-lg text-amber-700">Focus on these areas to improve your score.</p>
							</div>
						</div>
						<div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
							{result.incorrect_topics.map((topic) => (
								<span key={topic} className="bg-white border border-amber-200 text-amber-800 rounded-full px-4 py-2 text-sm sm:px-5 sm:text-base font-medium">
									{topic}
								</span>
							))}
						</div>
					</div>
				)}
        
				{/* Perfect Score Message */}
				{result.incorrect_topics.length === 0 && (
						<div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-8 md:mb-10 text-center border border-gray-100">
								<div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full mb-5">
										<Award className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
								</div>
								<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">Perfect Score! 🎉</h2>
								<p className="text-lg md:text-xl text-gray-600">
										Congratulations! You answered all questions correctly. Excellent work!
								</p>
						</div>
				)}

				{/* Question Breakdown */}
				{incorrectQuestions.length > 0 && (
						<div className="space-y-6 md:space-y-8">
								<h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6 md:mb-8">Question Breakdown</h2>
								{Object.entries(incorrectQuestionsByTopic).map(([topicName, questions]) => {
										const topic = topics.find(t => t.name === topicName);
										return (
												<div key={topicName} className="bg-gray-100">
														<TopicHeader 
																topicName={topicName} 
																videoUrl={topic?.explanation_video_url}
																onPlayVideo={() => setShowVideoModal(topic?.explanation_video_url || null)}
														/>
														{showVideoModal === topic?.explanation_video_url && (
																<div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVideoModal(null)}>
																		<div className="relative bg-gray-900 p-2 rounded-xl shadow-2xl border-2 border-purple-500 transform scale-105 transition-all duration-300 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
																				<button
																						onClick={() => setShowVideoModal(null)}
																						className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition-colors z-10"
																				>
																						<XCircle className="w-6 h-6" />
																				</button>
																				<VideoPlayer src={showVideoModal} />
																		</div>
																</div>
														)}
														{questions.map((question, index) => (
																<div key={question.id} className="bg-white shadow-lg border border-gray-200 mb-4">
																		<div className="flex items-start gap-4 md:gap-6 p-5 md:p-8">
																				<div className="flex-1 min-w-0">
																						<div className="text-sm md:text-base font-medium text-gray-800 mb-5">
																							<TextWithLaTeX text={question.question_text} />
																						</div>
																						{question.question_latex && (
																								<div className="mb-5 p-4 bg-gray-50 border border-gray-200 overflow-x-auto">
																										<LaTeX block>{question.question_latex}</LaTeX>
																								</div>
																						)}
																						<div className="space-y-4">
																								{/* Your Answer */}
																								<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
																										<div className="text-sm sm:text-base font-medium text-red-700 w-full sm:w-36 flex-shrink-0">Your answer</div>
																										<div className="w-full flex-1 bg-red-100 border border-red-200 p-3 sm:p-4 flex items-center gap-3">
																												<XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
																												<div className="text-xs sm:text-sm text-red-800 break-all">
																													{result.answers[question.id] != null && <TextWithLaTeX text={question.options[result.answers[question.id]]} />}
																												</div>
																										</div>
																								</div>
																								{/* Correct Answer */}
																								<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
																										<div className="text-sm sm:text-base font-medium text-green-700 w-full sm:w-36 flex-shrink-0">Correct answer</div>
																										<div className="w-full flex-1 bg-green-100 border border-green-200 p-3 sm:p-4 flex items-center gap-3">
																												<CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
																												<div className="text-xs sm:text-sm text-green-800 break-all">
																													<TextWithLaTeX text={question.options[question.correct_answer]} />
																												</div>
																										</div>
																								</div>
																						</div>
																						{question.video_solution_url && (
																								<button
																										onClick={() => window.open(question.video_solution_url, '_blank')}
																										className="mt-6 sm:mt-8 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
																										title="Watch Solution Video"
																								>
																										<Film className="w-5 h-5" />
																										<span className="sr-only">Watch Solution Video</span>
																								</button>
																						)}
																				</div>
																		</div>
																</div>
														))}
												</div>
										)
								})}
						</div>
				)}

				{/* Final Action Button */}
				<div className="mt-12 md:mt-16 text-center">
					<button
						onClick={() => window.location.reload()}
						className="w-full sm:w-auto bg-blue-600 text-white font-bold py-4 px-6 sm:py-5 sm:px-10 rounded-lg hover:bg-blue-700 transition-colors text-lg sm:text-xl shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-3"
					>
						Take Another Exam
						<ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>
			</div>
		</div>
	);
}
```

## src/components/student/IncorrectQuestionReview.tsx

Description: A compact card used to show a single incorrect question highlighting user answer vs correct answer and optional explanations/video.

```tsx
import React, { useState } from 'react';
import { Question, StudentResult } from '../../types';
import { LaTeX } from '../LaTeX';
import { VideoPlayer } from '../VideoPlayer';
import { BookOpen } from 'lucide-react';

interface IncorrectQuestionReviewProps {
	question: Question;
	result: StudentResult;
	questionIndex: number;
}

export function IncorrectQuestionReview({ question, result, questionIndex }: IncorrectQuestionReviewProps) {
	const [showExplanation, setShowExplanation] = useState(false);

	const isCorrectAnswer = (optionIndex: number) => optionIndex === question.correct_answer;
	const isUserAnswer = (optionIndex: number) => optionIndex === result.answers[question.id];

	return (
		<div className="bg-red-50 rounded-lg shadow-md p-2">
			<h4 className="font-medium text-gray-900 mb-2">
				Question {questionIndex + 1}: {question.question_text}
			</h4>
      
			{question.question_latex && (
				<div className="mb-3 p-3 bg-white rounded">
					<LaTeX block>{question.question_latex}</LaTeX>
				</div>
			)}
      
			{question.image_url && (
				<img 
					src={question.image_url} 
					alt="Question visual" 
					className="mb-3 max-w-sm rounded border"
				/>
			)}

			<div className="space-y-2">
				{question.options.map((option, optionIndex) => {
					if (isCorrectAnswer(optionIndex) || (isUserAnswer(optionIndex) && !isCorrectAnswer(optionIndex))) {
						return (
							<div
								key={optionIndex}
								className={`p-2 rounded text-sm ${
									isCorrectAnswer(optionIndex)
										? 'bg-green-100 text-green-800 border border-green-300'
										: 'bg-red-100 text-red-800 border border-red-300'
								}`}
							>
								{isCorrectAnswer(optionIndex) && '✅ Correct: '}
								{isUserAnswer(optionIndex) && !isCorrectAnswer(optionIndex) && '❌ Your answer: '}
																						{result.answers[question.id] != null && (
																								<span className="text-sm sm:text-base text-red-800 break-all">{question.options[result.answers[question.id]]}</span>
																						)}
							</div>
						);
					}
					return null;
				})}
			</div>

			{question.explanation_latex && (
				<div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
					<h5 
						className="font-medium text-blue-900 mb-2 cursor-pointer"
						onClick={() => setShowExplanation(prev => !prev)}
					>
						Explanation: {showExplanation ? '▲' : '▼'}
					</h5>
					{showExplanation && <LaTeX block>{question.explanation_latex}</LaTeX>}
				</div>
			)}

			{question.video_solution_url && (
				<button
					onClick={() => window.open(question.video_solution_url, '_blank')}
					className="w-full bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 font-medium mt-4 flex items-center justify-center gap-2"
				>
					<BookOpen className="w-4 h-4" />
					Watch Solution Video
				</button>
			)}
		</div>
	);
}

```

## src/components/student/TopicHeader.tsx

Description: Decorative topic header for result sections with a play button to show the topic’s explanation video.

```tsx
import React from 'react';
import { Film } from 'lucide-react';

interface TopicHeaderProps {
	topicName: string;
	videoUrl?: string;
	onPlayVideo: () => void;
}

export function TopicHeader({ topicName, videoUrl, onPlayVideo }: TopicHeaderProps) {
	return (
		<div className="flex items-center justify-between bg-sky-100 p-4">
			<h3 className="text-xl md:text-2xl font-bold text-gray-800">{topicName}</h3>
			{videoUrl && (
				<button
					onClick={onPlayVideo}
					className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
				>
					<Film className="w-5 h-5" />
					<span>Play Explanation</span>
				</button>
			)}
		</div>
	);
}

```

## src/components/Timer.tsx

Description: Countdown timer component that triggers `onTimeUp` when time reaches zero and changes style when 5 minutes remain.

```tsx
import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface TimerProps {
	duration: number; // in minutes
	onTimeUp: () => void;
	className?: string;
}

export function Timer({ duration, onTimeUp, className = "" }: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
	const [isWarning, setIsWarning] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					onTimeUp();
					return 0;
				}
        
				const newTime = prev - 1;
				setIsWarning(newTime <= 300); // Warning when 5 minutes left
				return newTime;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [onTimeUp]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;

	return (
		<div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
			isWarning 
				? 'bg-red-100 text-red-800 border-2 border-red-300' 
				: 'bg-blue-100 text-blue-800 border-2 border-blue-300'
		} ${className}`}>
			{isWarning ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
			<span>
				{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
			</span>
			{isWarning && <span className="text-sm font-normal ml-2">Time running out!</span>}
		</div>
	);
}
```

## src/components/VideoPlayer.tsx

Description: Smart video player that converts YouTube URLs to embeddable iframe with autoplay.

```tsx

import React from 'react';

interface VideoPlayerProps {
	src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
	const getYouTubeEmbedUrl = (url: string) => {
		const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|&v=)([^#&?\n]*).*/;
		const match = url.match(regExp);
		if (match && match[1] && match[1].length === 11) {
			return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
		}
		return url; // Return original if not a YouTube URL or ID not found
	};

	const embedSrc = getYouTubeEmbedUrl(src);

	return (
		<div className="aspect-w-16 aspect-h-9">
			<iframe 
				src={embedSrc}
				title="Topic Video"
				frameBorder="0" 
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
				allowFullScreen
				className="w-full h-full"
			></iframe>
		</div>
	);
}

```

## src/components/LaTeX.tsx

Description: Minimal LaTeX renderer using react-katex for block formulas; shows inline error if rendering fails.

```tsx
import React from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface LaTeXProps {
	children: string;
	block?: boolean;
}

export function LaTeX({ children, block = false }: LaTeXProps) {
	if (block) {
		try {
			return <BlockMath math={children} />;
		} catch (error) {
			console.error('LaTeX rendering error:', error);
			return <span className="text-red-500 text-sm">LaTeX Error: {children}</span>;
		}
	}
	return null;
}
```

## src/components/TextWithLaTeX.tsx

Description: Splits a text by $...$ markers and renders inline LaTeX segments with react-katex, falling back with an inline error on parse issues.

```tsx
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface TextWithLaTeXProps {
	text: string;
}

export function TextWithLaTeX({ text }: TextWithLaTeXProps) {
	const parts = text.split('$');

	return (
		<p>
			{parts.map((part, index) => {
				if (index % 2 === 1) {
					try {
						return <InlineMath key={index} math={part} />;
					} catch (error) {
						console.error('LaTeX rendering error:', error);
						return <span key={index} className="text-red-500 text-sm">LaTeX Error: {part}</span>;
					}
				}
				return <span key={index}>{part}</span>;
			})}
		</p>
	);
}
```

## src/components/auth/Login.tsx

Description: Simple admin email/password login form using Supabase Auth.

```tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) {
				setError(error.message);
			}
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
			<div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
				<h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
				{error && <p className="text-red-500 text-center mb-4">{error}</p>}
				<form onSubmit={handleLogin}>
					<div className="mb-4">
						<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
							Email
						</label>
						<input
							id="email"
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							type="email"
							placeholder="Your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="mb-6">
						<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
							Password
						</label>
						<input
							id="password"
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
							type="password"
							placeholder="Your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<div className="flex items-center justify-between">
						<button
							className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
							type="submit"
							disabled={loading}
						>
							{loading ? 'Logging in...' : 'Login'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Login;

```

## src/vite-env.d.ts

Description: Vite TypeScript ambient types reference for the build tool.

```ts
/// <reference types="vite/client" />

```

## System Overview

This SPA is a full exam creation and delivery system built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

- Frontend
	- Admin: Build question sets, compose exams, copy links, view dashboards and results.
	- Student: Open exam via link, take timed exam with math support, see tailored results with topic videos.
- Backend (via Supabase)
	- Tables: questions, question_sets, topics, exams, student_result.
	- Auth: Supabase email/password for admin; students don’t need accounts (link-based entry).
- Key integrations
	- Supabase JS client for CRUD and auth.
	- react-katex for LaTeX, iframe-based YouTube player, lucide-react icons.
- Flow
	1) Admin creates topics/question sets and adds questions.
	2) Admin composes an exam and gets a shareable URL.
	3) Student opens link, fills name/email, takes timed exam.
	4) Results are saved; Admin Dashboard summarizes performance and suggests topics to review.

That’s the entire src with file paths, descriptions, and full code for quick copy-paste.
