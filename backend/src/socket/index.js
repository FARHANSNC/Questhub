const Room = require('../models/Room.model');
const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const Result = require('../models/Result.model');
const { updateUserStats, updateQuizStats } = require('../utils/userStats');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join room
        socket.on('join-room', async ({ roomCode, username, userId }) => {
            try {
                const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
                if (!room) return socket.emit('error', { message: 'Room not found' });
                if (room.status === 'completed') return socket.emit('error', { message: 'Game already ended' });
                if (room.players.filter(p => p.isActive).length >= room.maxPlayers) {
                    return socket.emit('error', { message: 'Room is full' });
                }

                // Check if player already in room
                const existingPlayer = room.players.find(p => p.username === username);
                if (existingPlayer) {
                    existingPlayer.socketId = socket.id;
                    existingPlayer.isActive = true;
                } else {
                    room.players.push({
                        user: userId || null,
                        username,
                        socketId: socket.id,
                        score: 0,
                        correctAnswers: 0,
                        incorrectAnswers: 0,
                        buzzerPresses: 0
                    });
                }
                await room.save();

                socket.join(roomCode);
                socket.roomCode = roomCode;
                socket.playerUsername = username;

                const activePlayers = room.players.filter(p => p.isActive);
                io.to(roomCode).emit('player-joined', {
                    username,
                    players: activePlayers.map(p => ({ username: p.username, score: p.score, isActive: p.isActive })),
                    totalPlayers: activePlayers.length
                });

                socket.emit('room-state', {
                    roomCode: room.roomCode,
                    roomName: room.roomName,
                    status: room.status,
                    currentQuestion: room.currentQuestion,
                    totalQuestions: room.totalQuestions,
                    players: activePlayers.map(p => ({ username: p.username, score: p.score })),
                    isHost: room.host.toString() === (userId || '')
                });
            } catch (err) {
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Host starts game
        socket.on('start-game', async ({ roomCode }) => {
            try {
                const room = await Room.findOne({ roomCode }).populate({
                    path: 'quiz',
                    populate: { path: 'questions' }
                });
                if (!room) return socket.emit('error', { message: 'Room not found' });

                room.status = 'in-progress';
                room.startedAt = new Date();
                room.currentQuestion = 0;
                await room.save();

                const question = room.quiz.questions[0];
                const questionData = {
                    index: 0,
                    total: room.quiz.questions.length,
                    questionText: question.questionText,
                    questionType: question.questionType,
                    options: question.options.map(o => ({ _id: o._id, text: o.text })),
                    timeLimit: room.buzzerTimeWindow,
                    answerTimeLimit: room.answerTimeLimit
                };

                io.to(roomCode).emit('game-started', { totalQuestions: room.quiz.questions.length });

                setTimeout(() => {
                    room.buzzerPressed = false;
                    room.buzzerWinner = null;
                    room.buzzerWinnerSocketId = null;
                    room.questionStartTime = new Date();
                    room.save();
                    io.to(roomCode).emit('new-question', questionData);
                }, 1000);
            } catch (err) {
                socket.emit('error', { message: 'Failed to start game' });
            }
        });

        // Buzzer press
        socket.on('buzzer-press', async ({ roomCode, username }) => {
            try {
                const room = await Room.findOne({ roomCode });
                if (!room || room.status !== 'in-progress') return;
                if (room.buzzerPressed) {
                    return socket.emit('buzzer-rejected', { message: 'Buzzer already pressed' });
                }

                // First press wins (server-side arbitration)
                room.buzzerPressed = true;
                room.buzzerWinnerSocketId = socket.id;
                room.buzzerPressTime = new Date();

                const player = room.players.find(p => p.socketId === socket.id);
                if (player) {
                    player.buzzerPresses++;
                    room.buzzerWinner = player.user;
                }
                await room.save();

                io.to(roomCode).emit('buzzer-result', {
                    winner: username,
                    socketId: socket.id,
                    message: `${username} buzzed first!`
                });
            } catch (err) {
                socket.emit('error', { message: 'Buzzer error' });
            }
        });

        // Submit answer (buzzer winner answers)
        socket.on('submit-answer', async ({ roomCode, selectedOption, username }) => {
            try {
                const room = await Room.findOne({ roomCode }).populate({
                    path: 'quiz',
                    populate: { path: 'questions' }
                });
                if (!room || room.status !== 'in-progress') return;

                const question = room.quiz.questions[room.currentQuestion];
                const correctOpt = question.options.find(o => o.isCorrect);
                const isCorrect = correctOpt && correctOpt._id.toString() === selectedOption;

                const player = room.players.find(p => p.socketId === socket.id);
                if (player) {
                    if (isCorrect) {
                        player.score += room.pointsPerQuestion;
                        player.correctAnswers++;
                    } else {
                        player.incorrectAnswers++;
                    }
                }
                await room.save();

                const leaderboard = room.players
                    .filter(p => p.isActive)
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => ({ rank: i + 1, username: p.username, score: p.score, correctAnswers: p.correctAnswers }));

                io.to(roomCode).emit('answer-result', {
                    username,
                    isCorrect,
                    correctAnswer: correctOpt ? correctOpt.text : '',
                    explanation: question.explanation,
                    leaderboard,
                    pointsAwarded: isCorrect ? room.pointsPerQuestion : 0
                });
            } catch (err) {
                socket.emit('error', { message: 'Answer submission error' });
            }
        });

        // Next question
        socket.on('next-question', async ({ roomCode }) => {
            try {
                const room = await Room.findOne({ roomCode }).populate({
                    path: 'quiz',
                    populate: { path: 'questions' }
                });
                if (!room || room.status !== 'in-progress') return;

                room.currentQuestion++;
                if (room.currentQuestion >= room.quiz.questions.length) {
                    room.status = 'completed';
                    room.completedAt = new Date();
                    await room.save();

                    // Save results for all registered players
                    console.log(`[Buzzer] Game over in room ${roomCode}. Saving results for ${room.players.length} players...`);
                    for (const player of room.players) {
                        if (player.user) {
                            try {
                                const totalQuestions = room.quiz.questions.length;
                                const maxPossiblePoints = totalQuestions * room.pointsPerQuestion;
                                const score = player.score || 0;
                                const percentage = maxPossiblePoints > 0 ? Math.min(100, Math.round((score / maxPossiblePoints) * 100)) : 0;
                                const isPassed = percentage >= (room.quiz.passingScore || 40);
                                const timeSpent = Math.max(0, Math.round((new Date() - (room.startedAt || room.createdAt)) / 1000)) || 0;

                                console.log(`[Buzzer] Creating result for user ${player.user}: score=${score}, percentage=${percentage}%`);

                                await Result.create({
                                    user: player.user,
                                    quiz: room.quiz._id,
                                    totalQuestions,
                                    correctAnswers: player.correctAnswers || 0,
                                    incorrectAnswers: player.incorrectAnswers || 0,
                                    totalPoints: score,
                                    maxPoints: maxPossiblePoints,
                                    percentage: percentage || 0,
                                    timeSpent: timeSpent || 0,
                                    timeDuration: (room.quiz.duration || 10) * 60,
                                    isPassed,
                                    startedAt: room.startedAt || room.createdAt,
                                    completedAt: new Date()
                                });

                                await updateUserStats(player.user);
                                console.log(`[Buzzer] Successfully saved result for ${player.username}`);
                            } catch (err) {
                                console.error(`[Buzzer] CRITICAL: Error saving result for user ${player.user}:`, err.message);
                            }
                        }
                    }
                    await updateQuizStats(room.quiz._id);

                    const finalScores = room.players
                        .filter(p => p.isActive)
                        .sort((a, b) => b.score - a.score)
                        .map((p, i) => ({ rank: i + 1, username: p.username, score: p.score, correctAnswers: p.correctAnswers, buzzerPresses: p.buzzerPresses }));

                    return io.to(roomCode).emit('game-over', { finalScores });
                }

                room.buzzerPressed = false;
                room.buzzerWinner = null;
                room.buzzerWinnerSocketId = null;
                room.questionStartTime = new Date();
                await room.save();

                const question = room.quiz.questions[room.currentQuestion];
                io.to(roomCode).emit('new-question', {
                    index: room.currentQuestion,
                    total: room.quiz.questions.length,
                    questionText: question.questionText,
                    questionType: question.questionType,
                    options: question.options.map(o => ({ _id: o._id, text: o.text })),
                    timeLimit: room.buzzerTimeWindow,
                    answerTimeLimit: room.answerTimeLimit
                });
            } catch (err) {
                socket.emit('error', { message: 'Failed to load next question' });
            }
        });

        // Skip (timeout)
        socket.on('skip-question', async ({ roomCode }) => {
            try {
                const room = await Room.findOne({ roomCode }).populate({
                    path: 'quiz',
                    populate: { path: 'questions' }
                });
                if (!room) return;

                const question = room.quiz.questions[room.currentQuestion];
                const correctOpt = question.options.find(o => o.isCorrect);

                io.to(roomCode).emit('question-skipped', {
                    correctAnswer: correctOpt ? correctOpt.text : '',
                    explanation: question.explanation
                });
            } catch (err) {
                socket.emit('error', { message: 'Skip error' });
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.roomCode) {
                try {
                    const room = await Room.findOne({ roomCode: socket.roomCode });
                    if (room) {
                        const player = room.players.find(p => p.socketId === socket.id);
                        if (player) {
                            player.isActive = false;
                            await room.save();
                            io.to(socket.roomCode).emit('player-left', {
                                username: socket.playerUsername,
                                players: room.players.filter(p => p.isActive).map(p => ({ username: p.username, score: p.score }))
                            });
                        }
                    }
                } catch (err) {
                    console.error('Disconnect handler error:', err);
                }
            }
        });
    });
};
