const express = require('express');
const Subject = require('../models/Subject.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/subjects - Public
router.get('/', asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    else query.isActive = true;
    const subjects = await Subject.find(query).populate('createdBy', 'username fullName').sort({ name: 1 });
    res.json({ success: true, data: subjects });
}));

// GET /api/subjects/:id - Public
router.get('/:id', asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id).populate('createdBy', 'username fullName');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
}));

// POST /api/subjects
router.post('/', protect, asyncHandler(async (req, res) => {
    const { name, code, description, color, icon } = req.body;
    const subject = await Subject.create({ name, code, description, color, icon, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Subject created successfully', data: subject });
}));

// PUT /api/subjects/:id - Admin only
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject updated successfully', data: subject });
}));

// DELETE /api/subjects/:id - Admin only
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const subject = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted successfully' });
}));

module.exports = router;
