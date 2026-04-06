const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, uppercase: true },
    roomName: { type: String, required: true, trim: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String, required: true },
        socketId: { type: String, required: true },
        score: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        incorrectAnswers: { type: Number, default: 0 },
        buzzerPresses: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'paused', 'completed'],
        default: 'waiting'
    },
    currentQuestion: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    questionStartTime: { type: Date, default: null },
    buzzerPressed: { type: Boolean, default: false },
    buzzerWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    buzzerWinnerSocketId: { type: String, default: null },
    buzzerPressTime: { type: Date, default: null },
    maxPlayers: { type: Number, default: 10, min: 2, max: 50 },
    pointsPerQuestion: { type: Number, default: 10 },
    buzzerTimeWindow: { type: Number, default: 10 },
    answerTimeLimit: { type: Number, default: 30 },
    allowSpectators: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
}, { timestamps: true });

// Single explicit unique index for roomCode — removed `unique: true` from
// the schema field above to avoid Mongoose creating a duplicate index.
roomSchema.index({ roomCode: 1 }, { unique: true });
roomSchema.index({ status: 1 });
roomSchema.index({ host: 1 });

module.exports = mongoose.model('Room', roomSchema);
