import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Layout, Tooltip } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, SunOutlined, MoonOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Content } = Layout;

const Login = ({ isDarkMode, setIsDarkMode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        document.title = "Giriş Yap | DDO Panel";
    }, []);

    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/users/login', {
                username: values.username,
                password: values.password,
            });

            const { role, username: resUser, userId } = response.data;

            login({ username: resUser, role, userId });

            if (role === 'ADMIN') navigate('/admin');
            else navigate('/personel');
        } catch (err) {
            console.error('Giriş Hatası:', err.response?.data || err.message);
            setError('Kullanıcı adı veya şifre hatalı!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            style={{
                minHeight: '100vh',
                background: isDarkMode
                    ? 'linear-gradient(135deg, #0f0f10 0%, #1b1b1d 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                position: 'relative',
            }}
        >
            <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}>
                <Tooltip title={isDarkMode ? 'Açık moda geç' : 'Koyu moda geç'}>
                    <Button
                        shape="circle"
                        size="large"
                        icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        style={{
                            width: 44,
                            height: 44,
                            border: isDarkMode ? '1px solid #303030' : '1px solid #e5e7eb',
                            background: isDarkMode ? 'rgba(31,31,31,0.9)' : 'rgba(255,255,255,0.9)',
                            boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.35)' : '0 8px 20px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.25s',
                        }}
                    />
                </Tooltip>
            </div>

            <Content
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0 20px',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: isHovered ? '520px' : '460px',
                        height: isHovered ? '520px' : '460px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(24,144,255,0.85), transparent 70%)',
                        filter: isHovered ? 'blur(75px)' : 'blur(90px)',
                        opacity: isDarkMode
                            ? (isHovered ? 1 : 0.85)
                            : (isHovered ? 0.85 : 0.55),
                        transition: 'all 0.35s ease',
                        zIndex: 0,
                    }}
                />

                <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        width: '100%',
                        maxWidth: '420px',
                        zIndex: 1,
                        transform: isHovered ? 'translateY(-10px) scale(1.015)' : 'translateY(0px) scale(1)',
                        transition: 'transform 0.28s ease',
                    }}
                >
                    <Card
                        bordered={false}
                        bodyStyle={{ padding: 24 }}
                        style={{
                            width: '100%',
                            borderRadius: '16px',
                            padding: '10px',
                            background: isDarkMode ? 'rgba(20,20,20,0.92)' : '#fff',
                            border: isDarkMode ? '1px solid #262626' : '1px solid #f0f0f0',
                            transition: 'all 0.3s',
                            boxShadow: isHovered
                                ? (isDarkMode
                                    ? '0 22px 60px rgba(0,0,0,0.65)'
                                    : '0 22px 60px rgba(0,0,0,0.22)')
                                : (isDarkMode
                                    ? '0 10px 25px rgba(0,0,0,0.45)'
                                    : '0 10px 25px rgba(0,0,0,0.1)'),
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <Title level={3} style={{ color: '#1890ff', marginBottom: '5px' }}>
                                Dijital Dönüşüm Ofisi
                            </Title>
                            <Text type="secondary" strong>
                                Takip Sistemi
                            </Text>
                        </div>

                        {error && (
                            <Alert message={error} type="error" showIcon style={{ marginBottom: '20px', borderRadius: '8px' }} />
                        )}

                        <Form name="login_form" layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
                            <Form.Item
                                label="Kullanıcı Adı"
                                name="username"
                                rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin!' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Kullanıcı adınız"
                                    size="large"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Şifre"
                                name="password"
                                rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Şifreniz"
                                    size="large"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Form.Item>


                            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                                <Link to="/forgot-password" style={{ fontSize: '14px', color: '#1890ff' }}>
                                    <QuestionCircleOutlined /> Şifremi Unuttum
                                </Link>
                            </div>

                            <Form.Item style={{ marginBottom: '10px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={loading}
                                    icon={<LoginOutlined />}
                                    style={{
                                        height: '48px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                    }}
                                >
                                    Giriş Yap
                                </Button>
                            </Form.Item>
                        </Form>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                © 2026 İnönü Üniversitesi DDO Ofisi
                            </Text>
                        </div>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default Login;