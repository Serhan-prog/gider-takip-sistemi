import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, Empty, Card } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

const TransactionHistory = () => {
    const [history, setHistory] = useState([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        if (!user?.userId) return;
        setLoading(true);
        try {
            const res = await api.get(`/finance/user-history/${user.userId}`);
            setHistory(res.data);
        } catch (err) {
            console.error("Geçmiş yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    }, [user?.userId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const columns = [
        {
            title: 'Tarih',
            dataIndex: ['transaction', 'createdAt'],
            key: 'date',
            render: (date) => (
                <Space>
                    <ClockCircleOutlined style={{ color: '#bfbfbf' }} />
                    {dayjs(date).format('DD.MM.YYYY HH:mm')}
                </Space>
            ),
            sorter: (a, b) => dayjs(a.transaction.createdAt).unix() - dayjs(b.transaction.createdAt).unix(),
        },
        {
            title: 'İşlem Adı',
            dataIndex: ['transaction', 'transactionName'],
            key: 'transactionName',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Açıklama',
            dataIndex: ['transaction', 'description'],
            key: 'description',
            render: (text) => text ? <Text type="secondary">{text}</Text> : <Text italic type="secondary">Açıklama yok</Text>,
        },
        {
            title: 'Ödenen Tutar',
            dataIndex: 'amountPaid',
            key: 'amountPaid',
            align: 'right',
            render: (amount) => (
                <Text strong style={{ color: '#cf1322', fontSize: '15px' }}>
                    - {amount.toLocaleString('tr-TR')} ₺
                </Text>
            ),
            sorter: (a, b) => a.amountPaid - b.amountPaid,
        },
    ];

    return (
        <Card
            title={<span><InfoCircleOutlined /> Son İşlemler</span>}
            bordered={false}
            bodyStyle={{ padding: 0 }}
        >
            <Table
                columns={columns}
                dataSource={history}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: <Empty description="Henüz bir harcama kaydınız bulunmuyor." /> }}
            />
        </Card>
    );
};

import { Space } from 'antd';

export default TransactionHistory;