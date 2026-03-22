import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Layout, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { Content } = Layout;

const ForgotPassword = ({ isDarkMode }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await api.post('/users/forgot-password', { email: values.email });
            setSuccess(true);
            message.success('Sıfırlama bağlantısı e-postanıza gönderildi!');
        } catch (err) {
            message.error(err.response?.data?.message || 'Bir hata oluştu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{
            minHeight: '100vh',
            background: isDarkMode ? '#0f0f10' : '#f5f7fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Card style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '16px',
                    background: isDarkMode ? 'rgba(20,20,20,0.92)' : '#fff',
                    border: isDarkMode ? '1px solid #262626' : '1px solid #f0f0f0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Title level={3} style={{ color: '#1890ff' }}>Şifremi Unuttum</Title>
                        <Text type="secondary">Sisteme kayıtlı e-posta adresinizi giriniz.</Text>
                    </div>

                    {success ? (
                        <Alert
                            message="E-posta Gönderildi"
                            description="Lütfen gelen kutunuzu kontrol edin."
                            type="success"
                            showIcon
                        />
                    ) : (
                        <Form layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                name="email"
                                rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta girin!' }]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="E-posta adresiniz" size="large" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<SendOutlined />}>
                                Bağlantı Gönder
                            </Button>
                        </Form>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/login"><ArrowLeftOutlined /> Giriş Ekranına Dön</Link>
                    </div>
                </Card>
            </Content>
        </Layout>
    );
};

export default ForgotPassword;