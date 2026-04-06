const express = require('express');
const Result = require('../models/Result.model');
const User = require('../models/User.model');
const Quiz = require('../models/Quiz.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { updateUserStats } = require('../utils/userStats');

const router = express.Router();

// GET /api/analytics/user/:userId
router.get('/user/:userId', protect, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const results = await Result.find({ user: req.params.userId })
        .populate({ path: 'quiz', populate: { path: 'subject', select: 'name' } })
        .sort({ completedAt: -1 });

    const totalAttempts = results.length;
    const averageScore = totalAttempts > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalAttempts * 10) / 10 : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...results.map(r => r.percentage)) : 0;
    const passRate = totalAttempts > 0 ? Math.round(results.filter(r => r.isPassed).length / totalAttempts * 100 * 10) / 10 : 0;

    // Subject performance
    const subjectMap = {};
    results.forEach(r => {
        if (r.quiz && r.quiz.subject) {
            const sName = r.quiz.subject.name;
            if (!subjectMap[sName]) subjectMap[sName] = { attempts: 0, totalScore: 0, highest: 0 };
            subjectMap[sName].attempts++;
            subjectMap[sName].totalScore += r.percentage;
            subjectMap[sName].highest = Math.max(subjectMap[sName].highest, r.percentage);
        }
    });

    const subjectPerformance = Object.entries(subjectMap).map(([name, data]) => ({
        subject: name,
        attempts: data.attempts,
        averageScore: Math.round(data.totalScore / data.attempts * 10) / 10,
        highestScore: data.highest
    }));

    // Timeline (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentResults = results.filter(r => r.completedAt >= thirtyDaysAgo);
    const timelineMap = {};
    recentResults.forEach(r => {
        const date = r.completedAt.toISOString().split('T')[0];
        if (!timelineMap[date]) timelineMap[date] = { attempts: 0, totalScore: 0 };
        timelineMap[date].attempts++;
        timelineMap[date].totalScore += r.percentage;
    });
    const timeline = Object.entries(timelineMap).map(([date, data]) => ({
        date, attempts: data.attempts, averageScore: Math.round(data.totalScore / data.attempts * 10) / 10
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
        success: true,
        data: {
            userId: req.params.userId,
            totalAttempts, averageScore, highestScore, lowestScore, passRate,
            totalTimeSpent: results.reduce((s, r) => s + r.timeSpent, 0),
            subjectPerformance, timeline,
            recentActivity: results.slice(0, 5).map(r => ({
                quiz: r.quiz ? r.quiz.title : 'Unknown',
                score: r.percentage,
                completedAt: r.completedAt
            }))
        }
    });
}));

// GET /api/analytics/global - Admin
router.get('/global', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments({ role: { $ne: 'guest' } });
    const totalQuizzes = await Quiz.countDocuments({ isActive: true });
    const totalResults = await Result.countDocuments();

    const results = await Result.find().limit(1000).sort({ completedAt: -1 });
    const averageScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length * 10) / 10 : 0;

    res.json({
        success: true,
        data: { totalUsers, totalQuizzes, totalAttempts: totalResults, averageScore }
    });
}));

// GET /api/analytics/sync - Admin only: Sync all user stats
router.get('/sync', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const users = await User.find();
    for (const user of users) {
        await updateUserStats(user._id);
    }
    res.json({ success: true, message: 'All user stats synchronized' });
}));

module.exports = router;
