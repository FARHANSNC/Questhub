import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card animate-fade-in-up" style={{ padding: '40px', maxWidth: '480px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Account</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join QuestHub and start quizzing!</p>
                </div>
                {error && <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div className="input-group"><label>Full Name *</label><input className="input-field" placeholder="Your full name" value={form.fullName} onChange={set('fullName')} required /></div>
                        <div className="input-group"><label>Username *</label><input className="input-field" placeholder="Choose a username" value={form.username} onChange={set('username')} required minLength={3} /></div>
                    </div>
                    <div className="input-group"><label>Email *</label><input type="email" className="input-field" placeholder="your@email.com" value={form.email} onChange={set('email')} required /></div>
                    <div className="input-group"><label>Password *</label><input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} /></div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
