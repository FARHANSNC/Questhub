const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    questionType: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'fill-in-blank'],
        default: 'multiple-choice'
    },
    options: [{
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false }
    }],
    correctAnswer: { type: String, default: null },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    tags: [{ type: String, trim: true }],
    points: { type: Number, default: 1, min: 1, max: 10 },
    timeLimit: { type: Number, default: 30 },
    explanation: { type: String, default: '' },
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

questionSchema.index({ subject: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);
