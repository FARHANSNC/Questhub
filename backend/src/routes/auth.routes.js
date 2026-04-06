const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
    }

    const user = await User.create({
        username, email, password, fullName, role: 'student'
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                _id: user._id, username: user.username, email: user.email,
                fullName: user.fullName, role: user.role, avatar: user.avatar,
                isActive: user.isActive, createdAt: user.createdAt
            },
            token
        }
    });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    const query = email ? { email } : { username };
    const user = await User.findOne(query).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                _id: user._id, username: user.username, email: user.email,
                fullName: user.fullName, role: user.role, avatar: user.avatar
            },
            token
        }
    });
}));

// GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
}));

// POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});

module.exports = router;
