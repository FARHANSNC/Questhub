import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [users, setUsers] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '', icon: '⚪' });
    const [newQuestion, setNewQuestion] = useState({ questionText: '', subject: '', difficulty: 'medium', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, subjectsRes, usersRes, quizzesRes] = await Promise.all([
                API.get('/analytics/global'),
                API.get('/subjects'),
                API.get('/users?limit=100'),
                API.get('/quizzes?limit=100')
            ]);
            setStats(statsRes.data.data);
            setSubjects(subjectsRes.data.data);
            setUsers(usersRes.data.data.users);
            setQuizzes(quizzesRes.data.data.quizzes);
        } catch { }
        try {
            const qRes = await API.get('/questions?limit=100');
            setQuestions(qRes.data.data.questions);
        } catch { }
    };

    const createSubject = async (e) => {
        e.preventDefault();
        try {
            await API.post('/subjects', newSubject);
            setMsg('Subject created!');
            setNewSubject({ name: '', code: '', description: '', icon: '⚪' });
            loadData();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const createQuestion = async (e) => {
        e.preventDefault();
        try {
            await API.post('/questions', newQuestion);
            setMsg('Question created!');
            setNewQuestion({ questionText: '', subject: '', difficulty: 'medium', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '' });
            loadData();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const deleteUser = async (id) => {
        if (!confirm('Delete this user?')) return;
        try { await API.delete(`/users/${id}`); loadData(); setMsg('User deleted'); } catch { setMsg('Error'); }
    };

    const deleteSubject = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try { await API.delete(`/subjects/${id}`); loadData(); setMsg('Subject deleted'); } catch { setMsg('Error'); }
    };

    const deleteQuiz = async (id) => {
        if (!confirm('Delete this quiz?')) return;
        try { await API.delete(`/quizzes/${id}`); loadData(); setMsg('Quiz deleted'); } catch { setMsg('Error'); }
    };

    const tabs = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'subjects', label: '📚 Subjects' },
        { id: 'questions', label: '❓ Questions' },
        { id: 'quizzes', label: '📝 Quizzes' },
        { id: 'users', label: '👥 Users' }
    ];

    if (user?.role !== 'admin') return <div className="page container"><p>Admin access required</p></div>;

    return (
        <div className="page container">
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">🛠️ Admin Dashboard</h1>
                <p className="page-subtitle">Manage your QuestHub platform</p>
            </div>

            {msg && <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>{msg} <button onClick={() => setMsg('')} style={{ marginLeft: '8px', background: 'none', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>✕</button></div>}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(t => (
                    <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
            </div>

            {tab === 'overview' && stats && (
                <div className="grid grid-4">
                    {[
                        { l: 'Total Users', v: stats.totalUsers, icon: '👥' },
                        { l: 'Total Quizzes', v: stats.totalQuizzes, icon: '📝' },
                        { l: 'Total Attempts', v: stats.totalAttempts, icon: '📊' },
                        { l: 'Avg Score', v: `${stats.averageScore}%`, icon: '🎯' }
                    ].map((s, i) => (
                        <div key={i} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{s.v}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'subjects' && (
                <div className="grid grid-2">
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Add Subject</h3>
                        <form onSubmit={createSubject}>
                            <div className="input-group"><label>Name</label><input className="input-field" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} required /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div className="input-group"><label>Code</label><input className="input-field" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })} required placeholder="e.g. MATH101" /></div>
                                <div className="input-group"><label>Icon</label><input className="input-field" value={newSubject.icon} onChange={e => setNewSubject({ ...newSubject, icon: e.target.value })} placeholder="e.g. ⚪" /></div>
                            </div>
                            <div className="input-group"><label>Description</label><input className="input-field" value={newSubject.description} onChange={e => setNewSubject({ ...newSubject, description: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary btn-full">Create Subject</button>
                        </form>
                    </div>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Subjects ({subjects.length})</h3>
                        {subjects.map(s => (
                            <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-glass)', marginBottom: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.code} · {s.totalQuestions} questions</div>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteSubject(s._id)}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'questions' && (
                <div className="grid grid-2">
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Add Question</h3>
                        <form onSubmit={createQuestion}>
                            <div className="input-group"><label>Question Text</label><textarea className="input-field" rows="3" value={newQuestion.questionText} onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })} required /></div>
                            <div className="input-group"><label>Subject</label>
                                <select className="input-field" value={newQuestion.subject} onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })} required>
                                    <option value="">Select...</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Difficulty</label>
                                <select className="input-field" value={newQuestion.difficulty} onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                </select>
                            </div>
                            {newQuestion.options.map((opt, i) => (
                                <div key={i} className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Option {String.fromCharCode(65 + i)}
                                        <input type="checkbox" checked={opt.isCorrect} onChange={e => {
                                            const opts = [...newQuestion.options];
                                            opts.forEach(o => o.isCorrect = false);
                                            opts[i].isCorrect = e.target.checked;
                                            setNewQuestion({ ...newQuestion, options: opts });
                                        }} /> <span style={{ fontSize: '0.75rem' }}>Correct</span>
                                    </label>
                                    <input className="input-field" value={opt.text} onChange={e => {
                                        const opts = [...newQuestion.options];
                                        opts[i].text = e.target.value;
                                        setNewQuestion({ ...newQuestion, options: opts });
                                    }} required />
                                </div>
                            ))}
                            <div className="input-group"><label>Explanation</label><input className="input-field" value={newQuestion.explanation} onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary btn-full">Create Question</button>
                        </form>
                    </div>
                    <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Questions ({questions.length})</h3>
                        {questions.map((q) => (
                            <div key={q._id} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-glass)', marginBottom: '8px', fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: 600 }}>{q.questionText}</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <span className="badge badge-neutral">{q.subject?.name}</span>
                                    <span className="badge badge-neutral">{q.difficulty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'quizzes' && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Quizzes ({quizzes.length})</h3>
                    <div className="grid grid-3">
                        {quizzes.map(q => (
                            <div key={q._id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{q.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{q.description?.substring(0, 60)}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <span className="badge badge-neutral">{q.totalQuestions} Q</span>
                                    <span className="badge badge-neutral">{q.duration} min</span>
                                    <span className="badge badge-neutral">{q.totalAttempts} attempts</span>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteQuiz(q._id)}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'users' && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: 700 }}>Users ({users.length})</h3>
                        <button className="btn btn-sm btn-outline" onClick={async () => {
                            if (!confirm('Recalculate stats for all users? This might take a few seconds.')) return;
                            try {
                                setMsg('Syncing stats...');
                                await API.get('/analytics/sync');
                                setMsg('Stats synced successfully!');
                                loadData();
                            } catch { setMsg('Error syncing stats'); }
                        }}>🔄 Sync All Stats</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    {['Name', 'Email', 'Role', 'Quizzes', 'Avg Score', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: '0.9rem' }}>{u.fullName}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ padding: '10px 12px' }}><span className="badge badge-neutral">{u.role}</span></td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.9rem' }}>{u.totalQuizzesTaken || 0}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '0.9rem' }}>{u.averageScore || 0}%</td>
                                        <td style={{ padding: '10px 12px' }}>{u.role !== 'admin' && <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u._id)}>Delete</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
