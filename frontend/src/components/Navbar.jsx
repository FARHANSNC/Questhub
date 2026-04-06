import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">QuestHub</span>
                </Link>

                <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
                    <span className={`hamburger ${isOpen ? 'active' : ''}`}></span>
                </button>

                <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/quiz/random" className={`nav-link ${isActive('/quiz/random') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Random Quiz</Link>
                    <Link to="/quiz/subjects" className={`nav-link ${isActive('/quiz/subjects') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Subjects</Link>
                    <Link to="/group-play" className={`nav-link ${isActive('/group-play') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Group Play</Link>

                    {isAuthenticated ? (
                        <div className="nav-user">
                            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Dashboard</Link>
                            <Link to="/dashboard?tab=create" className={`nav-link`} onClick={() => setIsOpen(false)}>Create Quiz</Link>
                            {user?.role === 'admin' && (
                                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Admin</Link>
                            )}
                            <div className="nav-user-info" style={{ position: 'relative' }}>
                                <span className="nav-avatar" onClick={() => setShowProfile(!showProfile)} style={{ cursor: 'pointer' }}>{user?.fullName?.[0] || 'U'}</span>
                                {showProfile && (
                                    <div className="glass-card animate-fade-in-up" style={{ 
                                        position: 'absolute', top: '48px', right: '0', padding: '16px', minWidth: '220px', 
                                        zIndex: 1001, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-md)' 
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.role === 'admin' ? 'Admin' : user?.fullName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {user?.role === 'admin' ? '******' : user?.email}
                                        </div>
                                        <div style={{ marginTop: '4px' }}>
                                            <span className="badge badge-neutral">{user?.role}</span>
                                        </div>
                                    </div>
                                )}
                                <button className="btn btn-sm btn-outline" onClick={handleLogout}>Logout</button>
                            </div>
                        </div>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="btn btn-sm btn-outline" onClick={() => setIsOpen(false)}>Login</Link>
                            <Link to="/register" className="btn btn-sm btn-primary" onClick={() => setIsOpen(false)}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
