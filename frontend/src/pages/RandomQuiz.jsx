import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function RandomQuiz() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({ totalQuestions: 10, duration: 10, difficulty: 'mixed' });

    const startQuiz = async () => {
        setLoading(true);
        try {
            const res = await API.post('/quizzes/random', config);
            const quizId = res.data.data._id;
            navigate(`/quiz/attempt/${quizId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate quiz');
        }
        setLoading(false);
    };

    return (
        <div className="page container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card animate-fade-in-up" style={{ maxWidth: '480px', width: '100%', padding: '48px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎲</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--accent)' }}>Random Quiz</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>Questions from all subjects, randomly selected!</p>

                <div className="input-group" style={{ textAlign: 'left' }}>
                    <label>Number of Questions</label>
                    <select className="input-field" value={config.totalQuestions} onChange={e => setConfig({ ...config, totalQuestions: parseInt(e.target.value) })}>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                    </select>
                </div>
                <div className="input-group" style={{ textAlign: 'left' }}>
                    <label>Time Limit</label>
                    <select className="input-field" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })}>
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                    </select>
                </div>
                <div className="input-group" style={{ textAlign: 'left' }}>
                    <label>Difficulty</label>
                    <select className="input-field" value={config.difficulty} onChange={e => setConfig({ ...config, difficulty: e.target.value })}>
                        <option value="mixed">Mixed</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <button className="btn btn-primary btn-full btn-lg" onClick={startQuiz} disabled={loading} style={{ marginTop: '16px' }}>
                    {loading ? 'Generating...' : 'Start Quiz'}
                </button>
            </div>
        </div>
    );
}
