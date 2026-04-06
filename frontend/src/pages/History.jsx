import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function History() {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!user) return;
        API.get(`/results/user/${user._id}?limit=50`).then(r => {
            setResults(r.data.data.results);
            setStats(r.data.data.statistics);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="page"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">📋 Quiz History</h1>
                <p className="page-subtitle">Review all your past quiz attempts</p>
            </div>

            {stats && (
                <div className="grid grid-4" style={{ marginBottom: '24px' }}>
                    {[
                        { l: 'Total Attempts', v: stats.totalAttempts, icon: '⚪' },
                        { l: 'Average Score', v: `${stats.averageScore}%`, icon: '📊' },
                        { l: 'Pass Rate', v: `${stats.passRate}%`, icon: '✅' },
                        { l: 'Total Time', v: `${Math.round(stats.totalTimeSpent / 60)}m`, icon: '⏱️' }
                    ].map((s, i) => (
                        <div key={i} className="glass-card" style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0', color: 'var(--accent)' }}>{s.v}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            )}

            {results.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</p>
                    <p style={{ color: 'var(--text-muted)' }}>No quiz attempts yet.</p>
                    <Link to="/quiz/random" className="btn btn-primary" style={{ marginTop: '16px' }}>Start Your First Quiz</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {results.map((r, i) => (
                        <Link to={`/results/${r._id}`} key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid var(--border-glass)' }}>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{r.quiz?.title || 'Quiz'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                                    <span>{r.quiz?.subject?.name}</span>
                                    <span>{new Date(r.completedAt).toLocaleDateString()}</span>
                                    <span>{r.correctAnswers}/{r.totalQuestions} correct</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="badge badge-neutral" style={{ border: '1px solid var(--border-glass)' }}>{r.isPassed ? 'PASSED' : 'FAILED'}</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{r.percentage}%</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
