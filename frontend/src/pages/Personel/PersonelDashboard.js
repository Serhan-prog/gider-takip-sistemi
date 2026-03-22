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
    Statistic,
    Modal,
    Form,
    InputNumber,
    Upload,
} from 'antd';

import {
    BarChartOutlined,
    FileSearchOutlined,
    WalletOutlined,
    ShoppingCartOutlined,
    HistoryOutlined,
    PlusCircleOutlined,
    UploadOutlined,
} from '@ant-design/icons';

import api from '../../api/axios';

const { Title, Text } = Typography;

const PersonelDashboard = ({ isDarkMode }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // ✅ State Yönetimi
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [allTransactions, setAllTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userBalance, setUserBalance] = useState(0);

    // ✅ Bakiye Talep Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        document.title = "Personel Dashboard";
    }, []);

    // ✅ Veri Çekme
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [historyRes, balanceRes] = await Promise.all([
                api.get('/users/reports'),
                api.get(`/users/${user?.userId}/balance`)
            ]);

            const data = Array.isArray(historyRes.data) ? historyRes.data : [];

            const myTransactions = data.filter(item =>
                item.username === user?.username || item.targetUsername === user?.username
            );

            setAllTransactions(myTransactions);
            setUserBalance(balanceRes.data || 0);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
            message.error("Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    }, [user?.userId, user?.username]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const onTransactionSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };


    const handleDepositSubmit = async (values) => {

        if (values.amount <= 0) {
            return message.error("Talep edilen tutar 0'dan büyük olmalıdır!");
        }


        if (fileList.length === 0) {
            return message.warning("Lütfen bir dekont dosyası yükleyin!");
        }

        const formData = new FormData();
        formData.append('amount', values.amount);
        formData.append('file', fileList[0]);

        setSubmitLoading(true);
        try {
            await api.post('/finance/request-balance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success('Bakiye talebiniz admin onayına gönderildi.');
            setIsModalOpen(false);
            form.resetFields();
            setFileList([]);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            message.error('Talep gönderilirken bir hata oluştu.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const viewReceipt = (filePath) => {
        if (!filePath) {
            message.error("Bu işleme ait dekont bulunamadı.");
            return;
        }
        const cleanPath = filePath.replace(/\\/g, '/');
        const baseUrl = "http://localhost:8080/";
        const finalUrl = cleanPath.startsWith('uploads') ? `${baseUrl}${cleanPath}` : `${baseUrl}uploads/receipts/${cleanPath}`;
        window.open(finalUrl, '_blank');
    };

    // ✅ Kolon Ayarları
    const columns = [
        {
            title: 'Tarih',
            dataIndex: 'date',
            key: 'date',
            width: 130,
            render: (t) => (t ? new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'),
        },
        {
            title: 'İşlem Adı',
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
            width: 100,
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
            width: 70,
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
        <div style={{ padding: '0px' }}>
            <Card
                bordered={false}
                style={{
                    marginBottom: '24px',
                    borderRadius: '16px',
                    background: isDarkMode ? '#141414' : '#ffffff',
                    boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                    border: isDarkMode ? '1px solid #303030' : '1px solid #f0f0f0'
                }}
            >
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col xs={24} md={10}>
                        <Title level={window.innerWidth < 576 ? 4 : 2} style={{ margin: 0 }}>
                            Hoş Geldin, {user?.username} 👋
                        </Title>
                        <Text type="secondary">Kendi bakiye ve işlem geçmişini buradan yönetebilirsin.</Text>
                    </Col>
                    <Col xs={24} md={14} style={{ textAlign: window.innerWidth < 768 ? 'left' : 'right' }}>
                        <Space wrap size="middle" style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'flex-start' : 'flex-end' }}>

                            <Card
                                size="small"
                                bordered={false}
                                style={{
                                    borderRadius: '10px',
                                    background: isDarkMode ? '#111a2c' : '#e6f7ff',
                                    border: isDarkMode ? '1px solid #153450' : '1px solid #91d5ff',
                                    minWidth: '220px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 12px',
                                    boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(24, 144, 255, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Space size={8}>
                                        {/* Canlı mavi ikon */}
                                        <WalletOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                                        <Text
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: isDarkMode ? '#8ab4f8' : '#0050b3',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.3px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Güncel Bakiyem
                                        </Text>
                                    </Space>

                                    <Text
                                        strong
                                        style={{
                                            fontSize: '18px',
                                            color: isDarkMode ? '#fff' : '#002766',
                                            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', // Rakamlar daha net durur
                                            marginLeft: '12px'
                                        }}
                                    >
                                        {userBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        <span style={{ fontSize: '14px', marginLeft: '4px', fontWeight: 'normal' }}>₺</span>
                                    </Text>
                                </div>
                            </Card>

                            <Button
                                type="primary"
                                icon={<PlusCircleOutlined />}
                                size="large"
                                onClick={() => setIsModalOpen(true)}
                                style={{ borderRadius: '10px', fontWeight: 'bold', background: '#1890ff', borderColor: '#1890ff' }}
                            >
                                Bakiye Talep Et
                            </Button>

                            <Button
                                icon={<ShoppingCartOutlined />}
                                size="large"
                                onClick={() => navigate('/personel/bulk-transactions')}
                                style={{ borderRadius: '10px', fontWeight: '600' }}
                            >
                                Toplu Harcamalar
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[24, 24]}>
                <Col xs={24} xl={10}>
                    <TransactionForm onTransactionSuccess={onTransactionSuccess} />
                </Col>

                <Col xs={24} xl={14}>
                    <Card
                        title={
                            <Space>
                                <HistoryOutlined style={{ color: '#1890ff' }} />
                                <span style={{ color: isDarkMode ? '#fff' : '#000' }}>Son Hareketlerin</span>
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
                            columns={columns}
                            rowKey={(record, idx) => record.id || idx}
                            loading={loading}
                            pagination={false}
                            size="middle"
                            scroll={{ x: true }}
                            rowClassName={(_, index) => (isDarkMode && index % 2 === 0 ? 'zebra-row' : '')}
                        />
                        <Button
                            type="default"
                            style={{ marginTop: '16px', width: '100%', borderRadius: '8px', height: '40px', fontWeight: '500' }}
                            onClick={() => navigate('/personel/raporlar')}
                        >
                            Tümünü Gör
                        </Button>
                    </Card>
                </Col>
            </Row>


            <Modal
                title="Bakiye Talep Formu"
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); setFileList([]); }}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleDepositSubmit}
                    initialValues={{ amount: 0 }}
                >
                    <Form.Item
                        name="amount"
                        label="Talep Edilen Tutar"
                        rules={[
                            { required: true, message: 'Lütfen tutar giriniz!' },
                            { type: 'number', min: 0.01, message: 'Tutar 0 dan büyük olmalıdır!' }
                        ]}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="Örn: 1500"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item label="Dekont / Belge Yükle" required>
                        <Upload
                            accept=".pdf,.png,.jpg,.jpeg"
                            beforeUpload={(file) => {
                                const isAllowed = file.type === 'application/pdf' ||
                                    file.type === 'image/png' ||
                                    file.type === 'image/jpeg';

                                if (!isAllowed) {
                                    message.error('Sadece PNG, JPG veya PDF dosyası yükleyebilirsiniz!');
                                    return Upload.LIST_IGNORE;
                                }

                                setFileList([file]);
                                return false;
                            }}
                            onRemove={() => setFileList([])}
                            fileList={fileList}
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Belge Seç</Button>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            * Talebinizin işleme alınması için dekont yüklemeniz zorunludur.
                        </Text>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setIsModalOpen(false); form.resetFields(); setFileList([]); }}>
                                İptal
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitLoading}
                                style={{ background: '#1890ff', borderColor: '#1890ff', borderRadius: '8px', fontWeight: '500' }}
                            >
                                Talebi Gönder
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        .ant-card { transition: all 0.3s ease; }
                        .ant-table { background: transparent !important; }
                        .ant-btn-primary { box-shadow: 0 4px 10px rgba(24, 144, 255, 0.3); }
                        .zebra-row td { background: rgba(255, 255, 255, 0.02) !important; }
                        .ant-table-thead > tr > th { 
                            background: ${isDarkMode ? '#1a1a1a' : '#fafafa'} !important; 
                            color: ${isDarkMode ? '#aaa' : 'rgba(0,0,0,0.85)'} !important;
                        }
                    `,
                }}
            />
        </div>
    );
};

export default PersonelDashboard;