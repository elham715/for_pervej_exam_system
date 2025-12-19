# MCQ Exam System - Complete API Specification

## Overview

This document provides a comprehensive specification for all API endpoints in the MCQ Exam System, organized by user roles (Admin and Student) with detailed request/response formats and error handling.

## Base Configuration

- **Base URL**: `/api/v1`
- **Authentication**: Firebase Bearer Token (required for all endpoints except `/health`)
- **Content-Type**: `application/json`
- **Authorization Header**: `Authorization: Bearer <firebase-id-token>`

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error details */ },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PATCH, DELETE operations |
| 201 | Created | Successful POST operations |
| 400 | Bad Request | Invalid input data or validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | Requested resource not found |
| 409 | Conflict | Unique constraint violations or duplicate data |
| 410 | Gone | Exam attempt has expired |
| 422 | Unprocessable Entity | Business logic validation failures |
| 500 | Internal Server Error | Unexpected system errors |

---

# SYSTEM ENDPOINTS

## Health Check

### GET /health
**Access**: Public (no authentication required)
**Description**: System health check

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

# AUTHENTICATION & PROFILE ENDPOINTS

## Get Current User Profile

### GET /me
**Access**: All authenticated users
**Description**: Get current user's profile information

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "firebase_uid": "firebase-uid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "college_name": "Example University",
    "address": "123 Main St",
    "is_enrolled": true,
    "role": "STUDENT",
    "created_at": "2024-01-01T00:00:00.000Z",
    "firebase_info": {
      "email_verified": true,
      "uid": "firebase-uid"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Update Current User Profile

### PATCH /me
**Access**: All authenticated users
**Description**: Update current user's profile information

**Request Body**:
```json
{
  "name": "John Doe Updated",
  "phone": "+1234567891",
  "college_name": "New University",
  "address": "456 New St"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "+1234567891",
    "college_name": "New University",
    "address": "456 New St",
    "is_enrolled": true,
    "role": "STUDENT",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Profile updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: Name is required and must be a non-empty string

---

# TOPIC MANAGEMENT ENDPOINTS

## Get All Topics

### GET /topics
**Access**: All authenticated users
**Description**: Retrieve all topics with optional pagination and question count

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)
- `include_count` (optional): Include question count per topic ("true"/"false")

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "topic-uuid",
      "name": "Mathematics",
      "explanation_video_url": "https://example.com/video.mp4",
      "created_at": "2024-01-01T00:00:00.000Z",
      "_count": {
        "questions": 25
      }
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Get Topic by ID

### GET /topics/:id
**Access**: All authenticated users
**Description**: Get specific topic by ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "topic-uuid",
    "name": "Mathematics",
    "explanation_video_url": "https://example.com/video.mp4",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Topic not found

## Create Topic (Admin Only)

### POST /topics
**Access**: Admin only
**Description**: Create a new topic

**Request Body**:
```json
{
  "name": "Physics",
  "explanation_video_url": "https://example.com/physics-intro.mp4"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "new-topic-uuid",
    "name": "Physics",
    "explanation_video_url": "https://example.com/physics-intro.mp4",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Topic created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: Topic name is required and must be a non-empty string
- `409`: Topic with this name already exists

## Update Topic (Admin Only)

### PATCH /topics/:id
**Access**: Admin only
**Description**: Update an existing topic

**Request Body**:
```json
{
  "name": "Advanced Physics",
  "explanation_video_url": "https://example.com/advanced-physics.mp4"
}
```

**Response**: Same as create topic response

**Errors**:
- `404`: Topic not found
- `409`: Topic name already exists

## Delete Topic (Admin Only)

### DELETE /topics/:id
**Access**: Admin only
**Description**: Delete a topic

**Response**:
```json
{
  "success": true,
  "message": "Topic deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Topic not found
- `409`: Cannot delete topic because it is being used by questions

---

# QUESTION MANAGEMENT ENDPOINTS

## Get All Questions

### GET /questions
**Access**: All authenticated users
**Description**: Retrieve questions with filtering and pagination

**Query Parameters**:
- `topic_id` (optional): Filter by topic ID
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)

**Response (Admin)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "question-uuid",
      "topic_id": "topic-uuid",
      "question_text": "What is 2 + 2?",
      "question_latex": null,
      "image_url": null,
      "correct_answer_index": 2,
      "explanation_latex": "Simple addition",
      "video_solution_url": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "topic": {
        "id": "topic-uuid",
        "name": "Mathematics"
      },
      "options": [
        {
          "id": "option-uuid-1",
          "option_index": 1,
          "option_text": "3"
        },
        {
          "id": "option-uuid-2",
          "option_index": 2,
          "option_text": "4"
        },
        {
          "id": "option-uuid-3",
          "option_index": 3,
          "option_text": "5"
        },
        {
          "id": "option-uuid-4",
          "option_index": 4,
          "option_text": "6"
        }
      ]
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Student)**: Same as admin but without `correct_answer_index` field

## Get Question by ID

### GET /questions/:id
**Access**: All authenticated users
**Description**: Get specific question by ID

**Response**: Same format as get all questions (single item)

**Errors**:
- `404`: Question not found

## Create Question (Admin Only)

### POST /questions
**Access**: Admin only
**Description**: Create a new question with exactly 4 options

**Request Body**:
```json
{
  "topic_id": "topic-uuid",
  "question_text": "What is the capital of France?",
  "question_latex": null,
  "image_url": null,
  "correct_answer_index": 2,
  "explanation_latex": "Paris is the capital and largest city of France",
  "video_solution_url": null,
  "options": [
    {
      "option_index": 1,
      "option_text": "London"
    },
    {
      "option_index": 2,
      "option_text": "Paris"
    },
    {
      "option_index": 3,
      "option_text": "Berlin"
    },
    {
      "option_index": 4,
      "option_text": "Madrid"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "new-question-uuid",
    "topic_id": "topic-uuid",
    "question_text": "What is the capital of France?",
    "correct_answer_index": 2,
    "created_at": "2024-01-01T00:00:00.000Z",
    "options": [
      {
        "id": "option-uuid-1",
        "option_index": 1,
        "option_text": "London"
      },
      {
        "id": "option-uuid-2",
        "option_index": 2,
        "option_text": "Paris"
      },
      {
        "id": "option-uuid-3",
        "option_index": 3,
        "option_text": "Berlin"
      },
      {
        "id": "option-uuid-4",
        "option_index": 4,
        "option_text": "Madrid"
      }
    ]
  },
  "message": "Question created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: topic_id is required and must be a string
- `400`: correct_answer_index is required and must be an integer between 1 and 4
- `400`: At least one of question_text, question_latex, or image_url must be provided
- `400`: Exactly 4 options are required
- `400`: Each option must have option_index between 1 and 4
- `400`: Duplicate option indices are not allowed
- `404`: Topic not found

## Update Question (Admin Only)

### PATCH /questions/:id
**Access**: Admin only
**Description**: Update an existing question

**Request Body**: Same format as create question (all fields optional)

**Response**: Same format as create question response

**Errors**:
- `404`: Question not found
- `404`: Topic not found (if topic_id is being updated)
- Same validation errors as create question

## Delete Question (Admin Only)

### DELETE /questions/:id
**Access**: Admin only
**Description**: Delete a question

**Response**:
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Question not found
- `409`: Cannot delete question because it is being used in question sets or exam attempts

---

# QUESTION SET MANAGEMENT ENDPOINTS

## Get All Question Sets

### GET /question-sets
**Access**: All authenticated users
**Description**: Retrieve all question sets with pagination

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "questionset-uuid",
      "title": "Basic Mathematics",
      "description": "Fundamental math concepts",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Get Question Set by ID

### GET /question-sets/:id
**Access**: All authenticated users
**Description**: Get specific question set with ordered questions

**Response (Admin)**:
```json
{
  "success": true,
  "data": {
    "id": "questionset-uuid",
    "title": "Basic Mathematics",
    "description": "Fundamental math concepts",
    "created_at": "2024-01-01T00:00:00.000Z",
    "question_set_questions": [
      {
        "position": 1,
        "question": {
          "id": "question-uuid-1",
          "question_text": "What is 2 + 2?",
          "correct_answer_index": 2,
          "options": [
            {
              "option_index": 1,
              "option_text": "3"
            },
            {
              "option_index": 2,
              "option_text": "4"
            },
            {
              "option_index": 3,
              "option_text": "5"
            },
            {
              "option_index": 4,
              "option_text": "6"
            }
          ]
        }
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Student)**: Same as admin but without `correct_answer_index` in questions

**Errors**:
- `404`: Question set not found

## Create Question Set (Admin Only)

### POST /question-sets
**Access**: Admin only
**Description**: Create a new question set

**Request Body**:
```json
{
  "title": "Advanced Physics",
  "description": "Complex physics problems"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "new-questionset-uuid",
    "title": "Advanced Physics",
    "description": "Complex physics problems",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Question set created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: Question set title is required and must be a non-empty string

## Update Question Set (Admin Only)

### PATCH /question-sets/:id
**Access**: Admin only
**Description**: Update an existing question set

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response**: Same format as create question set response

**Errors**:
- `404`: Question set not found

## Delete Question Set (Admin Only)

### DELETE /question-sets/:id
**Access**: Admin only
**Description**: Delete a question set

**Response**:
```json
{
  "success": true,
  "message": "Question set deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Question set not found
- `409`: Cannot delete question set because it is being used in exams

## Set Questions in Question Set (Admin Only)

### PUT /question-sets/:id/questions
**Access**: Admin only
**Description**: Add/replace questions in question set with fixed ordering

**Request Body**:
```json
{
  "questions": [
    {
      "question_id": "question-uuid-1",
      "position": 1
    },
    {
      "question_id": "question-uuid-2",
      "position": 2
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "questionset-uuid",
    "title": "Basic Mathematics",
    "question_set_questions": [
      {
        "position": 1,
        "question_id": "question-uuid-1"
      },
      {
        "position": 2,
        "question_id": "question-uuid-2"
      }
    ]
  },
  "message": "Questions updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: questions must be an array
- `400`: At least one question is required
- `400`: Positions must start from 1 and be sequential without gaps
- `400`: Duplicate positions are not allowed
- `400`: Duplicate questions are not allowed in the same question set
- `404`: Question set not found
- `404`: Questions not found

## Remove Question from Question Set (Admin Only)

### DELETE /question-sets/:id/questions/:questionId
**Access**: Admin only
**Description**: Remove a question from question set

**Response**:
```json
{
  "success": true,
  "message": "Question removed from question set successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Question set not found
- `404`: Question not found in question set

---

# EXAM MANAGEMENT ENDPOINTS

## Get All Exams

### GET /exams
**Access**: All authenticated users
**Description**: Retrieve all exams with pagination

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "exam-uuid",
      "title": "Mathematics Final Exam",
      "time_limit_seconds": 3600,
      "exam_link": "math-final-2024",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Get Exam by ID

### GET /exams/:id
**Access**: All authenticated users
**Description**: Get specific exam with ordered question sets

**Response (Admin)**:
```json
{
  "success": true,
  "data": {
    "id": "exam-uuid",
    "title": "Mathematics Final Exam",
    "time_limit_seconds": 3600,
    "exam_link": "math-final-2024",
    "created_at": "2024-01-01T00:00:00.000Z",
    "exam_question_sets": [
      {
        "position": 1,
        "question_set": {
          "id": "questionset-uuid",
          "title": "Basic Mathematics",
          "question_set_questions": [
            {
              "position": 1,
              "question": {
                "id": "question-uuid",
                "question_text": "What is 2 + 2?",
                "correct_answer_index": 2,
                "options": [
                  {
                    "option_index": 1,
                    "option_text": "3"
                  },
                  {
                    "option_index": 2,
                    "option_text": "4"
                  },
                  {
                    "option_index": 3,
                    "option_text": "5"
                  },
                  {
                    "option_index": 4,
                    "option_text": "6"
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Student)**: Same as admin but without `correct_answer_index` in questions

**Errors**:
- `404`: Exam not found

## Get Exam by Link

### GET /exams/link/:examLink
**Access**: All authenticated users
**Description**: Get exam by exam link

**Response**: Same format as get exam by ID

**Errors**:
- `404`: Exam not found

## Create Exam (Admin Only)

### POST /exams
**Access**: Admin only
**Description**: Create a new exam

**Request Body**:
```json
{
  "title": "Physics Midterm",
  "time_limit_seconds": 7200,
  "exam_link": "physics-midterm-2024"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "new-exam-uuid",
    "title": "Physics Midterm",
    "time_limit_seconds": 7200,
    "exam_link": "physics-midterm-2024",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Exam created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: Exam title is required and must be a non-empty string
- `400`: time_limit_seconds is required and must be a positive integer
- `400`: exam_link can only contain letters, numbers, hyphens, and underscores
- `409`: Exam link already exists

## Update Exam (Admin Only)

### PATCH /exams/:id
**Access**: Admin only
**Description**: Update an existing exam

**Request Body**:
```json
{
  "title": "Updated Physics Midterm",
  "time_limit_seconds": 9000,
  "exam_link": "updated-physics-midterm"
}
```

**Response**: Same format as create exam response

**Errors**:
- `404`: Exam not found
- `409`: Exam link already exists

## Delete Exam (Admin Only)

### DELETE /exams/:id
**Access**: Admin only
**Description**: Delete an exam

**Response**:
```json
{
  "success": true,
  "message": "Exam deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Exam not found
- `409`: Cannot delete exam because it has active attempts

## Set Question Sets in Exam (Admin Only)

### PUT /exams/:id/question-sets
**Access**: Admin only
**Description**: Add/replace question sets in exam with fixed ordering

**Request Body**:
```json
{
  "question_sets": [
    {
      "question_set_id": "questionset-uuid-1",
      "position": 1
    },
    {
      "question_set_id": "questionset-uuid-2",
      "position": 2
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "exam-uuid",
    "title": "Mathematics Final Exam",
    "exam_question_sets": [
      {
        "position": 1,
        "question_set_id": "questionset-uuid-1"
      },
      {
        "position": 2,
        "question_set_id": "questionset-uuid-2"
      }
    ]
  },
  "message": "Question sets updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: question_sets must be an array
- `400`: At least one question set is required
- `400`: Positions must start from 1 and be sequential without gaps
- `400`: Duplicate positions are not allowed
- `400`: Duplicate question sets are not allowed in the same exam
- `404`: Exam not found
- `404`: Question sets not found

## Remove Question Set from Exam (Admin Only)

### DELETE /exams/:id/question-sets/:questionSetId
**Access**: Admin only
**Description**: Remove a question set from exam

**Response**:
```json
{
  "success": true,
  "message": "Question set removed from exam successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `404`: Exam not found
- `404`: Question set not found in exam

---

# EXAM ATTEMPT ENDPOINTS

## Start Exam Attempt

### POST /exams/:id/start
**Access**: All authenticated users
**Description**: Start a new exam attempt or resume an existing one

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "attempt-uuid",
    "exam_id": "exam-uuid",
    "user_id": "user-uuid",
    "started_at": "2023-10-27T10:00:00.000Z",
    "expires_at": "2023-10-27T11:00:00.000Z",
    "submitted_at": null,
    "status": "IN_PROGRESS",
    "score": 0,
    "total_questions": 0,
    "time_taken_seconds": 0,
    "completed_at": null,
    "questions": [
      {
        "questionSetPosition": 1,
        "questionPosition": 1,
        "question": {
          "id": "question-uuid",
          "text": "What is the capital of France?",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "marks": 1
        }
      },
      {
        "questionSetPosition": 1,
        "questionPosition": 2,
        "question": {
          "id": "question-uuid-2",
          "text": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"],
          "marks": 1
        }
      }
    ]
  },
  "message": "Exam attempt started successfully",
  "timestamp": "2023-10-27T10:00:00.123Z"
}
```

**Key Behaviors**:
- **New Attempt**: Returns the newly created attempt object + questions
- **Resuming Active**: Returns the existing IN_PROGRESS attempt object + questions  
- **Expired**: If the existing attempt is found to be expired, it submits it and returns the result (with status: "SUBMITTED" or "EXPIRED")

**Note**: The `questions` array always includes the complete question data without `correct_answer_index` for security, allowing the frontend to immediately render the exam interface.

**Errors**:
- `400`: Exam ID is required
- `404`: Exam not found

## Submit Answer

### POST /attempts/:attemptId/answer
**Access**: Attempt owner or admin
**Description**: Submit an answer for a question

**Request Body**:
```json
{
  "question_id": "question-uuid",
  "selected_option_index": 2
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "answer-uuid",
    "attempt_id": "attempt-uuid",
    "question_id": "question-uuid",
    "selected_option_index": 2,
    "is_correct": true,
    "answered_at": "2024-01-01T10:15:00.000Z"
  },
  "message": "Answer submitted successfully",
  "timestamp": "2024-01-01T10:15:00.000Z"
}
```

**Validation Errors**:
- `400`: Attempt ID is required
- `400`: Question ID is required
- `400`: selected_option_index must be an integer between 1 and 4, or null
- `403`: You can only submit answers for your own attempts
- `404`: Attempt not found
- `404`: Question not found
- `409`: Attempt is not in progress
- `410`: Attempt has expired

## Submit Exam (Finalize)

### POST /attempts/:attemptId/submit
**Access**: Attempt owner or admin
**Description**: Submit and finalize exam attempt

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "attempt-uuid",
    "exam_id": "exam-uuid",
    "user_id": "user-uuid",
    "status": "SUBMITTED",
    "started_at": "2024-01-01T10:00:00.000Z",
    "submitted_at": "2024-01-01T10:45:00.000Z",
    "score": 85.5,
    "total_questions": 20,
    "correct_answers": 17,
    "topic_performance": [
      {
        "topic_name": "Mathematics",
        "total_questions": 10,
        "correct_answers": 8,
        "percentage": 80.0
      },
      {
        "topic_name": "Physics",
        "total_questions": 10,
        "correct_answers": 9,
        "percentage": 90.0
      }
    ]
  },
  "message": "Exam submitted successfully",
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

**Errors**:
- `400`: Attempt ID is required
- `403`: You can only submit your own attempts
- `404`: Attempt not found
- `409`: Attempt is not in progress
- `410`: Attempt has expired

## Get Attempt Details

### GET /attempts/:attemptId
**Access**: Attempt owner or admin
**Description**: Get detailed attempt information

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "attempt-uuid",
    "exam": {
      "id": "exam-uuid",
      "title": "Mathematics Final Exam",
      "time_limit_seconds": 3600
    },
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "status": "SUBMITTED",
    "started_at": "2024-01-01T10:00:00.000Z",
    "submitted_at": "2024-01-01T10:45:00.000Z",
    "score": 85.5,
    "answers": [
      {
        "question_id": "question-uuid-1",
        "selected_option_index": 2,
        "is_correct": true,
        "answered_at": "2024-01-01T10:05:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

**Errors**:
- `400`: Attempt ID is required
- `403`: Access denied - you can only view your own attempts
- `404`: Attempt not found

## Get User Attempt History

### GET /me/attempts
**Access**: All authenticated users
**Description**: Get current user's attempt history

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid",
      "exam": {
        "id": "exam-uuid",
        "title": "Mathematics Final Exam"
      },
      "status": "SUBMITTED",
      "started_at": "2024-01-01T10:00:00.000Z",
      "submitted_at": "2024-01-01T10:45:00.000Z",
      "score": 85.5
    }
  ],
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

## Get Exam Attempts (Admin Only)

### GET /exams/:id/attempts
**Access**: Admin only
**Description**: Get all attempts for a specific exam

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid",
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "SUBMITTED",
      "started_at": "2024-01-01T10:00:00.000Z",
      "submitted_at": "2024-01-01T10:45:00.000Z",
      "score": 85.5
    }
  ],
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

**Errors**:
- `400`: Exam ID is required

## Get Time Remaining

### GET /attempts/:attemptId/time-remaining
**Access**: Attempt owner or admin
**Description**: Get remaining time for an active attempt

**Response**:
```json
{
  "success": true,
  "data": {
    "time_remaining_seconds": 900
  },
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

**Errors**:
- `400`: Attempt ID is required
- `403`: You can only check time for your own attempts
- `404`: Attempt not found

## Get Topic-wise Performance

### GET /attempts/:attemptId/topic-performance
**Access**: Attempt owner or admin
**Description**: Get topic-wise performance breakdown for an attempt

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "topic_id": "topic-uuid-1",
      "topic_name": "Mathematics",
      "total_questions": 10,
      "correct_answers": 8,
      "percentage": 80.0
    },
    {
      "topic_id": "topic-uuid-2",
      "topic_name": "Physics",
      "total_questions": 10,
      "correct_answers": 9,
      "percentage": 90.0
    }
  ],
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

**Errors**:
- `400`: Attempt ID is required
- `403`: You can only view performance for your own attempts
- `404`: Attempt not found

---

# USER MANAGEMENT ENDPOINTS (Admin Only)

## Get All Users

### GET /users
**Access**: Admin only
**Description**: Get list of users with filtering and pagination

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `role` (optional): Filter by role (ADMIN, STUDENT)
- `isEnrolled` (optional): Filter by enrollment status (true/false)
- `search` (optional): Search in name and email

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "college_name": "Example University",
        "is_enrolled": true,
        "role": "STUDENT",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `403`: Only administrators can access user list

## Get User by ID

### GET /users/:id
**Access**: Admin only
**Description**: Get specific user details

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "firebase_uid": "firebase-uid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "college_name": "Example University",
    "address": "123 Main St",
    "is_enrolled": true,
    "role": "STUDENT",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `400`: Valid user ID is required
- `403`: Only administrators can access user details
- `404`: User not found

## Update User Profile

### PATCH /users/:id
**Access**: Admin or self
**Description**: Update user profile (admin can update any user, users can update themselves)

**Request Body (Admin)**:
```json
{
  "name": "Updated Name",
  "phone": "+1234567891",
  "college_name": "New University",
  "address": "456 New St",
  "is_enrolled": true,
  "role": "STUDENT"
}
```

**Request Body (Self)**:
```json
{
  "name": "Updated Name",
  "phone": "+1234567891",
  "college_name": "New University",
  "address": "456 New St"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "Updated Name",
    "email": "john@example.com",
    "phone": "+1234567891",
    "college_name": "New University",
    "address": "456 New St",
    "is_enrolled": true,
    "role": "STUDENT",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "User updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `400`: Valid user ID is required
- `403`: You can only update your own profile
- `404`: User not found

## Update Enrollment Status

### PATCH /users/:id/enrollment
**Access**: Admin only
**Description**: Update user enrollment status

**Request Body**:
```json
{
  "is_enrolled": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "is_enrolled": true,
    "role": "STUDENT"
  },
  "message": "User enrollment status updated to enrolled",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: Valid user ID is required
- `400`: Enrollment status must be a boolean
- `403`: Only administrators can update enrollment status
- `404`: User not found

## Batch Update Enrollment Status

### PATCH /users/batch/enrollment
**Access**: Admin only
**Description**: Update enrollment status for multiple users

**Request Body**:
```json
{
  "user_ids": ["user-uuid-1", "user-uuid-2", "user-uuid-3"],
  "is_enrolled": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "updated_count": 3,
    "total_requested": 3,
    "is_enrolled": true
  },
  "message": "3 users updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validation Errors**:
- `400`: User IDs array is required and must not be empty
- `400`: Enrollment status must be a boolean
- `403`: Only administrators can batch update enrollment status

---

# ANALYTICS ENDPOINTS

## Get User Performance Analytics

### GET /analytics/users/:id
**Access**: Self or admin
**Description**: Get comprehensive performance analytics for a user

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "total_attempts": 15,
    "completed_attempts": 12,
    "average_score": 78.5,
    "best_score": 95.0,
    "total_time_spent_minutes": 1200,
    "improvement_trend": "IMPROVING",
    "topic_performance": [
      {
        "topic_name": "Mathematics",
        "attempts": 8,
        "average_score": 82.3,
        "best_score": 95.0
      }
    ]
  }
}
```

**Errors**:
- `403`: You can only view your own performance analytics

## Get User Exam History

### GET /analytics/users/:id/history
**Access**: Self or admin
**Description**: Get detailed exam history for a user

**Query Parameters**:
- `skip` (optional): Number of items to skip
- `take` (optional): Number of items to return

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "attempt_id": "attempt-uuid",
      "exam_title": "Mathematics Final",
      "score": 85.5,
      "started_at": "2024-01-01T10:00:00.000Z",
      "submitted_at": "2024-01-01T10:45:00.000Z",
      "time_taken_minutes": 45,
      "status": "SUBMITTED"
    }
  ]
}
```

## Get User Topic Performance

### GET /analytics/users/:id/topics
**Access**: Self or admin
**Description**: Get topic-wise performance breakdown for a user

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "topic_id": "topic-uuid",
      "topic_name": "Mathematics",
      "total_questions_attempted": 50,
      "correct_answers": 42,
      "accuracy_percentage": 84.0,
      "average_time_per_question_seconds": 45
    }
  ]
}
```

## Get User Improvement Trend

### GET /analytics/users/:id/trend
**Access**: Self or admin
**Description**: Get improvement trend analysis for a user

**Response**:
```json
{
  "success": true,
  "data": {
    "trend": "IMPROVING",
    "score_progression": [
      {
        "exam_date": "2024-01-01",
        "score": 65.0
      },
      {
        "exam_date": "2024-01-15",
        "score": 78.5
      },
      {
        "exam_date": "2024-02-01",
        "score": 85.0
      }
    ],
    "improvement_rate": 12.5
  }
}
```

## Get Detailed User Attempts (Enhanced)

### GET /analytics/users/:userId/attempts/detailed
**Access**: Admin or Self (requesting user ID matches userId)
**Description**: Get comprehensive attempt details with questions and answers. Response varies based on attempt status and user role.

**Query Parameters**:
- `skip` (optional): Number of items to skip (default: 0)
- `take` (optional): Number of items to return (default: 100, max: 100)

**Response Scenarios**:

#### Scenario 1: SUBMITTED or EXPIRED Attempts (Full Review Mode)
*Includes explanations, video solutions, and correct answer indicators for learning*

```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid-done",
      "exam_id": "exam-uuid",
      "user_id": "user-uuid",
      "status": "SUBMITTED",
      "score": 80.0,
      "total_questions": 10,
      "time_taken_seconds": 1200,
      "started_at": "2023-10-27T10:00:00Z",
      "submitted_at": "2023-10-27T10:20:00Z",
      "exam": {
        "id": "exam-uuid",
        "title": "Final Chemistry Exam",
        "time_limit_seconds": 3600
      },
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "exam_answers": [
        {
          "id": "answer-uuid-1",
          "question_id": "q1",
          "selected_option_index": 2,
          "is_correct": true,
          "answered_at": "2023-10-27T10:05:00Z",
          "question": {
            "id": "q1",
            "question_text": "What is the capital of France?",
            "correct_answer_index": 2,
            "explanation_latex": "Paris is the capital and largest city of France...",
            "video_solution_url": "https://youtube.com/watch?v=example",
            "image_url": "https://img.com/question-image.jpg",
            "options": [
              {
                "id": "opt1",
                "option_index": 1,
                "option_text": "London"
              },
              {
                "id": "opt2",
                "option_index": 2,
                "option_text": "Paris"
              },
              {
                "id": "opt3",
                "option_index": 3,
                "option_text": "Berlin"
              },
              {
                "id": "opt4",
                "option_index": 4,
                "option_text": "Madrid"
              }
            ],
            "topic": {
              "id": "topic-1",
              "name": "Geography",
              "explanation_video_url": "https://youtube.com/watch?v=geography-basics"
            }
          }
        },
        {
          "id": "answer-uuid-2",
          "question_id": "q2",
          "selected_option_index": 1,
          "is_correct": false,
          "answered_at": "2023-10-27T10:08:00Z",
          "question": {
            "id": "q2",
            "question_text": "Atomic number of Carbon?",
            "correct_answer_index": 3,
            "explanation_latex": "Carbon has 6 protons, so its atomic number is 6...",
            "video_solution_url": "https://youtube.com/watch?v=carbon-example",
            "options": [
              {
                "id": "opt5",
                "option_index": 1,
                "option_text": "4"
              },
              {
                "id": "opt6",
                "option_index": 2,
                "option_text": "8"
              },
              {
                "id": "opt7",
                "option_index": 3,
                "option_text": "6"
              },
              {
                "id": "opt8",
                "option_index": 4,
                "option_text": "12"
              }
            ],
            "topic": {
              "id": "topic-2",
              "name": "Chemistry",
              "explanation_video_url": "https://youtube.com/watch?v=chemistry-fundamentals"
            }
          }
        }
      ]
    }
  ],
  "timestamp": "2023-10-27T10:00:00Z"
}
```

#### Scenario 2: IN_PROGRESS Attempts (Exam Mode)
*Sensitive learning data is hidden to prevent cheating*

```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid-active",
      "exam_id": "exam-uuid",
      "user_id": "user-uuid",
      "status": "IN_PROGRESS",
      "score": 0,
      "total_questions": 10,
      "time_taken_seconds": 600,
      "started_at": "2023-10-27T11:00:00Z",
      "submitted_at": null,
      "exam": {
        "id": "exam-uuid",
        "title": "Final Chemistry Exam",
        "time_limit_seconds": 3600
      },
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "exam_answers": [
        {
          "id": "answer-uuid-3",
          "question_id": "q1",
          "selected_option_index": 2,
          "answered_at": "2023-10-27T11:05:00Z",
          "question": {
            "id": "q1",
            "question_text": "What is the capital of France?",
            "image_url": "https://img.com/question-image.jpg",
            "options": [
              {
                "id": "opt1",
                "option_index": 1,
                "option_text": "London"
              },
              {
                "id": "opt2",
                "option_index": 2,
                "option_text": "Paris"
              },
              {
                "id": "opt3",
                "option_index": 3,
                "option_text": "Berlin"
              },
              {
                "id": "opt4",
                "option_index": 4,
                "option_text": "Madrid"
              }
            ],
            "topic": {
              "id": "topic-1",
              "name": "Geography"
            }
          }
        }
      ]
    }
  ],
  "timestamp": "2023-10-27T11:00:00Z"
}
```

**Key Differences by Status**:
- **SUBMITTED/EXPIRED**: Includes `is_correct`, `correct_answer_index`, `explanation_latex`, `video_solution_url`
- **IN_PROGRESS**: Excludes sensitive data to prevent cheating during active attempts

**Errors**:
- `401`: Missing or invalid authentication token
- `403`: Access denied - can only view own attempts or admin access required
- `404`: User not found

## Get Exam Analytics (Admin Only)

### GET /analytics/exams/:id
**Access**: Admin only
**Description**: Get comprehensive analytics for an exam

**Response**:
```json
{
  "success": true,
  "data": {
    "exam_id": "exam-uuid",
    "exam_title": "Mathematics Final",
    "total_attempts": 150,
    "completed_attempts": 142,
    "average_score": 76.8,
    "highest_score": 98.5,
    "lowest_score": 45.0,
    "average_completion_time_minutes": 52,
    "question_analytics": [
      {
        "question_id": "question-uuid",
        "question_text": "What is 2 + 2?",
        "correct_answers": 140,
        "total_attempts": 142,
        "accuracy_percentage": 98.6
      }
    ]
  }
}
```

**Errors**:
- `403`: Only administrators can view exam analytics

## Get Detailed Exam Results (Admin Only)

### GET /analytics/exams/:id/detailed
**Access**: Admin only
**Description**: Get detailed exam results with question-level analysis

**Query Parameters**:
- `attemptId` (optional): Filter by specific attempt

**Response**:
```json
{
  "success": true,
  "data": {
    "exam_title": "Mathematics Final",
    "attempts": [
      {
        "attempt_id": "attempt-uuid",
        "user_name": "John Doe",
        "score": 85.5,
        "answers": [
          {
            "question_text": "What is 2 + 2?",
            "selected_option": "4",
            "correct_option": "4",
            "is_correct": true
          }
        ]
      }
    ]
  }
}
```

## Get System Analytics (Admin Only)

### GET /analytics/system
**Access**: Admin only
**Description**: Get system-wide analytics and statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "enrolled_users": 1100,
    "total_exams": 45,
    "total_attempts": 5600,
    "completed_attempts": 5200,
    "average_system_score": 74.2,
    "most_popular_topics": [
      {
        "topic_name": "Mathematics",
        "question_count": 150,
        "attempt_count": 2100
      }
    ]
  }
}
```

**Errors**:
- `403`: Only administrators can view system analytics

## Get Exam Usage Statistics (Admin Only)

### GET /analytics/exams/usage
**Access**: Admin only
**Description**: Get exam usage statistics

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "exam_id": "exam-uuid",
      "exam_title": "Mathematics Final",
      "total_attempts": 150,
      "unique_users": 145,
      "completion_rate": 94.7,
      "average_score": 76.8
    }
  ]
}
```

## Get Top Performing Topics (Admin Only)

### GET /analytics/topics/top-performing
**Access**: Admin only
**Description**: Get top performing topics system-wide

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "topic_id": "topic-uuid",
      "topic_name": "Mathematics",
      "average_score": 82.5,
      "total_attempts": 2100,
      "question_count": 150
    }
  ]
}
```

---

# COMMON ERROR CODES

## Authentication Errors
- `UNAUTHORIZED`: Missing or invalid authentication token
- `FORBIDDEN`: Insufficient permissions for the operation
- `ACCESS_DENIED`: User cannot access the specific resource

## Validation Errors
- `VALIDATION_ERROR`: Input data validation failed
- `REQUIRED_FIELD_MISSING`: Required field not provided
- `INVALID_FORMAT`: Data format is incorrect

## Resource Errors
- `NOT_FOUND`: Requested resource does not exist
- `TOPIC_NOT_FOUND`: Topic not found
- `QUESTION_NOT_FOUND`: Question not found
- `QUESTION_SET_NOT_FOUND`: Question set not found
- `EXAM_NOT_FOUND`: Exam not found
- `ATTEMPT_NOT_FOUND`: Attempt not found
- `USER_NOT_FOUND`: User not found

## Conflict Errors
- `DUPLICATE_RESOURCE`: Resource already exists
- `TOPIC_NAME_EXISTS`: Topic name already exists
- `EXAM_LINK_EXISTS`: Exam link already exists
- `ACTIVE_ATTEMPT_EXISTS`: User already has an active attempt
- `RESOURCE_IN_USE`: Cannot delete resource because it's being used

## Business Logic Errors
- `ATTEMPT_EXPIRED`: Exam attempt has expired
- `ATTEMPT_NOT_IN_PROGRESS`: Attempt is not in progress
- `EXAM_NOT_AVAILABLE`: Exam is not available for attempts

## System Errors
- `INTERNAL_SERVER_ERROR`: Unexpected system error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External service unavailable

---

# PAGINATION

Most list endpoints support pagination with the following query parameters:

- `skip`: Number of items to skip (default: 0)
- `take`: Number of items to return (default: 20, max: 100)

Some endpoints use page-based pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

---

# FILTERING

Many endpoints support filtering with query parameters:

- `topic_id`: Filter by topic ID
- `role`: Filter by user role (ADMIN, STUDENT)
- `isEnrolled`: Filter by enrollment status (true/false)
- `search`: Text search in relevant fields
- `status`: Filter by status (for attempts: IN_PROGRESS, SUBMITTED, EXPIRED)

---

# RATE LIMITING

API endpoints implement rate limiting to ensure system stability:

- **General endpoints**: 100 requests per minute per user
- **Exam attempt endpoints**: 60 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

# SECURITY CONSIDERATIONS

## Authentication
- All endpoints (except `/health`) require valid Firebase authentication token
- Tokens must be included in the `Authorization` header as `Bearer <token>`
- Tokens are validated against Firebase Auth service

## Authorization
- Role-based access control (RBAC) implemented
- Admin users have full access to all endpoints
- Student users have restricted access based on ownership and permissions

## Data Protection
- Sensitive data (correct answers) hidden from students
- User data access restricted to self or admin
- Attempt data access restricted to owner or admin

## Input Validation
- All input data validated and sanitized
- SQL injection protection through Prisma ORM
- XSS protection through input sanitization
- Request size limits enforced (10MB max)

---

This specification covers all endpoints in the MCQ Exam System with comprehensive request/response formats and error handling. Use this as a reference for API integration and testing.