import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card animate-fade-in-up" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to continue to QuestHub</p>
                </div>
                {error && <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" className="input-field" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" className="input-field" placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
