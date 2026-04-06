import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('questhub_token');
        const stored = localStorage.getItem('questhub_user');
        if (token && stored) {
            setUser(JSON.parse(stored));
            API.get('/auth/me').then(res => {
                setUser(res.data.data);
                localStorage.setItem('questhub_user', JSON.stringify(res.data.data));
            }).catch(() => {
                localStorage.removeItem('questhub_token');
                localStorage.removeItem('questhub_user');
                setUser(null);
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const res = await API.post('/auth/login', credentials);
        const { user, token } = res.data.data;
        localStorage.setItem('questhub_token', token);
        localStorage.setItem('questhub_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (data) => {
        const res = await API.post('/auth/register', data);
        const { user, token } = res.data.data;
        localStorage.setItem('questhub_token', token);
        localStorage.setItem('questhub_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('questhub_token');
        localStorage.removeItem('questhub_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
