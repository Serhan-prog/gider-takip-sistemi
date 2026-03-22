import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table,
    Input,
    DatePicker,
    Button,
    Tag,
    Space,
    Card,
    Typography,
    message,
    Row,
    Col,
    Select,
    Divider,
    Statistic,
    Tooltip,
    Empty,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    ArrowLeftOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    ClearOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    SwapOutlined,
    InfoCircleOutlined,
    FileSearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Rapor = ({ isDarkMode }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);

    const [tableKey, setTableKey] = useState(Date.now());
    const navigate = useNavigate();

    const SP3 = 24;
    const SP4 = 32;

    const pageBg = isDarkMode ? '#0f0f10' : '#f5f7fa';
    const cardBg = isDarkMode ? '#141414' : '#ffffff';
    const subtleBorder = isDarkMode ? '1px solid #262626' : '1px solid #f0f0f0';


    const handleGoBack = () => {
        if (user?.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/personel/dashboard');
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/reports');
            const data = Array.isArray(res.data) ? res.data : [];
            setHistory(data);
            setFilteredHistory(data);
        } catch (err) {
            console.error('Veri çekme hatası:', err);
            message.error('Finansal veriler yüklenemedi!');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    useEffect(() => {
        document.title = "Finansal Raporlar";
    }, []);

    useEffect(() => {
        let tempHistory = [...history];

        if (searchText) {
            const lowText = searchText.toLowerCase();
            tempHistory = tempHistory.filter(
                (item) =>
                    (item.username || '').toLowerCase().includes(lowText) ||
                    (item.targetUsername || '').toLowerCase().includes(lowText) ||
                    (item.transactionName || '').toLowerCase().includes(lowText) ||
                    (item.description || '').toLowerCase().includes(lowText)
            );
        }

        if (typeFilter) {
            tempHistory = tempHistory.filter((item) => item.type === typeFilter);
        }

        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            tempHistory = tempHistory.filter((item) => {
                const d = dayjs(item.date);
                return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
            });
        }

        setFilteredHistory(tempHistory);
    }, [searchText, dateRange, typeFilter, history]);

    const resetAllFilters = () => {
        setSearchText('');
        setDateRange(null);
        setTypeFilter(null);
        setTableKey(Date.now());
        message.success('Tüm filtreler sıfırlandı.');
    };

    const fixTr = (text) => {
        if (!text) return '';
        return text
            .toString()
            .replace(/Ğ/g, 'G')
            .replace(/ğ/g, 'g')
            .replace(/Ü/g, 'U')
            .replace(/ü/g, 'u')
            .replace(/Ş/g, 'S')
            .replace(/ş/g, 's')
            .replace(/İ/g, 'I')
            .replace(/ı/g, 'i')
            .replace(/Ö/g, 'O')
            .replace(/ö/g, 'o')
            .replace(/Ç/g, 'C')
            .replace(/ç/g, 'c');
    };

    const exportToExcel = () => {
        if (filteredHistory.length === 0) return message.warning('Veri yok!');
        const dataToExport = filteredHistory.map((item) => ({
            Tarih: dayjs(item.date).format('DD.MM.YYYY HH:mm'),
            'İşlemi Yapan': item.username || 'Sistem',
            'Personel (Hedef)': item.targetUsername || '-',
            'İşlem Adı': item.transactionName,
            Açıklama: item.description || '-',
            Tür: item.type,
            'Tutar (₺)': item.amount,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
        XLSX.writeFile(workbook, `Finans_Raporu_${dayjs().format('DD_MM_YYYY')}.xlsx`);
    };

    const exportToPDF = () => {
        if (filteredHistory.length === 0) return message.warning('Veri yok!');
        const doc = new jsPDF('landscape');
        const tableRows = filteredHistory.map((item) => [
            dayjs(item.date).format('DD.MM.YYYY HH:mm'),
            fixTr(item.username || 'Sistem'),
            fixTr(item.targetUsername || '-'),
            fixTr(item.transactionName),
            fixTr(item.description || '-'),
            fixTr(item.type),
            `${Number(item.amount || 0).toLocaleString('tr-TR')} TL`,
        ]);
        autoTable(doc, {
            head: [['Tarih', 'Yapan', 'Personel', 'Islem Adi', 'Aciklama', 'Tur', 'Tutar']],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 },
        });
        doc.save(`Finans_Raporu_${dayjs().format('DD_MM_YYYY')}.pdf`);
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

    const kpis = useMemo(() => {
        const gelir = filteredHistory
            .filter((x) => x.type === 'GELİR')
            .reduce((sum, x) => sum + Math.abs(Number(x.amount) || 0), 0);

        const gider = filteredHistory
            .filter((x) => x.type === 'GİDER')
            .reduce((sum, x) => sum + Math.abs(Number(x.amount) || 0), 0);

        const net = gelir - gider;

        return {
            gelir,
            gider,
            net,
            count: filteredHistory.length,
        };
    }, [filteredHistory]);


    const getColumnSearchProps = (dataIndex, title) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`${title} ara...`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
                        Ara
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Sıfırla
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) =>
            record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : false,
    });

    const columns = [
        {
            title: 'Tarih',
            dataIndex: 'date',
            key: 'date',
            width: 170,
            render: (t) => (t ? dayjs(t).format('DD.MM.YYYY HH:mm') : '-'),
            sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
            defaultSortOrder: 'descend',
        },
        {
            title: 'İşlemi Yapan',
            dataIndex: 'username',
            key: 'username',
            ...getColumnSearchProps('username', 'İşlemi Yapan'),
            render: (text) => <Text strong style={{ color: '#1890ff' }}>{text || 'Sistem'}</Text>,
        },
        {
            title: 'İşlem Adı',
            dataIndex: 'transactionName',
            key: 'transactionName',
            ...getColumnSearchProps('transactionName', 'İşlem'),
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            render: (text, record) => (
                <Space direction="vertical" size={4}>
                    <Text>{text || '-'}</Text>
                    {/* Personel ve Dekont Butonu Yan Yana - Daha Belirgin Yapı */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {record.targetUsername && (
                            <Tag color="geekblue" style={{ border: 'none', fontWeight: 700, margin: 0 }}>
                                Personel: {record.targetUsername}
                            </Tag>
                        )}
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
                                    backgroundColor: '#1677ff'
                                }}
                            >
                                Belgeyi Görüntüle
                            </Button>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Tür',
            dataIndex: 'type',
            key: 'type',
            align: 'center',
            width: 110,
            filters: [
                { text: 'GELİR', value: 'GELİR' },
                { text: 'GİDER', value: 'GİDER' },
            ],
            onFilter: (value, record) => record.type === value,
            render: (type) => (
                <Tag color={type === 'GELİR' ? 'green' : 'red'} style={{ width: 70, textAlign: 'center' }}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Tutar',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            width: 150,
            sorter: (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0),
            render: (amount, record) => (
                <Text strong style={{ color: record.type === 'GELİR' ? '#52c41a' : '#f5222d' }}>
                    {record.type === 'GELİR'
                        ? `+${Number(amount || 0).toLocaleString('tr-TR')}`
                        : `-${Math.abs(Number(amount || 0)).toLocaleString('tr-TR')}`}{' '}
                    ₺
                </Text>
            ),
        },
    ];

    return (
        <div
            style={{
                padding: window.innerWidth < 576 ? 16 : SP3,
                minHeight: '100vh',
                background: pageBg,
                transition: 'all 0.3s',
            }}
        >
            <Card
                bordered={false}
                style={{
                    borderRadius: 16,
                    background: cardBg,
                    border: subtleBorder,
                    boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.35)' : '0 10px 25px rgba(0,0,0,0.08)',
                }}
                bodyStyle={{ padding: window.innerWidth < 576 ? 16 : SP3 }}
            >
                {/* Header */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: SP3 }}>
                    <Col xs={24} md={12}>
                        <Space size="middle">
                            <Tooltip title="Geri Dön">
                                <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={handleGoBack} />
                            </Tooltip>

                            <Space size={8} align="center">
                                <Title level={3} style={{ margin: 0 }}>
                                    Finansal Raporlar
                                </Title>
                                <Tooltip title="Filtreler KPI kartlarını ve tabloyu etkiler. Export işlemi filtrelenmiş veriyi dışa aktarır.">
                                    <InfoCircleOutlined style={{ opacity: isDarkMode ? 0.75 : 0.6 }} />
                                </Tooltip>
                            </Space>
                        </Space>
                    </Col>

                    <Col xs={24} md={12} style={{ textAlign: window.innerWidth < 768 ? 'left' : 'right' }}>
                        <Space wrap>
                            <Tooltip title="Excel olarak dışa aktar">
                                <Button
                                    icon={<FileExcelOutlined />}
                                    onClick={exportToExcel}
                                    disabled={filteredHistory.length === 0}
                                    style={{
                                        backgroundColor: '#1d6f42',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 10,
                                        height: 40,
                                    }}
                                >
                                    Excel
                                </Button>
                            </Tooltip>

                            <Tooltip title="PDF olarak dışa aktar">
                                <Button
                                    danger
                                    icon={<FilePdfOutlined />}
                                    onClick={exportToPDF}
                                    disabled={filteredHistory.length === 0}
                                    style={{ borderRadius: 10, height: 40 }}
                                >
                                    PDF
                                </Button>
                            </Tooltip>

                            <Tooltip title="Veriyi yenile">
                                <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: 10, height: 40 }}>
                                    Yenile
                                </Button>
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>

                {/* KPI Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: SP4 }}>
                    <Col xs={24} md={6}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: isDarkMode ? 'rgba(24,144,255,0.12)' : 'rgba(24,144,255,0.08)',
                                border: isDarkMode ? '1px solid rgba(24,144,255,0.18)' : '1px solid rgba(24,144,255,0.12)',
                            }}
                            bodyStyle={{ padding: SP3 }}
                        >
                            <Statistic title={<Text type="secondary">Toplam Kayıt</Text>} value={kpis.count} prefix={<SwapOutlined />} />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: isDarkMode ? 'rgba(82,196,26,0.12)' : 'rgba(82,196,26,0.08)',
                                border: isDarkMode ? '1px solid rgba(82,196,26,0.18)' : '1px solid rgba(82,196,26,0.12)',
                            }}
                            bodyStyle={{ padding: SP3 }}
                        >
                            <Statistic
                                title={<Text type="secondary">Toplam Gelir</Text>}
                                value={kpis.gelir}
                                precision={2}
                                prefix={<ArrowUpOutlined />}
                                suffix="₺"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: isDarkMode ? 'rgba(245,34,45,0.12)' : 'rgba(245,34,45,0.08)',
                                border: isDarkMode ? '1px solid rgba(245,34,45,0.18)' : '1px solid rgba(245,34,45,0.12)',
                            }}
                            bodyStyle={{ padding: SP3 }}
                        >
                            <Statistic
                                title={<Text type="secondary">Toplam Gider</Text>}
                                value={kpis.gider}
                                precision={2}
                                prefix={<ArrowDownOutlined />}
                                suffix="₺"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: isDarkMode ? 'rgba(250,173,20,0.12)' : 'rgba(250,173,20,0.08)',
                                border: isDarkMode ? '1px solid rgba(250,173,20,0.18)' : '1px solid rgba(250,173,20,0.12)',
                            }}
                            bodyStyle={{ padding: SP3 }}
                        >
                            <Statistic
                                title={<Text type="secondary">Net</Text>}
                                value={kpis.net}
                                precision={2}
                                suffix="₺"
                                valueStyle={{ color: kpis.net >= 0 ? '#52c41a' : '#f5222d' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Divider style={{ margin: `${SP3}px 0` }} />

                {/* Filters */}
                <Row gutter={[16, 16]} style={{ marginBottom: SP3 }}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Text type="secondary">Hızlı Arama</Text>
                        <Input
                            placeholder="Personel, işlem veya açıklama..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '100%', marginTop: 8, borderRadius: 10, height: 40 }}
                            allowClear
                        />
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={8}>
                        <Text type="secondary">Tarih Aralığı</Text>
                        <RangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            style={{ width: '100%', marginTop: 8, borderRadius: 10, height: 40 }}
                            placeholder={['Başlangıç', 'Bitiş']}
                        />
                    </Col>

                    <Col xs={12} sm={12} md={4} lg={4}>
                        <Text type="secondary">İşlem Türü</Text>
                        <Select
                            placeholder="Tür Seç"
                            style={{ width: '100%', marginTop: 8 }}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            allowClear
                            dropdownStyle={{ borderRadius: 12 }}
                        >
                            <Option value="GELİR">Sadece Gelirler</Option>
                            <Option value="GİDER">Sadece Giderler</Option>
                        </Select>
                    </Col>

                    <Col xs={12} sm={12} md={4} lg={4}>
                        <Text type="secondary" style={{ visibility: 'hidden' }}>
                            Aksiyon
                        </Text>
                        <Button
                            block
                            danger
                            ghost
                            icon={<ClearOutlined />}
                            onClick={resetAllFilters}
                            style={{ marginTop: 8, borderRadius: 10, height: 40 }}
                        >
                            Temizle
                        </Button>
                    </Col>
                </Row>

                {/* Table */}
                <Table
                    key={tableKey}
                    columns={columns}
                    dataSource={filteredHistory}
                    rowKey={(record, index) => record.id || record.date + index}
                    loading={loading}
                    locale={{
                        emptyText: (
                            <Empty
                                description={
                                    <span style={{ opacity: 0.8 }}>
                                        Kayıt bulunamadı. Filtreleri temizleyip tekrar deneyebilirsin.
                                    </span>
                                }
                            />
                        ),
                    }}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${total} kayıttan ${range[0]}-${range[1]} arası gösteriliyor`,
                        position: ['bottomCenter'],
                        locale: { items_per_page: '/ sayfa' },
                    }}
                    scroll={{ x: 1000 }}
                    bordered
                    sticky
                    rowClassName={(_, index) => (index % 2 === 0 ? 'zebra-row' : '')}
                    size="middle"
                />

                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                            .ant-table-thead > tr > th {
                                background: ${isDarkMode ? '#1a1a1a' : '#fafafa'} !important;
                            }
                            .zebra-row td {
                                background: ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'} !important;
                            }
                            .ant-table-tbody > tr:hover > td {
                                background: ${isDarkMode ? 'rgba(24,144,255,0.10)' : 'rgba(24,144,255,0.06)'} !important;
                            }
                        `,
                    }}
                />
            </Card>
        </div>
    );
};

export default Rapor;