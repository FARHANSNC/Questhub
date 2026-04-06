const express = require('express');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/users - Admin only
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } }
        ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: {
            users,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
        }
    });
}));

// GET /api/users/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
}));

// PUT /api/users/:id
router.put('/:id', protect, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { fullName, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { fullName, phone, avatar }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated successfully', data: user });
}));

// DELETE /api/users/:id - Admin only
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
}));

module.exports = router;
