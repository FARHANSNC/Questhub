import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function SubjectQuiz() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/subjects').then(r => { setSubjects(r.data.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const startSubjectQuiz = async (subjectId) => {
        try {
            // Find a quiz for this subject
            const res = await API.get(`/quizzes?subject=${subjectId}&limit=1`);
            if (res.data.data.quizzes.length > 0) {
                navigate(`/quiz/attempt/${res.data.data.quizzes[0]._id}`);
            } else {
                alert('No quiz available for this subject yet');
            }
        } catch { alert('Failed to load quiz'); }
    };

    if (loading) return <div className="page"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">🔘 Subject Quiz</h1>
                <p className="page-subtitle">Choose a subject and test your knowledge</p>
            </div>
            <div className="grid grid-3">
                {subjects.map((s, i) => (
                    <div key={s._id} className="glass-card animate-fade-in-up" style={{ padding: '32px', textAlign: 'center', cursor: 'pointer', animationDelay: `${i * 0.08}s`, border: '1px solid var(--border-glass)' }}
                        onClick={() => startSubjectQuiz(s._id)}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{s.icon || '📚'}</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{s.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>{s.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <span className="badge badge-neutral" style={{ border: '1px solid var(--border-glass)' }}>{s.totalQuestions} Q</span>
                            <span className="badge badge-neutral" style={{ border: '1px solid var(--border-glass)' }}>{s.totalQuizzes} Quizzes</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
