const Interview = require('../models/Interview');

// @desc    Create a new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  try {
    const { questions } = req.body;

    // Validate questions
    if (!questions) {
      return res.status(400).json({ message: 'Questions are required' });
    }
    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: 'Questions must be an array' });
    }
    if (questions.some(q => typeof q !== 'string' || q.trim() === '')) {
      return res.status(400).json({ message: 'Each question must be a non-empty string' });
    }
    
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

    // Validate transcript
    if (transcript !== undefined) {
      if (!Array.isArray(transcript)) {
        return res.status(400).json({ message: 'Transcript must be an array' });
      }
      for (const item of transcript) {
        if (typeof item !== 'object' || item === null ||
            typeof item.questionText !== 'string' || 
            typeof item.answerText !== 'string' ||
            typeof item.durationSeconds !== 'number') {
          return res.status(400).json({ message: 'Each transcript item must have questionText (string), answerText (string), and durationSeconds (number)' });
        }
      }
    }

    // Validate llmFeedback
    if (llmFeedback !== undefined && (typeof llmFeedback !== 'object' || llmFeedback === null || Array.isArray(llmFeedback))) {
      return res.status(400).json({ message: 'llmFeedback must be an object' });
    }

    // Validate cvAnalysis
    if (cvAnalysis !== undefined && (typeof cvAnalysis !== 'object' || cvAnalysis === null || Array.isArray(cvAnalysis))) {
      return res.status(400).json({ message: 'cvAnalysis must be an object' });
    }

    // Validate finalScore
    if (finalScore !== undefined && typeof finalScore !== 'number') {
      return res.status(400).json({ message: 'finalScore must be a number' });
    }

    const interview = await Interview.findById(req.params.id);

    // Check if interview exists
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user owns the interview
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update the interview fields based on presence in req.body
    if (req.body.transcript !== undefined) {
      interview.transcript = req.body.transcript;
    }
    if (req.body.llmFeedback !== undefined) {
      interview.llmFeedback = req.body.llmFeedback;
    }
    if (req.body.cvAnalysis !== undefined) {
      interview.cvAnalysis = req.body.cvAnalysis;
    }
    if (req.body.finalScore !== undefined) {
      interview.finalScore = req.body.finalScore;
    }

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
  deleteInterview, // Added for export
};

// @desc    Delete an interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = async (req, res) => {
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

    // Delete the interview
    await Interview.findByIdAndDelete(req.params.id);
    // Alternatively, if you already have the document: await interview.deleteOne();

    res.status(200).json({ message: 'Interview removed' });
  } catch (error) {
    console.error(`Error in deleteInterview: ${error.message}`);
    // Check for CastError (invalid ObjectId format)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid interview ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
}; 