// Required modules
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback'); // Ensure Feedback model path is correct

// Route to get all feedback
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find(); // Retrieves all feedback from MongoDB
    res.status(200).json(feedback);
  } catch (err) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
});

// Route to submit new feedback
router.post('/submit-feedback', async (req, res) => {
  // Destructuring request body to get feedback data
  const { reportId, accuracyRating, usefulnessRating, comments, status } = req.body;

  const feedbackData = new Feedback({
    reportId,
    accuracyRating,
    usefulnessRating,
    comments,
    status: status || 'Pending' // Sets default status if not provided
  });

  try {
    const savedFeedback = await feedbackData.save(); // Saves feedback to MongoDB
    res.status(201).json(savedFeedback);
  } catch (err) {
    console.error('Error saving feedback:', err.message);
    res.status(400).json({ message: 'Error saving feedback', error: err.message });
  }
});

// Route to get a specific feedback by ID
router.get('/feedback/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id); // Find feedback by ID
    if (feedback) {
      res.status(200).json(feedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (err) {
    console.error('Error fetching feedback by ID:', err.message);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
});

// Route to update feedback by ID
router.put('/feedback/:id', async (req, res) => {
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Updates feedback
    if (updatedFeedback) {
      res.status(200).json(updatedFeedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (err) {
    console.error('Error updating feedback:', err.message);
    res.status(400).json({ message: 'Error updating feedback', error: err.message });
  }
});

// Route to delete feedback by ID
router.delete('/feedback/:id', async (req, res) => {
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(req.params.id); // Deletes feedback
    if (deletedFeedback) {
      res.status(200).json({ message: 'Feedback deleted successfully' });
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (err) {
    console.error('Error deleting feedback:', err.message);
    res.status(500).json({ message: 'Error deleting feedback', error: err.message });
  }
});

module.exports = router;
