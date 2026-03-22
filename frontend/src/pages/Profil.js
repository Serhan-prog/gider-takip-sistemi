import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Divider, Row, Col, Avatar } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Title, Text } = Typography;

const Profil = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Profilim";
    }, []);

    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const res = await api.get('/users/me');
                setCurrentUser(res.data);
                form.setFieldsValue({
                    username: res.data.username,
                    email: res.data.email
                });
            } catch (err) {
                message.error("Profil bilgileri yüklenemedi.");
            }
        };
        fetchMyInfo();
    }, [form]);

    const handleGoBack = () => {
        if (currentUser?.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/personel');
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                username: values.username,
                email: values.email
            };
            if (values.newPassword) {
                payload.password = values.newPassword;
            }

            await api.put(`/users/profile-update`, payload);
            message.success("Profil başarıyla güncellendi!");
            form.setFieldValue("newPassword", "");
            form.setFieldValue("confirmPassword", "");
        } catch (err) {
            message.error(err.response?.data?.message || "Güncelleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '40px auto' }}>
            <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Row gutter={24} align="middle">
                    <Col span={24} style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        <Title level={2} style={{ marginTop: '10px' }}>Profil Ayarları</Title>
                        <Text type="secondary">Kişisel bilgilerinizi ve güvenliğinizi yönetin</Text>
                    </Col>
                </Row>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="username"
                                label="Kullanıcı Adı"
                                rules={[{ required: true, message: 'Kullanıcı adı boş bırakılamaz!' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Kullanıcı adınız" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="E-posta Adresi"
                                rules={[
                                    { required: true, message: 'E-posta gerekli!' },
                                    { type: 'email', message: 'Geçerli bir e-posta giriniz!' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="ornek@gmail.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left"><Text type="secondary">Şifre Değiştir</Text></Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="newPassword"
                                label="Yeni Şifre (Boş bırakılabilir)"
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="******" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="confirmPassword"
                                label="Yeni Şifre (Tekrar)"
                                dependencies={['newPassword']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Şifreler uyuşmuyor!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="******" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginTop: '30px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={loading}
                                block
                                size="large"
                                style={{ borderRadius: '8px', height: '50px' }}
                            >
                                Değişiklikleri Kaydet
                            </Button>

                            <Button
                                type="default"
                                block
                                size="large"
                                onClick={handleGoBack}
                                style={{ borderRadius: '8px' }}
                            >
                                Geri Dön
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Profil;