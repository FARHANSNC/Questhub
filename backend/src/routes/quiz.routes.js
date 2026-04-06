const express = require('express');
const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const Result = require('../models/Result.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const { updateUserStats, updateQuizStats } = require('../utils/userStats');

const router = express.Router();

// GET /api/quizzes
router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, quizType, subject, isPublic } = req.query;
    const query = { isActive: true };
    if (quizType) query.quizType = quizType;
    if (subject) query.subject = subject;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    else query.isPublic = true;

    const total = await Quiz.countDocuments(query);
    const quizzes = await Quiz.find(query)
        .populate('subject', 'name code color icon')
        .populate('createdBy', 'username fullName')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: {
            quizzes,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
        }
    });
}));

// GET /api/quizzes/my - Get quizzes created by logged-in user
router.get('/my', protect, asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
        .populate('subject', 'name code')
        .sort({ createdAt: -1 });
    res.json({ success: true, data: quizzes });
}));

// GET /api/quizzes/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id)
        .populate('subject', 'name code color')
        .populate('createdBy', 'username fullName');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
}));

// POST /api/quizzes/:id/start - Start quiz & get questions
router.post('/:id/start', optionalAuth, asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate({
        path: 'questions',
        select: 'questionText questionType options points timeLimit imageUrl',
    });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let questions = quiz.questions.map(q => {
        const qObj = q.toObject();
        if (qObj.options) {
            qObj.options = qObj.options.map(opt => ({ _id: opt._id, text: opt.text }));
        }
        return qObj;
    });

    if (quiz.shuffleQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
    }

    res.json({
        success: true,
        message: 'Quiz started',
        data: {
            quiz: { _id: quiz._id, title: quiz.title, duration: quiz.duration, totalQuestions: quiz.totalQuestions, passingScore: quiz.passingScore },
            questions,
            startTime: new Date()
        }
    });
}));

// POST /api/quizzes/:id/submit
router.post('/:id/submit', optionalAuth, asyncHandler(async (req, res) => {
    const { answers, totalTimeSpent, startedAt } = req.body;
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let correctCount = 0;
    let totalPoints = 0;
    let maxPoints = 0;
    const evaluatedAnswers = [];

    for (const q of quiz.questions) {
        maxPoints += q.points;
        const userAnswer = answers ? answers.find(a => a.question === q._id.toString()) : null;
        let isCorrect = false;

        if (userAnswer && userAnswer.selectedOption) {
            if (q.questionType === 'multiple-choice') {
                const correctOpt = q.options.find(o => o.isCorrect);
                isCorrect = correctOpt && correctOpt._id.toString() === userAnswer.selectedOption;
            } else if (q.questionType === 'true-false') {
                isCorrect = q.correctAnswer === userAnswer.selectedOption;
            }
        }

        if (isCorrect) {
            correctCount++;
            totalPoints += q.points;
        }

        await Question.findByIdAndUpdate(q._id, {
            $inc: { totalAttempts: 1, ...(isCorrect ? { correctAttempts: 1 } : {}) }
        });

        evaluatedAnswers.push({
            question: q._id,
            selectedOption: userAnswer ? userAnswer.selectedOption : null,
            isCorrect,
            timeTaken: userAnswer ? userAnswer.timeTaken || 0 : 0,
            pointsEarned: isCorrect ? q.points : 0
        });
    }

    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    const isPassed = percentage >= quiz.passingScore;

    let userId = req.user ? req.user._id : null;
    if (!userId) {
        let guest = await User.findOne({ username: 'guest_user', role: 'guest' });
        if (!guest) {
            guest = await User.create({ username: 'guest_user', email: 'guest@questhub.com', password: 'Guest@12345', fullName: 'Guest User', role: 'guest' });
        }
        userId = guest._id;
    }

    const result = await Result.create({
        user: userId,
        quiz: quiz._id,
        answers: evaluatedAnswers,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        incorrectAnswers: quiz.questions.length - correctCount - (evaluatedAnswers.filter(a => !a.selectedOption).length),
        unanswered: evaluatedAnswers.filter(a => !a.selectedOption).length,
        totalPoints,
        maxPoints,
        percentage,
        timeSpent: totalTimeSpent || 0,
        timeDuration: quiz.duration * 60,
        isPassed,
        startedAt: startedAt || new Date(),
        completedAt: new Date()
    });

    // Update global quiz stats
    await updateQuizStats(quiz._id);

    // Update user profile stats
    if (req.user) {
        await updateUserStats(req.user._id);
    }

    const populatedResult = await Result.findById(result._id)
        .populate({ path: 'answers.question', select: 'questionText options explanation questionType' });

    res.json({
        success: true,
        message: 'Quiz submitted successfully',
        data: { result: populatedResult }
    });
}));

// POST /api/quizzes/random - Generate random quiz
router.post('/random', optionalAuth, asyncHandler(async (req, res) => {
    const { totalQuestions = 10, subjects, difficulty, duration = 10 } = req.body;

    const query = { isActive: true };
    if (subjects && subjects.length > 0) query.subject = { $in: subjects };
    if (difficulty && difficulty !== 'mixed') query.difficulty = difficulty;

    const questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: parseInt(totalQuestions) } }
    ]);

    if (questions.length === 0) {
        return res.status(404).json({ success: false, message: 'No questions found matching criteria' });
    }

    let creatorId = req.user ? req.user._id : null;
    if (!creatorId) {
        let guest = await User.findOne({ username: 'guest_user', role: 'guest' });
        if (!guest) {
            guest = await User.create({ username: 'guest_user', email: 'guest@questhub.com', password: 'Guest@12345', fullName: 'Guest User', role: 'guest' });
        }
        creatorId = guest._id;
    }

    const quiz = await Quiz.create({
        title: `Random Quiz - ${new Date().toLocaleDateString()}`,
        quizType: 'random',
        questions: questions.map(q => q._id),
        totalQuestions: questions.length,
        duration,
        difficulty: difficulty || 'mixed',
        isPublic: true,
        allowGuests: true,
        createdBy: creatorId
    });

    res.status(201).json({
        success: true,
        message: 'Random quiz generated',
        data: quiz
    });
}));

// POST /api/quizzes - Create quiz (any logged-in user)
router.post('/', protect, asyncHandler(async (req, res) => {
    req.body.createdBy = req.user._id;
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
}));

// PUT /api/quizzes/:id - Owner or admin can update
router.put('/:id', protect, asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Allow owner or admin
    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' });
    }

    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Quiz updated successfully', data: updated });
}));

// DELETE /api/quizzes/:id - Owner or admin can delete
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quiz deleted successfully' });
}));

module.exports = router;
