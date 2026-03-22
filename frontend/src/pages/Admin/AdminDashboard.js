import React, { useEffect, useState, useCallback } from 'react';
import TransactionForm from '../../components/TransactionForm';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import {
    Button,
    Typography,
    Row,
    Col,
    Card,
    Tooltip,
    Space,
    Table,
    message,
    Modal,
} from 'antd';

import {
    BarChartOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileSearchOutlined,
    WalletOutlined,
    ShoppingCartOutlined,
    HistoryOutlined
} from '@ant-design/icons';

import api from '../../api/axios';

const { Title, Text } = Typography;

const AdminDashboard = ({ isDarkMode }) => {
    const { user } = useAuth();
    const navigate = useNavigate();


    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);


    const [allTransactions, setAllTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    useEffect(() => {
        document.title = "Admin Dashboard";
    }, []);


    const fetchPendingRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const res = await api.get('/finance/pending-requests');
            setPendingRequests(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Talepler yüklenirken hata:', error);
        } finally {
            setLoadingRequests(false);
        }
    }, []);


    const fetchAllTransactions = useCallback(async () => {
        setLoadingTransactions(true);
        try {
            const res = await api.get('/users/reports');
            setAllTransactions(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('İşlemler yüklenirken hata:', error);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingRequests();
        fetchAllTransactions();
    }, [fetchPendingRequests, fetchAllTransactions, refreshTrigger]);

    const onTransactionSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };


    const handleApprove = async (id) => {
        try {
            await api.post(`/finance/approve-request/${id}`);
            message.success('Bakiye talebi onaylandı ve kullanıcıya yüklendi.');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            message.error('Onaylama işlemi başarısız.');
        }
    };


    const handleReject = (id) => {
        Modal.confirm({
            title: 'Talebi Reddet',
            content: 'Bu bakiye talebini reddetmek istediğinize emin misiniz?',
            okText: 'Evet, Reddet',
            okType: 'danger',
            cancelText: 'Vazgeç',
            onOk: async () => {
                try {
                    await api.post(`/finance/reject-request/${id}`);
                    message.warning('Talep reddedildi.');
                    setRefreshTrigger(prev => prev + 1);
                } catch (error) {
                    message.error('İşlem başarısız.');
                }
            },
        });
    };


    const viewReceipt = (filePath) => {
        if (!filePath) {
            message.error("Dekont yolu bulunamadı.");
            return;
        }
        let cleanPath = filePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }
        const baseUrl = "http://localhost:8080/";
        const finalUrl = `${baseUrl}${cleanPath}`;
        window.open(finalUrl, '_blank');
    };


    const requestColumns = [
        {
            title: 'Personel',
            dataIndex: ['user', 'username'],
            key: 'username',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Tutar',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>+{amount?.toLocaleString('tr-TR')}</Text>
        },
        {
            title: 'Tarih',
            dataIndex: 'requestDate',
            key: 'date',
            render: (date, record) => {
                const actualDate = date || record.createdAt || record.requestDate;
                if (!actualDate) return '-';
                if (Array.isArray(actualDate)) {
                    const [year, month, day, hour, minute] = actualDate;
                    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                }
                const d = new Date(actualDate);
                return isNaN(d.getTime()) ? "Tarih Format Hatası" : d.toLocaleString('tr-TR');
            }
        },
        {
            title: 'Dekont',
            key: 'receipt',
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<FileSearchOutlined />}
                    onClick={() => viewReceipt(record.receiptPath)}
                >
                    Görüntüle
                </Button>
            )
        },
        {
            title: 'İşlem',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Onayla">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleApprove(record.id)}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        />
                    </Tooltip>
                    <Tooltip title="Reddet">
                        <Button
                            danger
                            shape="circle"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleReject(record.id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];


    const transactionColumns = [
        {
            title: 'Tarih',
            dataIndex: 'date',
            key: 'date',
            width: 130,
            render: (t) => (t ? new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'),
        },
        {
            title: 'Personel',
            dataIndex: 'username',
            key: 'username',
            width: 120,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'İşlem',
            dataIndex: 'transactionName',
            key: 'transactionName',
            ellipsis: true,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            ellipsis: { showTitle: true },
            render: (text) => <Text type="secondary">{text || '-'}</Text>
        },
        {
            title: 'Tutar',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            width: 110,
            render: (amount, record) => {
                const isGelir = record.type === 'GELİR';
                const absoluteAmount = Math.abs(Number(amount || 0));
                return (
                    <Text strong style={{ color: isGelir ? '#52c41a' : '#f5222d' }}>
                        {isGelir ? '+' : '-'}{absoluteAmount.toLocaleString('tr-TR')}
                    </Text>
                );
            }
        },
        {
            title: 'Belge',
            key: 'receipt',
            align: 'center',
            width: 80,
            render: (_, record) => record.receiptPath ? (
                <Tooltip title="Belgeyi Gör">
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<FileSearchOutlined />}
                        onClick={() => viewReceipt(record.receiptPath)}
                    />
                </Tooltip>
            ) : <Text type="secondary">-</Text>
        }
    ];

    return (
        <>
            <Card
                bordered={false}
                style={{ marginBottom: '24px', borderRadius: '16px', background: isDarkMode ? '#1f1f1f' : '#ffffff' }}
            >
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col xs={24} md={12}>
                        <Title level={window.innerWidth < 576 ? 4 : 2} style={{ margin: 0 }}>
                            Hoş Geldin, {user?.username} 👋
                        </Title>
                        <Text type="secondary">Sistem genelindeki finansal akışı buradan kontrol edebilirsin.</Text>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: window.innerWidth < 768 ? 'left' : 'right' }}>
                        <Space wrap size="small" style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'flex-start' : 'flex-end' }}>
                            <Button
                                icon={<ShoppingCartOutlined />}
                                size="large"
                                onClick={() => navigate('/admin/bulk-transactions')}
                                style={{ borderRadius: '10px', fontWeight: '600', color: '#1890ff', borderColor: '#1890ff' }}
                            >
                                Toplu Alışverişler
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<BarChartOutlined />}
                                onClick={() => navigate('/admin/raporlar')}
                                style={{ borderRadius: '10px', fontWeight: 'bold' }}
                            >
                                Raporları İncele
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {pendingRequests.length > 0 && (
                <Card
                    title={<Space><WalletOutlined style={{ color: '#1890ff' }} /><span>Bekleyen Bakiye Talepleri</span></Space>}
                    bordered={false}
                    style={{ marginBottom: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                    <Table
                        dataSource={pendingRequests}
                        columns={requestColumns}
                        rowKey="id"
                        loading={loadingRequests}
                        pagination={false}
                        size="middle"
                        scroll={{ x: true }}
                    />
                </Card>
            )}

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12} xl={10}>
                    <TransactionForm onTransactionSuccess={onTransactionSuccess} />
                </Col>

                <Col xs={24} lg={12} xl={14}>
                    <Card
                        title={
                            <Space>
                                <HistoryOutlined style={{ color: '#1890ff' }} />
                                <span style={{ color: isDarkMode ? '#fff' : '#000' }}>Sistemdeki Son Hareketler</span>
                            </Space>
                        }
                        bordered={false}
                        style={{
                            borderRadius: '16px',
                            boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
                            background: isDarkMode ? '#141414' : '#ffffff',
                            border: isDarkMode ? '1px solid #303030' : '1px solid #f0f0f0'
                        }}
                    >
                        <Table
                            dataSource={allTransactions.slice(0, 5)}
                            columns={transactionColumns}
                            rowKey={(record, idx) => record.id || idx}
                            loading={loadingTransactions}
                            pagination={false}
                            size="middle"
                            scroll={{ x: true }}
                        />
                        <Button
                            type="default"
                            style={{ marginTop: '16px', width: '100%', borderRadius: '8px', height: '40px', fontWeight: '500' }}
                            onClick={() => navigate('/admin/raporlar')}
                        >
                            Tüm Raporları Gör
                        </Button>
                    </Card>
                </Col>
            </Row>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        .ant-card { transition: all 0.3s ease; }
                        .ant-table { background: transparent !important; }
                    `,
                }}
            />
        </>
    );
};

export default AdminDashboard;