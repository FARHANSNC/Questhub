const express = require('express');
const Room = require('../models/Room.model');
const Quiz = require('../models/Quiz.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /api/rooms - Create room
router.post('/', protect, asyncHandler(async (req, res) => {
    const { roomName, quiz: quizId, maxPlayers, pointsPerQuestion, buzzerTimeWindow, answerTimeLimit, isPrivate } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const roomCode = uuidv4().substring(0, 6).toUpperCase();

    const room = await Room.create({
        roomCode,
        roomName,
        host: req.user._id,
        quiz: quizId,
        totalQuestions: quiz.totalQuestions,
        maxPlayers: maxPlayers || 10,
        pointsPerQuestion: pointsPerQuestion || 10,
        buzzerTimeWindow: buzzerTimeWindow || 10,
        answerTimeLimit: answerTimeLimit || 30,
        isPrivate: isPrivate || false
    });

    const populatedRoom = await Room.findById(room._id)
        .populate('host', 'username fullName')
        .populate('quiz', 'title totalQuestions');

    res.status(201).json({ success: true, message: 'Room created successfully', data: populatedRoom });
}));

// GET /api/rooms/active
router.get('/active', asyncHandler(async (req, res) => {
    const rooms = await Room.find({ status: { $in: ['waiting'] }, isPrivate: false })
        .populate('host', 'username fullName')
        .populate('quiz', 'title totalQuestions')
        .sort({ createdAt: -1 });

    const data = rooms.map(r => ({
        _id: r._id,
        roomCode: r.roomCode,
        roomName: r.roomName,
        host: r.host,
        status: r.status,
        currentPlayers: r.players.filter(p => p.isActive).length,
        maxPlayers: r.maxPlayers,
        isPrivate: r.isPrivate,
        createdAt: r.createdAt
    }));

    res.json({ success: true, data });
}));

// GET /api/rooms/code/:roomCode
router.get('/code/:roomCode', asyncHandler(async (req, res) => {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
        .populate('host', 'username fullName')
        .populate('quiz', 'title totalQuestions');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
}));

// GET /api/rooms/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id)
        .populate('host', 'username fullName')
        .populate('quiz', 'title totalQuestions');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
}));

// PUT /api/rooms/:id/end
router.put('/:id/end', protect, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.host.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only host can end the room' });
    }
    room.status = 'completed';
    room.completedAt = new Date();
    await room.save();

    const finalScores = room.players
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ username: p.username, score: p.score, correctAnswers: p.correctAnswers, rank: i + 1 }));

    res.json({ success: true, message: 'Room ended successfully', data: { finalScores } });
}));

// DELETE /api/rooms/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room deleted successfully' });
}));

module.exports = router;
