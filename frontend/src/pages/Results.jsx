import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';

export default function Results() {
    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get(`/results/${id}`).then(r => { setResult(r.data.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page"><div className="spinner"></div></div>;
    if (!result) return <div className="page container"><p>Result not found</p></div>;

    const scoreColor = 'var(--accent)';

    return (
        <div className="page container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass-card animate-fade-in-up" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{result.isPassed ? '⚪' : '⚫'}</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>{result.isPassed ? 'Congratulations!' : 'Better Luck Next Time!'}</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{result.quiz?.title}</p>

                <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: `1px solid var(--accent-dim)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `var(--shadow-glow)` }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)' }}>{result.percentage}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
                    {[
                        { l: 'Correct', v: result.correctAnswers },
                        { l: 'Wrong', v: result.incorrectAnswers },
                        { l: 'Skipped', v: result.unanswered },
                        { l: 'Time', v: `${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s` }
                    ].map((s, i) => (
                        <div key={i} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{s.v}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📋 Detailed Review</h3>
                {result.answers?.map((a, i) => (
                    <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', marginBottom: '12px', border: `1px solid var(--border-glass)` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{a.isCorrect ? '✅' : '❌'}</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{a.question?.questionText}</p>
                                {a.question?.options?.map((opt, j) => (
                                    <div key={j} style={{
                                        padding: '8px 12px', borderRadius: '8px', marginBottom: '6px', fontSize: '0.85rem',
                                        background: opt.isCorrect ? 'rgba(0,0,0,0.08)' : (a.selectedOption === opt._id && !a.isCorrect) ? 'rgba(0,0,0,0.03)' : 'transparent',
                                        color: opt.isCorrect ? 'var(--accent)' : (a.selectedOption === opt._id && !a.isCorrect) ? 'var(--text-secondary)' : 'var(--text-secondary)',
                                        border: opt.isCorrect ? '1px solid var(--accent-subtle)' : '1px solid transparent'
                                    }}>
                                        {opt.isCorrect ? '• ' : ''}{opt.text}
                                    </div>
                                ))}
                                {a.question?.explanation && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>ℹ️ {a.question.explanation}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/quiz/random" className="btn btn-primary">🎲 Try Another Quiz</Link>
                <Link to="/quiz/subjects" className="btn btn-outline">📚 Subject Quiz</Link>
                <Link to="/dashboard" className="btn btn-outline">📊 Dashboard</Link>
            </div>
        </div>
    );
}
