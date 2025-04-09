# Interview.ai Backend

This is the backend for the Interview.ai application, built using Node.js, Express.js, and MongoDB.

## Features

- User Authentication (Register, Login)
- Interview Management (Create, Read, Update)
- Data persistence with MongoDB

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires authentication)

### Interviews
- `POST /api/interviews` - Create a new interview (requires authentication)
- `GET /api/interviews` - Get all interviews for the logged-in user (requires authentication)
- `GET /api/interviews/:id` - Get a specific interview by ID (requires authentication)
- `PUT /api/interviews/:id` - Update an interview (requires authentication)

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/interviewai
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Database Models

### User Schema
- name: String (required)
- email: String (required, unique)
- passwordHash: String (required)
- createdAt: Date (default: Now)

### Interview Schema
- userId: ObjectId (reference to User model)
- timestamp: Date (default: Now)
- questions: Array of question objects
- transcript: Array of transcript objects
- llmFeedback: Object containing LLM feedback
- cvAnalysis: Object containing computer vision analysis
- finalScore: Number 