const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  reportId: String,
  accuracyRating: Number,
  usefulnessRating: Number,
  comments: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

