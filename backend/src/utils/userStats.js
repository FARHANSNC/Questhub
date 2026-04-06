const User = require('../models/User.model');
const Result = require('../models/Result.model');
const Quiz = require('../models/Quiz.model');

/**
 * Recalculate and update a user's total quizzes taken, total score, and average score.
 * @param {string} userId - The ID of the user to update.
 */
const updateUserStats = async (userId) => {
    try {
        if (!userId) return;

        // Find all results for this user
        const results = await Result.find({ user: userId });
        
        if (results.length === 0) {
            await User.findByIdAndUpdate(userId, {
                totalQuizzesTaken: 0,
                totalScore: 0,
                averageScore: 0
            });
            return;
        }

        const totalQuizzesTaken = results.length;
        const totalScore = results.reduce((sum, res) => sum + res.totalPoints, 0);
        const averageScore = Math.round((results.reduce((sum, res) => sum + res.percentage, 0) / totalQuizzesTaken) * 10) / 10;

        await User.findByIdAndUpdate(userId, {
            totalQuizzesTaken,
            totalScore,
            averageScore
        });
    } catch (error) {
        console.error(`Error updating stats for user ${userId}:`, error);
    }
};

/**
 * Recalculate and update global quiz stats (total attempts and average score).
 * @param {string} quizId - The ID of the quiz to update.
 */
const updateQuizStats = async (quizId) => {
    try {
        if (!quizId) return;

        const results = await Result.find({ quiz: quizId });
        
        if (results.length === 0) return;

        const totalAttempts = results.length;
        const averageScore = Math.round((results.reduce((sum, res) => sum + res.percentage, 0) / totalAttempts) * 10) / 10;

        await Quiz.findByIdAndUpdate(quizId, {
            totalAttempts,
            averageScore
        });
    } catch (error) {
        console.error(`Error updating stats for quiz ${quizId}:`, error);
    }
};

module.exports = { updateUserStats, updateQuizStats };
