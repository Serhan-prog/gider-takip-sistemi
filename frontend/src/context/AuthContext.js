import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Kullanıcı verisi ayrıştırılamadı:", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);

        const handleAuthError = () => {
            console.warn("Oturum süresi doldu veya yetkisiz erişim, veriler temizleniyor...");
            localStorage.removeItem('user');
            setUser(null);

        };

        window.addEventListener('auth-error', handleAuthError);

        return () => window.removeEventListener('auth-error', handleAuthError);
    }, []);


    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };


    const logout = async () => {
        try {

            await api.post('/users/logout');
        } catch (err) {

            console.error("Logout isteği sırasında hata oluştu:", err);
        } finally {

            localStorage.removeItem('user');
            setUser(null);


            if (window.location.pathname !== '/login') {
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);