const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/quizzes', require('./routes/quiz.routes'));
app.use('/api/results', require('./routes/result.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'QuestHub API is running!', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Socket.IO handlers
require('./socket/index')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 QuestHub Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});
