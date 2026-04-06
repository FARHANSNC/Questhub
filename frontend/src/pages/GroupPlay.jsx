import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { io } from 'socket.io-client';
import './GroupPlay.css';

export default function GroupPlay() {
    const { user } = useAuth();
    const [view, setView] = useState('lobby'); // lobby | waiting | playing | finished
    const [socket, setSocket] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [roomName, setRoomName] = useState('');
    const [players, setPlayers] = useState([]);
    const [question, setQuestion] = useState(null);
    const [buzzerEnabled, setBuzzerEnabled] = useState(false);
    const [buzzerWinner, setBuzzerWinner] = useState(null);
    const [isWinner, setIsWinner] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [finalScores, setFinalScores] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [roomState, setRoomState] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        API.get('/quizzes?limit=50').then(r => setQuizzes(r.data.data.quizzes)).catch(() => { });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);

    const connectSocket = () => {
        const s = io('http://localhost:5000');
        socketRef.current = s;
        setSocket(s);

        s.on('player-joined', (data) => { setPlayers(data.players); setMessage(`${data.username} joined!`); });
        s.on('player-left', (data) => { setPlayers(data.players); setMessage(`${data.username} left`); });
        s.on('room-state', (data) => { setRoomState(data); setPlayers(data.players); if (data.status === 'waiting') setView('waiting'); });
        s.on('game-started', () => { setView('playing'); setMessage('Game started!'); });
        s.on('new-question', (data) => { setQuestion(data); setBuzzerEnabled(true); setBuzzerWinner(null); setIsWinner(false); setAnswerResult(null); });
        s.on('buzzer-result', (data) => { setBuzzerEnabled(false); setBuzzerWinner(data.winner); setIsWinner(data.socketId === s.id); });
        s.on('buzzer-rejected', () => { setMessage('Too slow!'); });
        s.on('answer-result', (data) => { setAnswerResult(data); setLeaderboard(data.leaderboard); });
        s.on('question-skipped', (data) => { setAnswerResult({ isCorrect: false, correctAnswer: data.correctAnswer, explanation: data.explanation, skipped: true }); });
        s.on('game-over', (data) => { setFinalScores(data.finalScores); setView('finished'); });
        s.on('error', (data) => { setMessage(data.message); });

        return s;
    };

    const createRoom = async () => {
        if (!selectedQuiz) return alert('Select a quiz');
        setCreating(true);
        try {
            const res = await API.post('/rooms', { roomName: roomName || 'My Room', quiz: selectedQuiz });
            const room = res.data.data;
            setRoomCode(room.roomCode);
            const s = connectSocket();
            s.emit('join-room', { roomCode: room.roomCode, username: user?.fullName || guestName || 'Host', userId: user?._id });
        } catch (err) { alert('Failed to create room'); }
        setCreating(false);
    };

    const joinRoom = () => {
        if (!joinCode) return alert('Enter room code');
        const name = user?.fullName || guestName;
        if (!name) return alert('Enter your name');
        setRoomCode(joinCode.toUpperCase());
        const s = connectSocket();
        s.emit('join-room', { roomCode: joinCode.toUpperCase(), username: name, userId: user?._id });
    };

    const pressBuzzer = () => {
        if (!buzzerEnabled || !socket) return;
        socket.emit('buzzer-press', { roomCode, username: user?.fullName || guestName || 'Player' });
    };

    const submitAnswer = (optionId) => {
        if (!socket) return;
        socket.emit('submit-answer', { roomCode, selectedOption: optionId, username: user?.fullName || guestName });
    };

    const nextQuestion = () => {
        if (!socket) return;
        socket.emit('next-question', { roomCode });
    };

    const startGame = () => {
        if (!socket) return;
        socket.emit('start-game', { roomCode });
    };

    // LOBBY VIEW
    if (view === 'lobby') {
        return (
            <div className="page container">
                <div className="page-header animate-fade-in-up" style={{ textAlign: 'center' }}>
                    <h1 className="page-title">🔘 Group Play</h1>
                    <p className="page-subtitle">Real-time buzzer quiz competition! First to buzz gets to answer.</p>
                </div>

                {!user && (
                    <div className="glass-card animate-fade-in-up" style={{ maxWidth: '400px', margin: '0 auto 20px', padding: '20px', border: '1px solid var(--border-glass)' }}>
                        <div className="input-group">
                            <label>Your Display Name</label>
                            <input className="input-field" placeholder="Enter your name" value={guestName} onChange={e => setGuestName(e.target.value)} />
                        </div>
                    </div>
                )}

                <div className="grid grid-2" style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div className="glass-card animate-fade-in-up" style={{ padding: '32px', border: '1px solid var(--border-glass)' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>🏠 Create Room</h3>
                        <div className="input-group">
                            <label>Room Name</label>
                            <input className="input-field" placeholder="e.g. CS Challenge" value={roomName} onChange={e => setRoomName(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Select Quiz</label>
                            <select className="input-field" value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}>
                                <option value="">Choose a quiz...</option>
                                {quizzes.map(q => <option key={q._id} value={q._id}>{q.title} ({q.totalQuestions} Q)</option>)}
                            </select>
                        </div>
                        <button className="btn btn-primary btn-full" onClick={createRoom} disabled={creating}>{creating ? 'Creating...' : 'Create Room'}</button>
                    </div>

                    <div className="glass-card animate-fade-in-up" style={{ padding: '32px', animationDelay: '0.1s', border: '1px solid var(--border-glass)' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>🚪 Join Room</h3>
                        <div className="input-group">
                            <label>Room Code</label>
                            <input className="input-field" placeholder="Enter room code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, textAlign: 'center', fontSize: '1.2rem' }} />
                        </div>
                        <button className="btn btn-outline btn-full" onClick={joinRoom}>Join Room</button>
                    </div>
                </div>
            </div>
        );
    }

    // WAITING VIEW
    if (view === 'waiting') {
        return (
            <div className="page container" style={{ textAlign: 'center' }}>
                <div className="glass-card animate-fade-in-up" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px', border: '1px solid var(--border-glass)' }}>
                    <h2 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>🕐 Waiting Room</h2>
                    <div style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 'var(--radius-full)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '6px', margin: '24px 0', color: 'var(--accent)' }}>{roomCode}</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Share this code with friends to join!</p>

                    <h4 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>👥 Players ({players.length})</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
                        {players.map((p, i) => (
                            <div key={i} style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {p.username}
                            </div>
                        ))}
                    </div>

                    {roomState?.isHost && (
                        <button className="btn btn-primary btn-lg" onClick={startGame} disabled={players.length < 1}>Start Game</button>
                    )}
                    {message && <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{message}</p>}
                </div>
            </div>
        );
    }

    // PLAYING VIEW
    if (view === 'playing') {
        return (
            <div className="page container" style={{ maxWidth: '700px', margin: '0 auto' }}>
                {question && (
                    <div className="glass-card animate-fade-in" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>Question {question.index + 1}/{question.total}</span>
                            <span className="badge badge-neutral" style={{ border: '1px solid var(--border-glass)' }}>Group Play</span>
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '32px', color: 'var(--text-primary)' }}>{question.questionText}</h3>

                        {!buzzerWinner && buzzerEnabled && (
                            <button className="buzzer-btn animate-pulse" onClick={pressBuzzer}>
                                <span className="buzzer-text">BUZZ</span>
                            </button>
                        )}

                        {buzzerWinner && (
                            <div style={{ marginBottom: '24px' }}>
                                <div className="badge badge-neutral" style={{ fontSize: '1rem', padding: '12px 24px', background: 'var(--bg-glass)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>🏆 {buzzerWinner} buzzed first!</div>
                            </div>
                        )}

                        {isWinner && !answerResult && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                                {question.options.map((opt, i) => (
                                    <button key={opt._id || i} className="option-btn" onClick={() => submitAnswer(opt._id || String(i))}>
                                        <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                        <span className="option-text">{opt.text}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {answerResult && (
                            <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: 'var(--bg-glass)', border: `1px solid var(--border-glass)` }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{answerResult.isCorrect ? 'Correct!' : 'Wrong!'}</div>
                                <p style={{ color: 'var(--accent)', fontWeight: 700 }}>Answer: {answerResult.correctAnswer}</p>
                                {answerResult.explanation && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>ℹ️ {answerResult.explanation}</p>}

                                {roomState?.isHost && (
                                    <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={nextQuestion}>Next Question →</button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {leaderboard.length > 0 && (
                    <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-glass)' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>📋 Live Leaderboard</h4>
                        {leaderboard.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', background: i === 0 ? 'rgba(0,0,0,0.05)' : 'transparent', marginBottom: '6px', border: i === 0 ? '1px solid var(--accent-subtle)' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${p.rank}`}</span>
                                    <span style={{ fontWeight: 600 }}>{p.username}</span>
                                </div>
                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{p.score} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>pts</span></span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // FINISHED VIEW
    if (view === 'finished') {
        return (
            <div className="page container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div className="glass-card animate-fade-in-up" style={{ padding: '48px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚪</div>
                    <h2 style={{ fontWeight: 900, marginBottom: '32px', color: 'var(--text-primary)' }}>Game Over</h2>
                    {finalScores?.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', background: i === 0 ? 'rgba(0,0,0,0.08)' : 'var(--bg-glass)', marginBottom: '12px', border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${p.rank}`}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{p.username}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.correctAnswers} correct</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>{p.score}</span>
                        </div>
                    ))}
                    <button className="btn btn-primary btn-lg" style={{ marginTop: '32px' }} onClick={() => { setView('lobby'); if (socketRef.current) socketRef.current.disconnect(); }}>Back to Lobby</button>
                </div>
            </div>
        );
    }
}
