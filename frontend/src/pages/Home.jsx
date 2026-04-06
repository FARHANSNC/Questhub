import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-bg-effects">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                </div>
                <div className="hero-content animate-fade-in-up">
                    <div className="hero-badge">⚡ Smart Quiz Platform</div>
                    <h1 className="hero-title">
                        Challenge Your Mind with <span className="gradient-text">QuestHub</span>
                    </h1>
                    <p className="hero-subtitle">
                        Take random quizzes, master subjects, or compete in real-time buzzer battles.
                        Instant evaluation, live leaderboards, and powerful analytics — all in one platform.
                    </p>
                    <div className="hero-actions">
                        <Link to="/quiz/random" className="btn btn-primary btn-lg">🎲 Random Quiz</Link>
                        <Link to="/quiz/subjects" className="btn btn-outline btn-lg">📚 Subject Quiz</Link>
                        <Link to="/group-play" className="btn btn-outline btn-lg">🔔 Group Play</Link>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat"><span className="stat-num">6</span><span className="stat-label">Subjects</span></div>
                        <div className="hero-stat"><span className="stat-num">60+</span><span className="stat-label">Questions</span></div>
                        <div className="hero-stat"><span className="stat-num">3</span><span className="stat-label">Quiz Modes</span></div>
                        <div className="hero-stat"><span className="stat-num">∞</span><span className="stat-label">Fun</span></div>
                    </div>
                </div>
            </section>

            <section className="features container">
                <h2 className="section-title">Three Ways to <span className="gradient-text">Play</span></h2>
                <div className="features-grid">
                    <div className="feature-card glass-card animate-fade-in-up">
                        <div className="feature-icon">🎲</div>
                        <h3>Random Quiz</h3>
                        <p>Get a mix of questions from all subjects. Perfect for quick practice and discovering new topics.</p>
                        <Link to="/quiz/random" className="feature-link">Start Now →</Link>
                    </div>
                    <div className="feature-card glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="feature-icon">📚</div>
                        <h3>Subject Quiz</h3>
                        <p>Choose your subject — Math, Science, History, Geography, GK or CS — and test your knowledge.</p>
                        <Link to="/quiz/subjects" className="feature-link">Choose Subject →</Link>
                    </div>
                    <div className="feature-card glass-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="feature-icon">🔔</div>
                        <h3>Buzzer Group Play</h3>
                        <p>Create or join a room. First to buzz gets to answer! Real-time competition with live leaderboards.</p>
                        <Link to="/group-play" className="feature-link">Create Room →</Link>
                    </div>
                </div>
            </section>

            <section className="how-it-works container">
                <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
                <div className="steps-grid">
                    <div className="step glass-card"><div className="step-num">1</div><h4>Choose Mode</h4><p>Pick Random, Subject, or Group Play</p></div>
                    <div className="step glass-card"><div className="step-num">2</div><h4>Answer Questions</h4><p>Complete the quiz within the time limit</p></div>
                    <div className="step glass-card"><div className="step-num">3</div><h4>Get Results</h4><p>Instant scoring with detailed breakdown</p></div>
                    <div className="step glass-card"><div className="step-num">4</div><h4>Track Progress</h4><p>View analytics and improve over time</p></div>
                </div>
            </section>

            {!isAuthenticated && (
                <section className="cta container">
                    <div className="cta-card glass-card">
                        <h2>Ready to get started?</h2>
                        <p>Create a free account to track your progress and compete with others.</p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
                            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
                        </div>
                    </div>
                </section>
            )}

            <footer className="footer">
                <div className="container">
                    <p>© 2025 QuestHub — Shibli National College, Azamgarh</p>
                    <p className="footer-sub">Built by Farhan Ahmad, Mohd Wasiq, Mohd Laraib, Mohammad Tahshim, Mohammad Sharib</p>
                </div>
            </footer>
        </div>
    );
}
