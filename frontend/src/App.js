import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { ConfigProvider, theme } from 'antd';
import trTR from 'antd/locale/tr_TR';

import MainLayout from './components/MainLayout';

import 'antd/dist/reset.css';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PersonelDashboard from './pages/Personel/PersonelDashboard';
import Rapor from './pages/Admin/Rapor';
import BulkTransactions from './pages/Admin/BulkTransactions';
import Profil from './pages/Profil';
import UserList from './pages/Admin/UserList';

const { defaultAlgorithm, darkAlgorithm } = theme;

function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    return (
        <ConfigProvider
            locale={trTR}
            theme={{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 12,
                },
                components: {
                    Table: { borderColor: isDarkMode ? '#303030' : undefined },
                    Pagination: { colorPrimary: '#1890ff' },
                    Input: { colorPrimary: '#1890ff' },
                    Card: { borderRadiusLG: 16 },
                },
            }}
        >
            <AuthProvider>
                <Router>
                    <SessionTimeoutModal />
                    <Routes>
                        {/* --- DIŞARIDA KALAN ROTALAR --- */}
                        <Route path="/login" element={<Login isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                        <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} />} />
                        <Route path="/reset-password" element={<ResetPassword isDarkMode={isDarkMode} />} />

                        {/* --- İÇERİDE KALAN ROTALAR --- */}
                        <Route
                            path="/*"
                            element={
                                <PrivateRoute>
                                    <MainLayout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
                                        <Routes>
                                            {/* Ortak Rotalar */}
                                            <Route path="profil" element={<Profil isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />

                                            {/* Admin Rotaları */}
                                            <Route path="admin/dashboard" element={<AdminDashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                                            <Route path="admin/users" element={<UserList isDarkMode={isDarkMode} />} />
                                            <Route path="admin/raporlar" element={<Rapor isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                                            <Route path="admin/bulk-transactions" element={<BulkTransactions isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />

                                            {/* Personel Rotaları */}
                                            <Route path="personel/dashboard" element={<PersonelDashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                                            <Route path="personel/raporlar" element={<Rapor isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                                            <Route path="personel/bulk-transactions" element={<BulkTransactions isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />

                                            {/* Yönlendirmeler */}
                                            <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
                                            <Route path="personel" element={<Navigate to="/personel/dashboard" replace />} />

                                            {/* Bilinmeyen iç rotaları ana sayfalara yönlendir */}
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </MainLayout>
                                </PrivateRoute>
                            }
                        />

                        {/* --- GENEL YÖNLENDİRMELER --- */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;