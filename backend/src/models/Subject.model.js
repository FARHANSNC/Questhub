const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true
    },
    description: { type: String, default: '' },
    icon: { type: String, default: '📚' },
    color: { type: String, default: '#3498db' },
    totalQuestions: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
