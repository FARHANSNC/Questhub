const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    attemptNumber: { type: Number, default: 1 },
    answers: [{
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: String, default: null },
        isCorrect: { type: Boolean, required: true },
        timeTaken: { type: Number, default: 0 },
        pointsEarned: { type: Number, default: 0 }
    }],
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    unanswered: { type: Number, default: 0 },
    totalPoints: { type: Number, required: true },
    maxPoints: { type: Number, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    timeSpent: { type: Number, required: true },
    timeDuration: { type: Number, required: true },
    isPassed: { type: Boolean, required: true },
    isCompleted: { type: Boolean, default: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true }
}, { timestamps: true });

resultSchema.index({ user: 1, quiz: 1 });
resultSchema.index({ user: 1, completedAt: -1 });
resultSchema.index({ percentage: -1 });

module.exports = mongoose.model('Result', resultSchema);
