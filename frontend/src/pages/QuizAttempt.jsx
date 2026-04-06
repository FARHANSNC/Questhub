import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import './QuizAttempt.css';

export default function QuizAttempt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(new Date());

    useEffect(() => {
        API.post(`/quizzes/${id}/start`).then(res => {
            const data = res.data.data;
            setQuiz(data.quiz);
            setQuestions(data.questions);
            setTimeLeft(data.quiz.duration * 60);
            setLoading(false);
        }).catch(err => {
            alert('Failed to start quiz');
            navigate(-1);
        });
    }, [id, navigate]);

    const submitQuiz = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        const formattedAnswers = questions.map(q => ({
            question: q._id,
            selectedOption: answers[q._id] || null,
            timeTaken: 0
        }));
        try {
            const res = await API.post(`/quizzes/${id}/submit`, {
                answers: formattedAnswers,
                totalTimeSpent: (quiz?.duration * 60) - timeLeft,
                startedAt: startTime
            });
            navigate(`/results/${res.data.data.result._id}`, { replace: true });
        } catch (err) {
            alert('Submission failed');
            setSubmitting(false);
        }
    }, [answers, questions, id, timeLeft, submitting, quiz, startTime, navigate]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 && quiz) { submitQuiz(); return; }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, quiz, submitQuiz]);

    if (loading) return <div className="page"><div className="spinner"></div></div>;

    const q = questions[current];
    const progress = Object.keys(answers).length;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const isLowTime = timeLeft < 60;

    return (
        <div className="quiz-attempt-page">
            <div className="quiz-header glass-card" style={{ border: '1px solid var(--border-glass)' }}>
                <div className="quiz-info">
                    <h2 style={{ color: 'var(--text-primary)' }}>{quiz?.title}</h2>
                    <span className="badge badge-neutral" style={{ border: '1px solid var(--border-glass)' }}>Q {current + 1}/{questions.length}</span>
                </div>
                <div className="quiz-meta">
                    <div className="quiz-progress-bar">
                        <div className="quiz-progress-fill" style={{ width: `${(progress / questions.length) * 100}%` }}></div>
                    </div>
                    <div className={`quiz-timer ${isLowTime ? 'timer-danger' : ''}`} style={{ border: '1px solid var(--border-glass)' }}>
                        ⏱️ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </div>
                </div>
            </div>

            <div className="quiz-content">
                <div className="question-card glass-card animate-fade-in" style={{ border: '1px solid var(--border-glass)' }}>
                    <div className="question-number">Question {current + 1}</div>
                    <h3 className="question-text" style={{ color: 'var(--text-primary)' }}>{q?.questionText}</h3>
                    <div className="options-list">
                        {q?.options?.map((opt, i) => (
                            <button
                                key={opt._id || i}
                                className={`option-btn ${answers[q._id] === (opt._id || String(i)) ? 'selected' : ''}`}
                                onClick={() => setAnswers({ ...answers, [q._id]: opt._id || String(i) })}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                <span className="option-text">{opt.text}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="quiz-nav">
                    <button className="btn btn-outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Previous</button>
                    <div className="question-dots">
                        {questions.map((_, i) => (
                            <button key={i} className={`dot ${i === current ? 'active' : ''} ${answers[questions[i]?._id] ? 'answered' : ''}`} onClick={() => setCurrent(i)}>{i + 1}</button>
                        ))}
                    </div>
                    {current < questions.length - 1 ? (
                        <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Next →</button>
                    ) : (
                        <button className="btn btn-primary" onClick={submitQuiz} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
