import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setUser(res.data);
            }).catch(() => {
                sessionStorage.removeItem('token');
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        sessionStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const register = async (name, email, password) => {
        const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        sessionStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
