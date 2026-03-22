import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Typography, Button, Space, Tag, Tooltip, message } from 'antd';
import {
    ArrowLeftOutlined,
    ShoppingCartOutlined,
    InfoCircleOutlined,
    FileSearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const BulkTransactions = ({ isDarkMode, setIsDarkMode }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { user } = useAuth();

    const backPath = useMemo(() => {
        const role = user?.role;
        if (role === 'PERSONEL') return '/personel';
        if (role === 'ADMIN') return '/admin';
        return '/personel';
    }, [user?.role]);

    const fetchBulkData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/transactions');

            const filteredData = Array.isArray(response.data)
                ? response.data.filter((item) => Number(item.splitCount) > 1)
                : [];

            setTransactions(filteredData);
        } catch (err) {
            message.error('Veriler yüklenirken bir hata oluştu!');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBulkData();
    }, []);

    useEffect(() => {
        document.title = 'Toplu Alışverişler';
    }, []);

    const viewReceipt = (filePath) => {
        if (!filePath) {
            message.error('Bu işleme ait belge bulunamadı.');
            return;
        }
        const cleanPath = String(filePath).replace(/\\/g, '/');
        const baseUrl = 'http://localhost:8080/';
        const finalUrl = cleanPath.startsWith('uploads')
            ? `${baseUrl}${cleanPath}`
            : `${baseUrl}uploads/receipts/${cleanPath}`;
        window.open(finalUrl, '_blank');
    };

    const columns = [
        {
            title: 'İşlem Tarihi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
            sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
            title: 'İşlemi Yapan',
            dataIndex: ['admin', 'username'],
            key: 'admin',
            render: (u) => <Tag color="blue">{u || 'Sistem'}</Tag>,
        },
        {
            title: 'İşlem Adı',
            dataIndex: 'transactionName',
            key: 'transactionName',
            render: (name) => <Text strong>{name}</Text>,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => (
                <Space direction="vertical" size={4}>
                    <Text>{text || '-'}</Text>

                    {record.receiptPath && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<FileSearchOutlined />}
                            onClick={() => viewReceipt(record.receiptPath)}
                            style={{
                                fontSize: '11px',
                                height: '24px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 8px',
                                backgroundColor: '#1677ff',
                                width: 'fit-content',
                            }}
                        >
                            Belgeyi Görüntüle
                        </Button>
                    )}
                </Space>
            ),
        },
        {
            title: 'Kişi Sayısı',
            dataIndex: 'splitCount',
            key: 'splitCount',
            align: 'center',
            render: (count) => <Tag color="purple">{Number(count)} Personel</Tag>,
        },
        {
            title: 'Toplam Tutar',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right',
            render: (amount) => (
                <Text strong style={{ color: '#cf1322' }}>
                    {Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
            ),
        },
        {
            title: 'Kişi Başı',
            key: 'perPerson',
            align: 'right',
            render: (_, record) => {
                const total = Number(record.totalAmount) || 0;
                const count = Number(record.splitCount) || 1;
                const perPerson = total / count;

                return (
                    <Text strong style={{ color: '#d46b08' }}>
                        {perPerson.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                );
            },
        },
    ];

    return (
        <div
            style={{
                padding: 24,
                background: isDarkMode ? '#141414' : '#f0f2f5',
                minHeight: '100vh',
                transition: 'all 0.3s',
            }}
        >
            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                    background: isDarkMode ? '#1f1f1f' : '#ffffff',
                }}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size="large">
                            <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)} />
                            <Title level={3} style={{ margin: 0, color: isDarkMode ? '#fff' : 'inherit' }}>
                                <ShoppingCartOutlined /> Toplu Alışveriş Kayıtları
                            </Title>
                        </Space>
                        <Tooltip title="Bu liste, sadece 2 ve üzeri kişi arasında bölüştürülen harcamaları gösterir.">
                            <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        </Tooltip>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={transactions}
                        loading={loading}
                        rowKey="id"
                        bordered
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 800 }}
                        style={{ background: isDarkMode ? '#1f1f1f' : '#fff' }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default BulkTransactions;
