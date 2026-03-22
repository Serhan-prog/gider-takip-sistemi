import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Layout, message } from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { Content } = Layout;

const ResetPassword = ({ isDarkMode }) => {
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const onFinish = async (values) => {
        if (!token) {
            message.error('Geçersiz bağlantı!');
            return;
        }
        setLoading(true);
        try {
            await api.post('/users/reset-password', {
                token: token,
                newPassword: values.password
            });
            message.success('Şifreniz başarıyla güncellendi!');
            navigate('/login');
        } catch (err) {
            message.error(err.response?.data?.message || 'İşlem başarısız!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#0f0f10' : '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Card style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', background: isDarkMode ? 'rgba(20,20,20,0.92)' : '#fff' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Title level={3} style={{ color: '#1890ff' }}>Yeni Şifre Belirle</Title>
                        <Text type="secondary">Lütfen yeni ve güvenli bir şifre giriniz.</Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Yeni Şifre" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Şifreyi onaylayın!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject(new Error('Şifreler uyuşmuyor!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Şifreyi Onayla" size="large" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<SaveOutlined />}>
                            Şifreyi Güncelle
                        </Button>
                    </Form>
                </Card>
            </Content>
        </Layout>
    );
};

export default ResetPassword;