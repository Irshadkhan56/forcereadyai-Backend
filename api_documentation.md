# ForceReady AI Backend API Documentation

Welcome to the API documentation for ForceReady AI, a comprehensive backend application for preparing candidates for interviews, physical tasks, and medical standards of various defense and administrative forces in Pakistan (such as the Pakistan Army, Navy, Air Force, Police, FIA, CTD, ANF, ASF, Customs, and Intelligence Bureau).

---

## General Information

### Base URL
- Development: `http://localhost:5000` or configured port

### Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (for protected routes)

### Common Response Schema
```json
{
  "success": true,
  "message": "Optional descriptive message",
  "data": {} // Response payload
}
```

---

## 1. Authentication System

### Register User
Create a new user account.
- **Route**: `POST /auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123",
    "age": 22,
    "education": "Bachelors in Computer Science"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 22,
      "education": "Bachelors in Computer Science"
    }
  }
  ```

### Login User
Authenticate an existing user.
- **Route**: `POST /auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
  ```

### Get Profile
Retrieve the authenticated user's profile.
- **Route**: `GET /auth/profile`
- **Access**: Private (JWT Required)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 22,
      "education": "Bachelors in Computer Science"
    }
  }
  ```

### Update Profile
Update the authenticated user's details.
- **Route**: `PUT /auth/profile`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "name": "Johnathan Doe",
    "age": 23,
    "education": "Masters in Cyber Security"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Johnathan Doe",
      "email": "john.doe@example.com",
      "age": 23,
      "education": "Masters in Cyber Security"
    }
  }
  ```

### Change Password
Change user password.
- **Route**: `PUT /auth/password`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "currentPassword": "SecurePassword123",
    "newPassword": "NewSecurePassword456"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

## 2. Organization Management

### Get All Organizations
Retrieve all registered organizations (e.g. Pakistan Army, Navy, Police).
- **Route**: `GET /organizations`
- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c001",
        "name": "Pakistan Army",
        "description": "Land warfare branch of the Pakistan Armed Forces.",
        "logo": "army_logo.png"
      }
    ]
  }
  ```

### Get Organization by ID
Retrieve details of a single organization.
- **Route**: `GET /organizations/:id`
- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "_id": "64f1a2b3c4d5e6f7a8b9c001",
      "name": "Pakistan Army",
      "description": "Land warfare branch of the Pakistan Armed Forces.",
      "logo": "army_logo.png"
    }
  }
  ```

---

## 3. Categories and Positions

### Get All Categories
Retrieve categories (e.g. Officer, Cadet, Soldier, Constable).
- **Route**: `GET /categories`
- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c010",
        "name": "Officer",
        "description": "Commissioned ranks and leadership positions"
      }
    ]
  }
  ```

### Get All Positions
Retrieve positions (e.g. PMA Long Course, GD Pilot).
- **Route**: `GET /positions`
- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c020",
        "name": "PMA Long Course",
        "category": "64f1a2b3c4d5e6f7a8b9c010",
        "organization": "64f1a2b3c4d5e6f7a8b9c001",
        "description": "Regular commission officer entry program."
      }
    ]
  }
  ```

### Get Positions by Category
Retrieve all positions under a specific category.
- **Route**: `GET /positions/category/:categoryId`
- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c020",
        "name": "PMA Long Course",
        "category": "64f1a2b3c4d5e6f7a8b9c010",
        "organization": "64f1a2b3c4d5e6f7a8b9c001",
        "description": "Regular commission officer entry program."
      }
    ]
  }
  ```

---

## 4. Google Gemini AI Interview Question Generation

### Generate AI Questions
Generate customized interview questions based on targets.
- **Route**: `POST /interviews/generate-questions`
- **Access**: Private & Rate-Limited (JWT Required)
- **Request Body**:
  ```json
  {
    "organization": "Pakistan Army",
    "category": "Officer",
    "position": "PMA Long Course",
    "limit": 3
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "question": "Why do you want to join the Pakistan Army as an Officer?",
        "category": "Motivation",
        "difficulty": "Easy"
      },
      {
        "question": "How do you handle high-pressure environments when leading a team?",
        "category": "Leadership",
        "difficulty": "Medium"
      }
    ]
  }
  ```

---

## 5. Google Gemini AI Evaluation

### Evaluate Answer
Evaluate a single question and user response.
- **Route**: `POST /interviews/evaluate`
- **Access**: Private & Rate-Limited (JWT Required)
- **Request Body**:
  ```json
  {
    "question": "Why do you want to join the Pakistan Army as an Officer?",
    "answer": "I want to serve the nation with honor and lead troops during operations.",
    "organization": "Pakistan Army",
    "position": "PMA Long Course"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "score": 85,
      "strengths": "Shows strong patriotism and leadership motivation.",
      "weaknesses": "Brief answer, could elaborate on specific skills or understanding of the military role.",
      "suggestions": "Connect national service with personal experiences in team management or school activities."
    }
  }
  ```

---

## 6. Interview Sessions Tracker

### Start Session
Initialize a multi-question interview session and pre-populate AI-generated questions.
- **Route**: `POST /interviews/session/start`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "organizationId": "64f1a2b3c4d5e6f7a8b9c001",
    "positionId": "64f1a2b3c4d5e6f7a8b9c020"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "_id": "64f1a2b3c4d5e6f7a8b9c999",
      "user": "64f1a2b3c4d5e6f7a8b9c0d1",
      "organization": "64f1a2b3c4d5e6f7a8b9c001",
      "position": "64f1a2b3c4d5e6f7a8b9c020",
      "questions": [
        {
          "_id": "64f1a2b3c4d5e6f7a8b9caaa",
          "question": "What does duty mean to you?",
          "category": "Ethics",
          "difficulty": "Medium",
          "userAnswer": "",
          "score": null,
          "strengths": null,
          "weaknesses": null,
          "suggestions": null
        }
      ],
      "status": "started",
      "totalScore": 0
    }
  }
  ```

### Save Answer & Evaluate
Submit user's answer for a specific question inside an active session. It executes AI evaluation dynamically and updates the session status/score.
- **Route**: `POST /interviews/session/answer`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "sessionId": "64f1a2b3c4d5e6f7a8b9c999",
    "questionId": "64f1a2b3c4d5e6f7a8b9caaa",
    "userAnswer": "Duty is performing actions required of you with integrity regardless of personal feelings."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Answer evaluated and saved successfully",
    "data": {
      "question": "What does duty mean to you?",
      "score": 90,
      "strengths": "Excellent moral alignment, precise terminology.",
      "weaknesses": "None noted.",
      "suggestions": "A very solid answer. Keep it up."
    }
  }
  ```

### Get Session
Retrieve current state of a specific interview session.
- **Route**: `GET /interviews/session/:id`
- **Access**: Private (JWT Required)

### Get History
Retrieve history of all interview sessions completed by the user.
- **Route**: `GET /interviews/session/history`
- **Access**: Private (JWT Required)

### Delete Session
Delete a specific session record.
- **Route**: `DELETE /interviews/session/:id`
- **Access**: Private (JWT Required)

---

## 7. Physical Plan & Medical Checklist Progress

### Get Physical Progress
Fetch user's physical plan progress for a position. If no progress entry exists, it automatically self-initializes copy-template tasks.
- **Route**: `GET /progress/physical?positionId=<POSITION_ID>`
- **Access**: Private (JWT Required)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "_id": "64f1a2b3c4d5e6f7a8b9c555",
      "user": "64f1a2b3c4d5e6f7a8b9c0d1",
      "position": {
        "_id": "64f1a2b3c4d5e6f7a8b9c020",
        "name": "PMA Long Course"
      },
      "exercises": [
        {
          "_id": "64f1a2b3c4d5e6f7a8b9c666",
          "name": "1.6 KM Run",
          "target": "8 Minutes",
          "currentValue": "7 Mins 45 Secs",
          "completed": true
        }
      ]
    }
  }
  ```

### Update Physical Progress
Update a specific exercise completion value.
- **Route**: `PUT /progress/physical`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "positionId": "64f1a2b3c4d5e6f7a8b9c020",
    "exerciseId": "64f1a2b3c4d5e6f7a8b9c666",
    "currentValue": "7 Mins 30 Secs",
    "completed": true
  }
  ```

### Get Medical Progress
Retrieve user's medical checklist progress for a position (self-initializes if missing).
- **Route**: `GET /progress/medical?positionId=<POSITION_ID>`
- **Access**: Private (JWT Required)

### Update Medical Progress
Update a specific criteria status (`passed`, `failed`, `unchecked`).
- **Route**: `PUT /progress/medical`
- **Access**: Private (JWT Required)
- **Request Body**:
  ```json
  {
    "positionId": "64f1a2b3c4d5e6f7a8b9c020",
    "criteriaId": "64f1a2b3c4d5e6f7a8b9c777",
    "status": "passed",
    "notes": "Verified by military hospital checkup"
  }
  ```

---

## 8. Overall Readiness System

### Get Overall Readiness
Fetch and dynamically update readiness metrics. Performs aggregations of interview mock averages, completed physical tasks, passed medical checklist items, and computes a weighted overall score.
- **Route**: `GET /progress/readiness`
- **Access**: Private (JWT Required)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "progress": {
        "_id": "64f1a2b3c4d5e6f7a8b9c888",
        "user": "64f1a2b3c4d5e6f7a8b9c0d1",
        "interviewReadiness": 85,
        "physicalReadiness": 50,
        "medicalReadiness": 60,
        "overallReadiness": 66,
        "createdAt": "2026-06-13T10:00:00.000Z",
        "updatedAt": "2026-06-13T10:05:00.000Z"
      },
      "details": {
        "interviews": {
          "totalCompleted": 2,
          "averageScore": 85
        },
        "physical": {
          "totalExercises": 4,
          "completedExercises": 2,
          "pendingExercises": 2
        },
        "medical": {
          "totalCriteria": 5,
          "passedCriteria": 3,
          "failedCriteria": 1,
          "uncheckedCriteria": 1
        }
      }
    }
  }
  ```
