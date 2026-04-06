const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Quiz title is required'], trim: true },
    description: { type: String, default: '' },
    quizType: {
        type: String,
        enum: ['random', 'subject-based', 'custom'],
        required: true
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    totalQuestions: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 1 },
    passingScore: { type: Number, default: 40, min: 0, max: 100 },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'mixed'
    },
    isPublic: { type: Boolean, default: true },
    allowGuests: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: true },
    showExplanations: { type: Boolean, default: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

quizSchema.index({ quizType: 1 });
quizSchema.index({ subject: 1 });
quizSchema.index({ isActive: 1, isPublic: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
