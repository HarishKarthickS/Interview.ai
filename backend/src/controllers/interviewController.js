const Interview = require('../models/Interview');

// @desc    Create a new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  try {
    const { questions } = req.body;
    
    const interview = await Interview.create({
      userId: req.user._id,
      questions,
    });

    res.status(201).json(interview);
  } catch (error) {
    console.error(`Error in createInterview: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all interviews for a user
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const interviews = await Interview.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Interview.countDocuments({ userId: req.user._id });

    res.json({
      interviews,
      pageInfo: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Error in getInterviews: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get an interview by ID
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    // Check if interview exists
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user owns the interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(interview);
  } catch (error) {
    console.error(`Error in getInterviewById: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an interview with transcript and feedback
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = async (req, res) => {
  try {
    const { transcript, llmFeedback, cvAnalysis, finalScore } = req.body;

    const interview = await Interview.findById(req.params.id);

    // Check if interview exists
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user owns the interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update the interview
    interview.transcript = transcript || interview.transcript;
    interview.llmFeedback = llmFeedback || interview.llmFeedback;
    interview.cvAnalysis = cvAnalysis || interview.cvAnalysis;
    interview.finalScore = finalScore || interview.finalScore;

    const updatedInterview = await interview.save();

    res.json(updatedInterview);
  } catch (error) {
    console.error(`Error in updateInterview: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
}; 