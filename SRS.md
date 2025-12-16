# Software Requirements Specification (SRS)

Last updated: 2025-10-25

Project: ExamsOmnia (Omnia) — a lightweight web-based exam builder and delivery platform

Repository root files referenced: `package.json`, `README.md`, `src/lib/supabase.ts`, UI components under `src/components` (admin and student folders), `src/components/Timer.tsx`, `VideoPlayer.tsx`, `LaTeX.tsx`, and `ExamInterface.tsx`.

## Table of Contents

- Introduction
- Overall Description
- System Features (Functional Requirements)
- External Interfaces
- Non-functional Requirements
- Data Model
- Use Cases and Workflows
- Acceptance Criteria and Test Cases
- Deployment and Operations
- Security, Privacy and Compliance
- Appendices / Future Work

## 1. Introduction

1.1 Purpose

This SRS describes the requirements for ExamsOmnia ("the System"), an online exam-authoring and delivery web application with administrative tools (question sets, question editor, exam builder, exam manager) and a student-facing exam interface that supports timed exams, LaTeX rendering, images, and video embedding.

1.2 Scope

The System allows authorized administrative users to create topics, question sets and questions, assemble them into exams with configurable time limits, generate shareable exam links for students, and manage existing exams. Students access an exam link to take the timed exam, answer questions, and submit responses. The system stores student results and provides incorrect-topic review.

1.3 Definitions, acronyms and abbreviations

- SRS: Software Requirements Specification
- DB: Database (Supabase/Postgres)

1.4 Stakeholders

- Administrators / Teachers: create/manage question sets and exams.
- Students: take exams and view results.
- System operator / DevOps: deploys and maintains the system.

## 2. Overall Description

2.1 Product perspective

The product is a single-page React + TypeScript web application built with Vite. It communicates directly with a Supabase backend (client SDK) for persistence and authentication. UI components include admin pages (`src/components/admin/*`), student pages (`src/components/student/*`), and shared components such as `Timer`, `LaTeX`, `VideoPlayer`, and `TextWithLaTeX`.

2.2 Major functions (high-level)

- User authentication (login UI exists at `src/components/auth/Login.tsx`).
- Topic management (create/delete topics; optional explanation video URL).
- Question management (create/update questions, including LaTeX/explanation, images, multiple choice options).
- Question set management (group questions into sets, delete sets).
- Exam creation (select question sets, set title and time limit, generate exam link).
- Exam management (list, copy link, delete exam).
- Exam delivery (student exam interface: timed, navigation, selection, LaTeX rendering, images, progress, auto-submit on time up).
- Student results persistence (table `student_result`) and review of incorrect topics.

2.3 User classes and characteristics

- Admin (teacher) — can create topics, questions, question sets and exams; needs an authenticated account.
- Student — accesses an exam via a public/shared link (no heavy account required in current code). May provide name/email before starting.

2.4 Operating environment

- Client: modern browsers (Chrome, Edge, Safari, Firefox).
- Frontend: React + TypeScript, Vite.
- Backend: Supabase (Postgres) accessed via `@supabase/supabase-js` client.

2.5 Design and implementation constraints

- Supabase anon key is currently in `src/lib/supabase.ts` — must be replaced with environment variables for production.
- System uses client-side Supabase calls; serverless/edge functions could be introduced later for sensitive operations.

2.6 Assumptions and dependencies

- Internet connectivity is required for Supabase backend access.
- Exams and questions are persisted to the Supabase database schema with tables: `exams`, `question_sets`, `questions`, `topics`, `student_result` (names inferred from code in `src/lib/supabase.ts`).

## 3. System Features (Functional Requirements)

Each functional requirement below is prefixed FR-#.

FR-1: Admin Authentication and Session
- Description: Admins must authenticate to access admin pages (Login at `src/components/auth/Login.tsx`).
- Priority: High
- Inputs: admin credentials
- Outputs: auth session, access to admin UI

FR-2: Topic Management
- Description: Create/delete topics with optional `explanation_video_url` (see `createTopic` in `src/lib/supabase.ts`).
- API/DB: `topics` table with `{id, name, explanation_video_url, created_at}`.

FR-3: Question CRUD
- Description: Create, read, update questions. Each question supports text, LaTeX, options (multiple-choice), correct_answer index, topic, image URL, and optional explanation (LaTeX-safe escaping).
- UI: `QuestionForm`, `QuestionEditForm` under `src/components/admin`.
- DB table: `questions` with `question_text`, `question_latex`, `explanation_latex`, `options` (array), `correct_answer` (int), `topic`, `image_url`, `created_at`, `id`.

FR-4: Question Set Management
- Description: Create/delete question sets; question set stores `question_ids` and metadata (title, description). UI: `QuestionSetManager`.

FR-5: Exam Builder
- Description: Admin selects question sets, sets title and time limit in minutes, generates an exam (calls `createExam` which also generates `exam_link`). UI: `ExamBuilder`.

FR-6: Exam Manager
- Description: List exams, display generated exam links, copy, and delete exams. UI: `ExamManager`.

FR-7: Exam Delivery (Student)
- Description: Student opens a link containing an `exam` identifier. The `ExamInterface` loads exam data (questions aggregated from selected question sets) and presents a timed, navigable UI. The `Timer` component triggers auto-submit on time expiry.

FR-8: Results Persistence & Incorrect Topic Review
- Description: On submit (manual or time up), results are calculated client-side and persisted with `createStudentResult`. `ResultsPage` and `IncorrectQuestionReview` components are present and should display stored data.

FR-9: LaTeX Rendering
- Description: Support rendering of LaTeX in questions and explanations using `react-katex` (component `LaTeX` and `TextWithLaTeX`). Handle block and inline math.

FR-10: Video Embedding
- Description: Topics may include an explanation video URL. `VideoPlayer` supports YouTube links by parsing and embedding.

FR-11: Link Generation
- Description: When an exam is created, the backend returns an exam id and the frontend generates a shareable exam link (see `createExam` in `src/lib/supabase.ts` which updates `exam_link`).

FR-12: Data Retrieval
- Description: Administrative UI must be able to fetch lists of `questions`, `question_sets`, `topics`, and `exams` via Supabase client functions in `src/lib/supabase.ts`.

## 4. External Interfaces

4.1 User Interface
- Web UI built with React + Tailwind CSS. Major screens: Admin dashboard, Exam Builder, Question Set Manager, Question Editor, Exam Manager, Student Exam Interface, Results Page.

4.2 API (Backend)
- Supabase client (`@supabase/supabase-js`) used to call database operations directly from frontend. Functions present: `createQuestionSet`, `createExam`, `getQuestionSets`, `getQuestions`, `getTopics`, `getExams`, `getExam`, `createQuestion`, `addQuestionToSet`, `deleteQuestionSet`, `updateQuestion`, `createTopic`, `deleteTopic`, `deleteExam`, `getStudentResults`, `createStudentResult`.

4.3 Data formats
- JSON payloads for all DB operations.

## 5. Non-functional Requirements

NFR-1: Performance
- The UI shall load exam configuration lists (question sets, questions) within 2 seconds under typical conditions (100-500 rows in DB).

NFR-2: Scalability
- The design allows scaling by moving DB calls to server-side or caching if load increases. Current design is suitable for small to medium class sizes.

NFR-3: Availability & Reliability
- The system depends on Supabase availability. Implement retry/backoff for critical writes; preserve local state until confirmation in large-scale deployments.

NFR-4: Security
- Authentication for admin areas. Move Supabase anon key out of source into environment variables and restrict operations requiring elevated privileges to server-side functions. Validate/sanitize input server-side for any rich content (LaTeX, images).

NFR-5: Privacy
- Student PII (student_name, student_email) is stored in `student_result`. Comply with applicable data protection standards (store minimal necessary info, provide retention policy).

NFR-6: Accessibility
- UI should be keyboard-accessible and use semantic HTML so screen readers can operate core flows (forms, radios, buttons). Add ARIA attributes where needed.

NFR-7: Maintainability
- Modular React components, TypeScript types in `src/types`, and well-documented functions in `src/lib/supabase.ts` promote maintainability.

## 6. Data Model (inferred)

Tables (names inferred from code):

- `questions`:
  - id: string (uuid)
  - question_text: string
  - question_latex?: string
  - explanation_latex?: string
  - options: string[]
  - correct_answer: number
  - topic: string
  - image_url?: string
  - created_at: timestamp

- `question_sets`:
  - id: string
  - title: string
  - description?: string
  - question_ids: string[]
  - created_at: timestamp

- `exams`:
  - id: string
  - title: string
  - question_set_ids: string[]
  - time_limit_minutes: number
  - exam_link: string
  - created_at: timestamp

- `topics`:
  - id: string
  - name: string
  - explanation_video_url?: string
  - created_at: timestamp

- `student_result` (or `student_results`):
  - id: string
  - exam_id: string
  - student_name: string
  - student_email: string
  - answers: json/object mapping questionId -> selectedIndex
  - score: number
  - total_questions: number
  - incorrect_topics: string[]
  - completed_at: timestamp

Notes: Primary keys and types must be confirmed with the actual DB schema. The code uses `question_set_ids` and `question_ids` as arrays.

## 7. Use Cases and Workflows

7.1 Create a question set (Admin)
- Preconditions: Admin authenticated.
- Steps: Admin opens `QuestionSetManager`, clicks 'New Question Set', fills title/description, submits -> `createQuestionSet` -> DB inserts record.
- Postcondition: New question set visible in lists.

7.2 Add question to set
- Preconditions: Question set exists.
- Steps: Admin selects set, fills question form (text, options, correct answer, topic), submits -> `createQuestion` then `addQuestionToSet`.

7.3 Create exam (Admin)
- Preconditions: One or more question sets present.
- Steps: Admin opens `ExamBuilder`, selects sets, sets title/time, clicks Generate -> `createExam` -> record inserted; frontend updates `exam_link` field and shows shareable link.

7.4 Student takes exam
- Preconditions: Student has exam link (URL with exam id parameter).
- Steps: Student opens link -> app loads exam (via `getExam`), Timer starts, student answers questions, navigates, and either manually submits or Timer triggers `onTimeUp` which calls `onSubmit` -> `createStudentResult` saves results.

7.5 Review results and incorrect topics
- Preconditions: Results exist for the student.
- Steps: Student or admin opens `ResultsPage` or `IncorrectQuestionReview` to see scores and topics to review.

## 8. Acceptance Criteria and Test Cases

AC-1: Admin can create a question set and see it listed.
- Test: Create question set via UI; call `getQuestionSets` and verify returned list contains newly created set.

AC-2: Admin can create a question and add it to a question set.
- Test: Submit question form; verify `questions` table contains the new question and `question_sets` entry has new question id appended.

AC-3: Admin can create an exam and a shareable link is produced.
- Test: Use `ExamBuilder` with one set; verify `exams` table row is created and `exam_link` is present and accessible.

AC-4: Student exam auto-submits on time up and results saved.
- Test: Create exam with short time (e.g., 0.05 minutes), open link, wait for timer expiry, verify `student_result` record exists.

AC-5: LaTeX renders correctly in questions and explanations.
- Test: Create a question with valid LaTeX markup and confirm `react-katex` renders without error.

Edge Cases to test:
- Large number of questions (pagination or virtualization may be necessary).
- Questions with malformed LaTeX (frontend should catch and display error message, as `LaTeX` component does).
- Network failure during `createStudentResult` (client should retry or inform user and queue result if necessary).

## 9. Deployment and Operations

9.1 Build and run
- Build: `npm run build` (uses Vite). Dev server: `npm run dev`.

9.2 Environment variables
- Move Supabase URL and keys to env variables (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and reference in `src/lib/supabase.ts` instead of hard-coded values.

9.3 Hosting
- Frontend: Vercel, Netlify, or static host supported by Vite builds.
- Database/Auth: Supabase managed service.

9.4 Backups & Migrations
- Establish periodic snapshots for Postgres in Supabase and store schema migration scripts in repo.

## 10. Security, Privacy and Compliance

10.1 Secrets management
- Do not commit Supabase anon/service keys to source control. Use environment variables and a secrets manager for CI/CD.

10.2 Authorization
- Ensure admin operations are restricted to authenticated admin users. Consider server-side checks (RLS in Supabase) and restricted API endpoints for privileged mutations.

10.3 Data protection
- Limit stored PII and document retention policy. Use TLS for all transport (Supabase uses HTTPS by default).

## 11. Appendix & Future Work

Planned improvements and low-risk extras:
- Move Supabase operations that modify many rows or require privileged access to server-side endpoints or RPCs (Supabase functions).
- Add audit logging for exam creation, deletion, and student submissions.
- Add pagination/virtualization to large lists (questions, question sets, exams).
- Add role-based access control: Admin, Instructor, Student.
- Add CSV export for results and analytics dashboards.

References: code inspected at `src/lib/supabase.ts` and components under `src/components`.

---

Contact and maintenance

If you want, I can convert this into a PDF or add diagrams (ER diagram for the data model, sequence diagrams for createExam/takeExam flows). I can also open a PR to move Supabase keys into environment variables and add a minimal CI check to prevent commits with secrets.
