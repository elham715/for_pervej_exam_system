# Database Schema Documentation

## Overview
This document describes the complete database schema for the Omnia application, an exam and question management system built with Supabase (PostgreSQL).

## Database Tables

### 1. questions
Stores all questions used in exams and question sets.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the question |
| topic | text | NOT NULL | Topic/category the question belongs to |
| question_text | text | NOT NULL | Plain text version of the question |
| question_latex | text | NULLABLE | LaTeX formatted version of the question |
| image_url | text | NULLABLE | URL to an image associated with the question |
| options | text[] | NOT NULL | Array of answer options (multiple choice) |
| correct_answer | integer | NOT NULL | Index of the correct answer in the options array |
| explanation_latex | text | NULLABLE | LaTeX formatted explanation of the answer |
| video_solution_url | text | NULLABLE | URL to a video solution |
| created_at | timestamp | DEFAULT NOW() | Timestamp when the question was created |

**Indexes:**
- Primary key on `id`
- Recommended: Index on `topic` for faster topic-based queries

---

### 2. topics
Stores topic information with optional explanation videos.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the topic |
| name | text | NOT NULL, UNIQUE | Name of the topic |
| explanation_video_url | text | NULLABLE | URL to an explanation video for the topic |
| created_at | timestamp | DEFAULT NOW() | Timestamp when the topic was created |

**Indexes:**
- Primary key on `id`
- Unique constraint on `name`

---

### 3. question_sets
Groups questions together into reusable sets.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the question set |
| title | text | NOT NULL | Title of the question set |
| description | text | NULLABLE | Description of the question set |
| question_ids | uuid[] | NOT NULL | Array of question IDs included in this set |
| created_at | timestamp | DEFAULT NOW() | Timestamp when the question set was created |

**Indexes:**
- Primary key on `id`

**Notes:**
- `question_ids` is an array of UUIDs referencing the `questions` table
- No foreign key constraint enforced in the schema (handled at application level)

---

### 4. exams
Stores exam configurations and metadata.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the exam |
| title | text | NOT NULL | Title of the exam |
| question_set_ids | uuid[] | NOT NULL | Array of question set IDs to include in the exam |
| time_limit_minutes | integer | NOT NULL | Time limit for the exam in minutes |
| exam_link | text | NULLABLE | Generated link for students to access the exam |
| created_at | timestamp | DEFAULT NOW() | Timestamp when the exam was created |

**Indexes:**
- Primary key on `id`

**Notes:**
- `question_set_ids` is an array of UUIDs referencing the `question_sets` table
- `exam_link` is auto-generated after exam creation
- No foreign key constraint enforced in the schema (handled at application level)

---

### 5. student_result
Stores student exam results and performance data.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the result |
| exam_id | uuid | NOT NULL | Reference to the exam taken |
| student_name | text | NOT NULL | Name of the student |
| student_email | text | NOT NULL | Email address of the student |
| answers | jsonb | NOT NULL | JSON object mapping question IDs to answer indices |
| score | integer | NOT NULL | Number of correct answers |
| total_questions | integer | NOT NULL | Total number of questions in the exam |
| completed_at | timestamp | DEFAULT NOW() | Timestamp when the exam was completed |
| incorrect_topics | text[] | NOT NULL | Array of topics where student answered incorrectly |
| time_taken_seconds | integer | NOT NULL | Time taken to complete the exam in seconds |

**Indexes:**
- Primary key on `id`
- Recommended: Index on `exam_id` for faster exam-based queries
- Recommended: Index on `student_email` for faster student-based queries

**Notes:**
- `answers` is a JSONB object with structure: `{ "question_id": answer_index }`
- `exam_id` references the `exams` table (foreign key recommended but not enforced)

---

## Relationships

```
topics (1) ────────< (many) questions
                              │
                              │
question_sets (1) ──<──>── (many) questions [via question_ids array]
                              │
                              │
exams (1) ──<──>── (many) question_sets [via question_set_ids array]
    │
    │
    └────────< (many) student_result
```

## Data Flow

1. **Topics** are created first to categorize questions
2. **Questions** are created and associated with topics
3. **Question Sets** group multiple questions together
4. **Exams** combine multiple question sets with time limits
5. **Student Results** are recorded when students complete exams

## Application-Level Data Types

### ExamAttempt (Client-side only)
This is not a database table but a client-side interface for tracking active exam attempts:

```typescript
{
  exam: Exam,
  student_name: string,
  student_email: string,
  start_time: number
}
```

Stored in localStorage during exam attempts.

## Supabase Configuration

**Project URL:** `https://fqqyssipgzzdrmzcyyru.supabase.co`

**Required Policies:**
- Enable Row Level Security (RLS) on all tables
- Public read access for `questions`, `topics`, `question_sets`, and `exams`
- Public insert access for `student_result`
- Admin-only write access for `questions`, `topics`, `question_sets`, and `exams`

## SQL Schema Creation Scripts

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  explanation_video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_latex TEXT,
  image_url TEXT,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation_latex TEXT,
  video_solution_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create question_sets table
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  question_ids UUID[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  question_set_ids UUID[] NOT NULL,
  time_limit_minutes INTEGER NOT NULL,
  exam_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create student_result table
CREATE TABLE student_result (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  incorrect_topics TEXT[] NOT NULL,
  time_taken_seconds INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_student_result_exam_id ON student_result(exam_id);
CREATE INDEX idx_student_result_email ON student_result(student_email);
```

### Sample Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_result ENABLE ROW LEVEL SECURITY;

-- Public read access for exam materials
CREATE POLICY "Allow public read access" ON topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON question_sets FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON exams FOR SELECT USING (true);

-- Public insert access for student results
CREATE POLICY "Allow public insert" ON student_result FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read own results" ON student_result FOR SELECT USING (true);

-- Admin write access (configure with service role or custom auth)
-- CREATE POLICY "Admin write access" ON topics FOR ALL USING (auth.role() = 'admin');
-- CREATE POLICY "Admin write access" ON questions FOR ALL USING (auth.role() = 'admin');
-- CREATE POLICY "Admin write access" ON question_sets FOR ALL USING (auth.role() = 'admin');
-- CREATE POLICY "Admin write access" ON exams FOR ALL USING (auth.role() = 'admin');
```

## Notes

- All UUIDs are generated using `uuid_generate_v4()`
- Arrays are used for relationships instead of junction tables for simplicity
- LaTeX fields use double backslashes (`\\`) for proper escaping
- Student results are stored with detailed analytics (incorrect topics, time taken)
- Exam links are auto-generated after exam creation
- The application uses localStorage for tracking active exam attempts
