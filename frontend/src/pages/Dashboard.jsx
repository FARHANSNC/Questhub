import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [stats, setStats] = useState(null);
    const [recentResults, setRecentResults] = useState([]);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'create' ? 'create-quiz' : 'overview');

    // My Quizzes state
    const [myQuizzes, setMyQuizzes] = useState([]);

    // Create Quiz state
    const [subjects, setSubjects] = useState([]);
    const [quizForm, setQuizForm] = useState({
        title: '', description: '', subject: '', difficulty: 'mixed',
        duration: 10, totalQuestions: 5, passingScore: 40
    });
    
    // Inline Subject Creation state
    const [isCreatingSubject, setIsCreatingSubject] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '', icon: '⚪' });
    const [creatingSub, setCreatingSub] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState({
        questionText: '', difficulty: 'medium', options: [
            { text: '', isCorrect: true }, { text: '', isCorrect: false },
            { text: '', isCorrect: false }, { text: '', isCorrect: false }
        ], explanation: ''
    });
    const [quizMsg, setQuizMsg] = useState({ text: '', type: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        API.get(`/analytics/user/${user._id}`).then(r => setStats(r.data.data)).catch(() => {});
        API.get(`/results/user/${user._id}?limit=5`).then(r => setRecentResults(r.data.data.results)).catch(() => {});
        API.get('/subjects').then(r => setSubjects(r.data.data)).catch(() => {});
        API.get('/quizzes/my').then(r => setMyQuizzes(r.data.data)).catch(() => {});
    }, [user]);

    const addQuestion = () => {
        if (!currentQ.questionText.trim()) {
            setQuizMsg({ text: 'Please enter a question text', type: 'error' });
            return;
        }
        const filledOptions = currentQ.options.filter(o => o.text.trim());
        if (filledOptions.length < 2) {
            setQuizMsg({ text: 'Enter at least 2 options', type: 'error' });
            return;
        }
        if (!currentQ.options.some(o => o.isCorrect)) {
            setQuizMsg({ text: 'Mark one option as correct', type: 'error' });
            return;
        }
        setQuestions([...questions, { ...currentQ, options: currentQ.options.filter(o => o.text.trim()) }]);
        setCurrentQ({
            questionText: '', difficulty: 'medium', options: [
                { text: '', isCorrect: true }, { text: '', isCorrect: false },
                { text: '', isCorrect: false }, { text: '', isCorrect: false }
            ], explanation: ''
        });
        setQuizMsg({ text: `Question ${questions.length + 1} added!`, type: 'success' });
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const createQuiz = async () => {
        if (!quizForm.title.trim()) {
            setQuizMsg({ text: 'Enter a quiz title', type: 'error' });
            return;
        }
        if (!quizForm.subject) {
            setQuizMsg({ text: 'Select a subject', type: 'error' });
            return;
        }
        if (questions.length === 0) {
            setQuizMsg({ text: 'Add at least 1 question', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const questionIds = [];
            for (const q of questions) {
                const res = await API.post('/questions', {
                    questionText: q.questionText,
                    questionType: 'multiple-choice',
                    options: q.options,
                    subject: quizForm.subject,
                    difficulty: q.difficulty,
                    explanation: q.explanation
                });
                questionIds.push(res.data.data._id);
            }

            await API.post('/quizzes', {
                title: quizForm.title,
                description: quizForm.description,
                quizType: 'custom',
                subject: quizForm.subject,
                questions: questionIds,
                totalQuestions: questionIds.length,
                duration: parseInt(quizForm.duration),
                difficulty: quizForm.difficulty,
                passingScore: parseInt(quizForm.passingScore),
                isPublic: true
            });

            setQuizMsg({ text: 'Quiz created successfully!', type: 'success' });
            setQuizForm({ title: '', description: '', subject: '', difficulty: 'mixed', duration: 10, totalQuestions: 5, passingScore: 40 });
            setQuestions([]);
            // Refresh my quizzes
            API.get('/quizzes/my').then(r => setMyQuizzes(r.data.data)).catch(() => {});
        } catch (err) {
            setQuizMsg({ text: err.response?.data?.message || 'Failed to create quiz', type: 'error' });
        }
        setSaving(false);
    };

    const handleCreateSubject = async () => {
        if (!newSubject.name.trim() || !newSubject.code.trim()) {
            setQuizMsg({ text: 'Subject name and code are required', type: 'error' });
            return;
        }
        setCreatingSub(true);
        try {
            const res = await API.post('/subjects', newSubject);
            const createdSub = res.data.data;
            setSubjects([...subjects, createdSub]);
            setQuizForm({ ...quizForm, subject: createdSub._id });
            setIsCreatingSubject(false);
            setNewSubject({ name: '', code: '', description: '', icon: '⚪' });
            setQuizMsg({ text: 'Subject created successfully!', type: 'success' });
        } catch (err) {
            setQuizMsg({ text: err.response?.data?.message || 'Failed to create subject', type: 'error' });
        }
        setCreatingSub(false);
    };

    const deleteQuiz = async (quizId) => {
        if (!confirm('Delete this quiz?')) return;
        try {
            await API.delete(`/quizzes/${quizId}`);
            setMyQuizzes(myQuizzes.filter(q => q._id !== quizId));
            setQuizMsg({ text: 'Quiz deleted', type: 'success' });
        } catch {
            setQuizMsg({ text: 'Failed to delete quiz', type: 'error' });
        }
    };

    const tabs = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'create-quiz', label: '✏️ Create Quiz' },
        { id: 'my-quizzes', label: '📝 My Quizzes' }
    ];

    return (
        <div className="page container">
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">Welcome, {user?.role === 'admin' ? 'Admin' : user?.fullName} 👋</h1>
                <p className="page-subtitle">Organize your quiz hub</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
                        onClick={() => { setActiveTab(t.id); setQuizMsg({ text: '', type: '' }); }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                        {[
                            { label: 'Quizzes Taken', value: stats?.totalAttempts || 0, icon: '📝' },
                            { label: 'Average Score', value: `${stats?.averageScore || 0}%`, icon: '📊' },
                            { label: 'Pass Rate', value: `${stats?.passRate || 0}%`, icon: '✅' },
                            { label: 'Best Score', value: `${stats?.highestScore || 0}%`, icon: '🏆' }
                        ].map((s, i) => (
                            <div key={i} className="glass-card animate-fade-in-up" style={{ padding: '24px', animationDelay: `${i * 0.1}s` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{s.icon}</div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{s.label}</span>
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-2">
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>🚀 Quick Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={() => setActiveTab('create-quiz')} className="btn btn-primary">✏️ Create a Quiz</button>
                                <Link to="/quiz/random" className="btn btn-outline">🎲 Random Quiz</Link>
                                <Link to="/quiz/subjects" className="btn btn-outline">📚 Subject Quiz</Link>
                                <Link to="/group-play" className="btn btn-outline">🔔 Group Play</Link>
                                <Link to="/history" className="btn btn-outline">📋 View History</Link>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📈 Recent Activity</h3>
                            {recentResults.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No quizzes attempted yet. Start your first quiz!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {recentResults.map((r, i) => (
                                        <Link to={`/results/${r._id}`} key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-glass)', transition: 'var(--transition)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{r.quiz?.title || 'Quiz'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.completedAt).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`badge ${r.isPassed ? 'badge-neutral' : 'badge-muted'}`}>{r.percentage}%</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {stats?.subjectPerformance?.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📊 Subject Performance</h3>
                            <div className="grid grid-3">
                                {stats.subjectPerformance.map((sp, i) => (
                                    <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{sp.subject}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span>{sp.attempts} attempts</span>
                                            <span style={{ fontWeight: 700, color: 'var(--accent-dim)' }}>{sp.averageScore}%</span>
                                        </div>
                                        <div style={{ marginTop: '8px', height: '6px', borderRadius: '3px', background: 'var(--bg-glass)' }}>
                                            <div style={{ height: '100%', borderRadius: '3px', width: `${sp.averageScore}%`, background: 'var(--accent-dim)' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ===== MY QUIZZES TAB ===== */}
            {activeTab === 'my-quizzes' && (
                <div className="animate-fade-in-up">
                    {quizMsg.text && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem',
                            background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)'
                        }}>
                            {quizMsg.text}
                            <button onClick={() => setQuizMsg({ text: '', type: '' })} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        </div>
                    )}

                    {myQuizzes.length === 0 ? (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</p>
                            <p style={{ color: 'var(--text-muted)' }}>You haven't created any quizzes yet.</p>
                            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('create-quiz')}>✏️ Create Your First Quiz</button>
                        </div>
                    ) : (
                        <div className="grid grid-3">
                            {myQuizzes.map(q => (
                                <div key={q._id} className="glass-card" style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{q.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{q.description?.substring(0, 60) || 'No description'}</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        <span className="badge badge-neutral">{q.totalQuestions} Q</span>
                                        <span className="badge badge-neutral">{q.duration} min</span>
                                        <span className="badge badge-neutral">{q.totalAttempts || 0} attempts</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Link to={`/quiz/attempt/${q._id}`} className="btn btn-sm btn-outline" style={{ flex: 1 }}>▶ Play</Link>
                                        <button className="btn btn-sm btn-danger" onClick={() => deleteQuiz(q._id)}>✕ Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== CREATE QUIZ TAB ===== */}
            {activeTab === 'create-quiz' && (
                <div className="animate-fade-in-up">
                    {quizMsg.text && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem',
                            background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)'
                        }}>
                            {quizMsg.text}
                            <button onClick={() => setQuizMsg({ text: '', type: '' })} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        </div>
                    )}

                    <div className="grid grid-2">
                        {/* Left column — Quiz Details */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>📝 Quiz Details</h3>

                            <div className="input-group">
                                <label>Quiz Title *</label>
                                <input className="input-field" placeholder="e.g. JavaScript Fundamentals Quiz" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea className="input-field" rows="2" placeholder="Brief description of this quiz..." value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Subject *</label>
                                <select className="input-field" value={quizForm.subject} onChange={e => {
                                    if (e.target.value === '__new__') setIsCreatingSubject(true);
                                    else { setIsCreatingSubject(false); setQuizForm({ ...quizForm, subject: e.target.value }); }
                                }}>
                                    <option value="">Select a subject...</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} {s.icon ? `(${s.icon})` : ''}</option>)}
                                    {user?.role === 'admin' && <option value="__new__">➕ Add New Subject</option>}
                                </select>
                            </div>

                            {isCreatingSubject && (
                                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Create New Subject</h4>
                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                        <input className="input-field" placeholder="Subject Name (e.g. Physics)" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                        <input className="input-field" placeholder="Code (e.g. PHY101)" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })} />
                                        <input className="input-field" placeholder="Icon / Emoji (default: ⚪)" value={newSubject.icon} onChange={e => setNewSubject({ ...newSubject, icon: e.target.value })} />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '12px' }}>
                                        <input className="input-field" placeholder="Description (optional)" value={newSubject.description} onChange={e => setNewSubject({ ...newSubject, description: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-primary btn-sm" onClick={handleCreateSubject} disabled={creatingSub}>
                                            {creatingSub ? 'Creating...' : 'Save Subject'}
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => { setIsCreatingSubject(false); setQuizForm({ ...quizForm, subject: '' }); }}>Cancel</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                <div className="input-group">
                                    <label>Duration (minutes)</label>
                                    <input type="number" className="input-field" min="1" max="120" value={quizForm.duration} onChange={e => setQuizForm({ ...quizForm, duration: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Passing Score (%)</label>
                                    <input type="number" className="input-field" min="0" max="100" value={quizForm.passingScore} onChange={e => setQuizForm({ ...quizForm, passingScore: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Difficulty</label>
                                <select className="input-field" value={quizForm.difficulty} onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>

                            {/* Questions summary */}
                            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Questions Added</span>
                                    <span className="badge badge-neutral">{questions.length}</span>
                                </div>
                                {questions.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {questions.map((q, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-glass)', fontSize: '0.82rem' }}>
                                                <div style={{ flex: 1, marginRight: '8px' }}>
                                                    <span style={{ fontWeight: 600 }}>Q{i + 1}.</span> {q.questionText.substring(0, 50)}{q.questionText.length > 50 ? '...' : ''}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{q.difficulty}</span>
                                                    <button onClick={() => removeQuestion(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}>✕</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: '20px' }}
                                onClick={createQuiz}
                                disabled={saving || questions.length === 0}
                            >
                                {saving ? 'Creating Quiz...' : `🚀 Create Quiz (${questions.length} question${questions.length !== 1 ? 's' : ''})`}
                            </button>
                        </div>

                        {/* Right column — Add Questions */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>❓ Add Questions</h3>

                            <div className="input-group">
                                <label>Question Text *</label>
                                <textarea className="input-field" rows="3" placeholder="Type your question here..." value={currentQ.questionText} onChange={e => setCurrentQ({ ...currentQ, questionText: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label>Difficulty</label>
                                <select className="input-field" value={currentQ.difficulty} onChange={e => setCurrentQ({ ...currentQ, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            {currentQ.options.map((opt, i) => (
                                <div key={i} className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>Option {String.fromCharCode(65 + i)}</span>
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={opt.isCorrect}
                                            onChange={() => {
                                                const opts = currentQ.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                                                setCurrentQ({ ...currentQ, options: opts });
                                            }}
                                            style={{ accentColor: 'var(--accent)' }}
                                        />
                                        <span style={{ fontSize: '0.72rem', color: opt.isCorrect ? 'var(--accent-dim)' : 'var(--text-muted)' }}>
                                            {opt.isCorrect ? '✓ Correct' : 'Correct?'}
                                        </span>
                                    </label>
                                    <input
                                        className="input-field"
                                        placeholder={`Option ${String.fromCharCode(65 + i)}...`}
                                        value={opt.text}
                                        onChange={e => {
                                            const opts = [...currentQ.options];
                                            opts[i] = { ...opts[i], text: e.target.value };
                                            setCurrentQ({ ...currentQ, options: opts });
                                        }}
                                    />
                                </div>
                            ))}

                            <div className="input-group">
                                <label>Explanation (optional)</label>
                                <input className="input-field" placeholder="Why is this the correct answer?" value={currentQ.explanation} onChange={e => setCurrentQ({ ...currentQ, explanation: e.target.value })} />
                            </div>

                            <button className="btn btn-outline btn-full" onClick={addQuestion} style={{ borderColor: 'var(--accent-dim)' }}>
                                ➕ Add Question #{questions.length + 1}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
