const express = require('express');
const Question = require('../models/Question.model');
const Subject = require('../models/Subject.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/questions
router.get('/', protect, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, subject, difficulty, search } = req.query;
    const query = { isActive: true };
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.questionText = { $regex: search, $options: 'i' };

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
        .populate('subject', 'name code')
        .populate('createdBy', 'username')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: {
            questions,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
        }
    });
}));

// GET /api/questions/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id)
        .populate('subject', 'name code')
        .populate('createdBy', 'username fullName');
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: question });
}));

// POST /api/questions
router.post('/', protect, asyncHandler(async (req, res) => {
    req.body.createdBy = req.user._id;
    const question = await Question.create(req.body);
    // Update subject question count
    await Subject.findByIdAndUpdate(question.subject, { $inc: { totalQuestions: 1 } });
    res.status(201).json({ success: true, message: 'Question created successfully', data: question });
}));

// POST /api/questions/bulk-upload
router.post('/bulk-upload', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ success: false, message: 'Please provide an array of questions' });
    }
    const questionsWithCreator = questions.map(q => ({ ...q, createdBy: req.user._id }));
    const created = await Question.insertMany(questionsWithCreator, { ordered: false });
    // Update subject counts
    const subjectCounts = {};
    created.forEach(q => {
        const sid = q.subject.toString();
        subjectCounts[sid] = (subjectCounts[sid] || 0) + 1;
    });
    for (const [subjectId, count] of Object.entries(subjectCounts)) {
        await Subject.findByIdAndUpdate(subjectId, { $inc: { totalQuestions: count } });
    }
    res.status(201).json({ success: true, message: `${created.length} questions uploaded successfully`, data: { created: created.length, failed: questions.length - created.length } });
}));

// PUT /api/questions/:id
router.put('/:id', protect, asyncHandler(async (req, res) => {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question updated successfully', data: question });
}));

// DELETE /api/questions/:id
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    await Subject.findByIdAndUpdate(question.subject, { $inc: { totalQuestions: -1 } });
    res.json({ success: true, message: 'Question deleted successfully' });
}));

module.exports = router;
