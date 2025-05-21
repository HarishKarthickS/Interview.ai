const express = require('express');
const router = express.Router();
const {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview // Import deleteInterview
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all interviews and create a new interview
router.route('/')
  .get(getInterviews)
  .post(createInterview);

// Get and update an interview by ID
router.route('/:id')
  .get(getInterviewById)
  .put(updateInterview)
  .delete(deleteInterview); // Add DELETE route

module.exports = router; 