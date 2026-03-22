import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Button, Modal, InputNumber, Form,
    Card, Typography, Space, message, Tag, Tooltip,
    Input, Popconfirm, Select, Divider, Row, Col, ConfigProvider
} from 'antd';

import {
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    WalletOutlined,
    SearchOutlined,
    SafetyCertificateOutlined,
    ClearOutlined,
    MailOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';

import trTR from 'antd/locale/tr_TR';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const UserList = ({ refreshKey }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [isBalanceModalVisible, setIsBalanceModalVisible] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);

    const [searchText, setSearchText] = useState("");
    const [roleFilter, setRoleFilter] = useState(null);
    const [balanceStatus, setBalanceStatus] = useState(null);

    const [tableKey, setTableKey] = useState(Date.now());

    const [form] = Form.useForm();
    const [balanceForm] = Form.useForm();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/all');
            const data = Array.isArray(res.data) ? res.data : [];
            setUsers(data);
            setFilteredUsers(data);
        } catch (err) {
            message.error("Kullanıcı listesi yüklenemedi!");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, refreshKey]);

    useEffect(() => {
        let result = [...users];

        if (searchText) {
            result = result.filter(u =>
                (u.username || "").toLowerCase().includes(searchText.toLowerCase()) ||
                (u.email || "").toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (roleFilter) {
            result = result.filter(u => u.role === roleFilter);
        }

        if (balanceStatus) {
            if (balanceStatus === 'positive') result = result.filter(u => u.currentBalance > 0);
            if (balanceStatus === 'negative') result = result.filter(u => u.currentBalance < 0);
            if (balanceStatus === 'zero') result = result.filter(u => u.currentBalance === 0);
        }

        setFilteredUsers(result);
    }, [searchText, roleFilter, balanceStatus, users]);

    const resetFilters = () => {
        setSearchText("");
        setRoleFilter(null);
        setBalanceStatus(null);
        setTableKey(Date.now());
        message.info("Filtreler sıfırlandı");
    };

    const handleOpenUserModal = (user = null) => {
        setSelectedUser(user);
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                role: user.role,
                password: ""
            });
        } else {
            form.resetFields();
        }
        setIsUserModalVisible(true);
    };

    const onUserSubmit = async (values) => {
        try {
            setLoading(true);
            if (selectedUser) {
                const updatePayload = { ...values };
                if (!updatePayload.password) delete updatePayload.password;
                await api.put(`/users/${selectedUser.id}`, updatePayload);
                message.success("Kullanıcı güncellendi");
            } else {
                await api.post('/users/register', values);
                message.success("Yeni kullanıcı eklendi");
            }
            setIsUserModalVisible(false);
            fetchUsers();
        } catch (err) {
            message.error(err.response?.data?.message || "İşlem başarısız");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const res = await api.delete(`/users/${id}`);
            message.success(res.data?.message || "Kullanıcı başarıyla silindi");
            fetchUsers();
        } catch (err) {
            message.error(err.response?.data?.message || "Silme işlemi sırasında bir hata oluştu!");
        }
    };

    const handleOpenBalanceModal = (user) => {
        setSelectedUser(user);
        balanceForm.resetFields();
        setIsBalanceModalVisible(true);
    };

    const onBalanceSubmit = async (values) => {
        try {
            await api.post('/finance/add-balance', {
                userId: selectedUser.id,
                amount: values.amount
            });
            message.success("Bakiye eklendi");
            setIsBalanceModalVisible(false);
            fetchUsers();
        } catch (err) {
            message.error("Hata oluştu");
        }
    };

    const columns = [
        {
            title: 'Personel Adı',
            key: 'username',
            render: (_, record) => (
                <Space>
                    <UserOutlined style={{ color: '#1890ff', backgroundColor: '#e6f7ff', padding: '6px', borderRadius: '50%' }} />
                    <Text strong>{record.username}</Text>
                </Space>
            ),
        },
        {
            title: 'E-posta (Gmail)',
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <Space>
                    <MailOutlined style={{ color: '#ff4d4f' }} />
                    <Text>{email || <Text type="danger" italic>Belirtilmedi</Text>}</Text>
                </Space>
            ),
        },
        {
            title: 'Yetki',
            dataIndex: 'role',
            key: 'role',
            align: 'center',
            render: (role) => (
                <Tag color={role === 'ADMIN' ? 'gold' : 'blue'} icon={<SafetyCertificateOutlined />}>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Bakiye',
            dataIndex: 'currentBalance',
            key: 'currentBalance',
            align: 'right',
            render: (balance) => (
                <Text strong style={{ color: balance > 0 ? '#52c41a' : balance < 0 ? '#f5222d' : '#bfbfbf' }}>
                    {balance?.toLocaleString('tr-TR')} ₺
                </Text>
            ),
            sorter: (a, b) => a.currentBalance - b.currentBalance,
        },
        {
            title: 'İşlemler',
            key: 'action',
            align: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Bakiye Yükle">
                        <Button type="text" icon={<WalletOutlined style={{color: '#52c41a'}} />} onClick={() => handleOpenBalanceModal(record)} />
                    </Tooltip>
                    <Tooltip title="Düzenle">
                        <Button type="text" icon={<EditOutlined style={{color: '#1890ff'}} />} onClick={() => handleOpenUserModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Personeli Sil"
                        description="Bu personeli silmek (pasifize etmek) istediğinize emin misiniz? Geçmiş veriler korunacaktır."
                        onConfirm={() => handleDeleteUser(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider locale={trTR}>
            <div style={{ padding: '0px' }}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                        <Col>
                            <Space size="middle">
                                <Tooltip title="Geri Dön">
                                    <Button
                                        shape="circle"
                                        icon={<ArrowLeftOutlined />}
                                        onClick={() => navigate('/admin/dashboard')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f5f5f5',
                                            color: '#595959',
                                            border: '1px solid #d9d9d9'
                                        }}
                                    />
                                </Tooltip>
                                <Title level={4} style={{ margin: 0 }}><UserOutlined /> Personel Yönetimi</Title>
                            </Space>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleOpenUserModal()}
                                size="large"
                                style={{ borderRadius: '8px', fontWeight: 'bold' }}
                            >
                                Yeni Personel Ekle
                            </Button>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Filtreleme Alanı */}
                    <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={8} lg={6}>
                            <Text type="secondary">Personel / E-posta Ara</Text>
                            <Input
                                placeholder="İsim veya e-posta..."
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ marginTop: '4px' }}
                                allowClear
                            />
                        </Col>
                        <Col xs={12} sm={6} lg={4}>
                            <Text type="secondary">Yetki Filtresi</Text>
                            <Select
                                placeholder="Yetki Seç"
                                style={{ width: '100%', marginTop: '4px' }}
                                value={roleFilter}
                                onChange={setRoleFilter}
                                allowClear
                            >
                                <Option value="ADMIN">ADMIN</Option>
                                <Option value="PERSONEL">PERSONEL</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} lg={4}>
                            <Text type="secondary">Bakiye Filtresi</Text>
                            <Select
                                placeholder="Bakiye Durumu"
                                style={{ width: '100%', marginTop: '4px' }}
                                value={balanceStatus}
                                onChange={setBalanceStatus}
                                allowClear
                            >
                                <Option value="positive">Bakiyesi Olanlar (+)</Option>
                                <Option value="negative">Borçlu Olanlar (-)</Option>
                                <Option value="zero">Sıfır Bakiye</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={4} lg={4}>
                            <Text type="secondary" style={{ visibility: 'hidden' }}>Aksiyon</Text>
                            <Button
                                icon={<ClearOutlined />}
                                onClick={resetFilters}
                                block
                                style={{ marginTop: '4px' }}
                            >
                                Temizle
                            </Button>
                        </Col>
                    </Row>

                    <Table
                        key={tableKey}
                        columns={columns}
                        dataSource={filteredUsers}
                        rowKey="id"
                        loading={loading}
                        scroll={{ x: 800 }}
                        bordered
                        size="middle"
                        pagination={{
                            defaultPageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total, range) => `${total} personelden ${range[0]}-${range[1]} arası gösteriliyor`,
                            position: ['bottomCenter'],
                            locale: { items_per_page: '/ sayfa' }
                        }}
                    />
                </Card>

                <Modal
                    title={selectedUser ? "Personel Bilgilerini Düzenle" : "Yeni Personel Kaydı"}
                    open={isUserModalVisible}
                    onCancel={() => setIsUserModalVisible(false)}
                    onOk={() => form.submit()}
                    destroyOnClose
                    centered
                    okText="Kaydet"
                    cancelText="İptal"
                >
                    <Form form={form} layout="vertical" onFinish={onUserSubmit} style={{ marginTop: '16px' }}>
                        <Form.Item name="username" label="Kullanıcı Adı" rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Kullanıcı adı giriniz" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="E-posta (Gmail)"
                            rules={[
                                { required: true, message: 'E-posta adresi gerekli!' },
                                { type: 'email', message: 'Geçerli bir e-posta giriniz!' }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="ornek@gmail.com" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={selectedUser ? "Şifreyi Güncelle (Opsiyonel)" : "Şifre Belirle"}
                            rules={[{ required: !selectedUser, message: 'Şifre gerekli!' }]}
                        >
                            <Input.Password placeholder="******" />
                        </Form.Item>

                        <Form.Item name="role" label="Yetki Rolü" rules={[{ required: true, message: 'Rol seçimi zorunludur!' }]}>
                            <Select placeholder="Rol seçin">
                                <Option value="PERSONEL">PERSONEL</Option>
                                <Option value="ADMIN">ADMIN</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={<span><WalletOutlined /> Bakiye Yükle: {selectedUser?.username}</span>}
                    open={isBalanceModalVisible}
                    onCancel={() => setIsBalanceModalVisible(false)}
                    onOk={() => balanceForm.submit()}
                    centered
                    okText="Bakiye Ekle"
                    cancelText="Vazgeç"
                >
                    <Form form={balanceForm} layout="vertical" onFinish={onBalanceSubmit}>
                        <Form.Item
                            name="amount"
                            label="Eklenecek Tutar (₺)"
                            rules={[{ required: true, message: 'Tutar girmelisiniz!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0.01}
                                placeholder="0.00"
                                formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/₺\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default UserList;