const express = require('express');
const Result = require('../models/Result.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/results/user/:userId
router.get('/user/:userId', protect, asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const total = await Result.countDocuments({ user: req.params.userId });
    const results = await Result.find({ user: req.params.userId })
        .populate({ path: 'quiz', select: 'title quizType subject duration', populate: { path: 'subject', select: 'name' } })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ completedAt: -1 });

    const allResults = await Result.find({ user: req.params.userId });
    const statistics = {
        totalAttempts: allResults.length,
        averageScore: allResults.length > 0 ? Math.round(allResults.reduce((s, r) => s + r.percentage, 0) / allResults.length * 10) / 10 : 0,
        passRate: allResults.length > 0 ? Math.round(allResults.filter(r => r.isPassed).length / allResults.length * 100 * 10) / 10 : 0,
        totalTimeSpent: allResults.reduce((s, r) => s + r.timeSpent, 0)
    };

    res.json({
        success: true,
        data: {
            results,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
            statistics
        }
    });
}));

// GET /api/results/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const result = await Result.findById(req.params.id)
        .populate('user', 'username fullName avatar')
        .populate({ path: 'quiz', select: 'title subject quizType', populate: { path: 'subject', select: 'name' } })
        .populate({ path: 'answers.question', select: 'questionText options explanation questionType correctAnswer' });
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
}));

// GET /api/results/quiz/:quizId - Leaderboard
router.get('/quiz/:quizId', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const results = await Result.find({ quiz: req.params.quizId })
        .populate('user', 'username fullName avatar')
        .sort({ percentage: -1, timeSpent: 1 })
        .limit(parseInt(limit));

    const data = results.map((r, i) => ({
        rank: i + 1,
        user: r.user,
        percentage: r.percentage,
        totalPoints: r.totalPoints,
        timeSpent: r.timeSpent,
        completedAt: r.completedAt
    }));

    res.json({ success: true, data });
}));

// DELETE /api/results/:id
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted successfully' });
}));

module.exports = router;
