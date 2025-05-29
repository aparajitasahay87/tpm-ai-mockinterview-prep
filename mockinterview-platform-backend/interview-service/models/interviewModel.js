// interview-service/models/interviewModel.js
const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image: { type: String }, // Added image field (optional),
  aiFeedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }, // Link to feedback in feedback-service
  timestamp: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  responses: [responseSchema] // Array of user responses for this question
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  expectedCriteria: [{ type: String }], // Array of criteria for AI feedback
  questions: [questionSchema] // Array of questions within this category
});

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID from auth-service
  title: { type: String, required: true },
  categories: [categorySchema], // Array of interview categories
  status: { type: String, enum: ['draft', 'in-progress', 'completed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
