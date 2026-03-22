import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, Input, InputNumber, Select, Button,
    Card, Typography, Space, message, Divider, Row, Col, Upload
} from 'antd';
import {
    TeamOutlined,
    FileTextOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    UploadOutlined
} from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TransactionForm = ({ onTransactionSuccess }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    const fetchUsers = useCallback(async () => {
        setFetching(true);
        try {
            const res = await api.get('/users/all');
            setUsers(res.data);
        } catch (err) {
            message.error("Kullanıcı listesi güncellenemedi!");
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDropdownVisibleChange = (open) => {
        if (open) {
            fetchUsers();
        }
    };

    const onFinish = async (values) => {

        if (values.totalAmount === undefined || values.totalAmount === null || values.totalAmount <= 0) {
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('transactionName', values.transactionName);
        formData.append('description', values.description || "");
        formData.append('totalAmount', values.totalAmount);

        values.userIds.forEach(id => {
            formData.append('userIds', id);
        });

        if (fileList.length > 0) {
            formData.append('receipt', fileList[0]);
        }

        try {
            await api.post('/finance/split', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            message.success({
                content: 'Harcama ve fiş başarıyla kaydedildi!',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                duration: 4
            });

            form.resetFields();
            setFileList([]);

            if (onTransactionSuccess) onTransactionSuccess();

        } catch (err) {
            const errorMsg = err.response?.data || "İşlem sırasında bir hata oluştu.";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', margin: '0 auto' }}>
            <Card
                bordered={false}
                style={{
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    padding: window.innerWidth < 576 ? '0px' : '10px'
                }}
            >
                <Title level={3} style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <Space><DollarOutlined style={{ color: '#52c41a' }} /> Yeni Harcama</Space>
                </Title>

                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '24px' }}>
                    Tutar seçilen kişiler arasında eşit paylaştırılır.
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="İşlem Başlığı"
                        name="transactionName"
                        rules={[{ required: true, message: 'Lütfen işlem adını giriniz!' }]}
                    >
                        <Input
                            prefix={<FileTextOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Örn: Yemek, Ofis Malzemesi"
                            size="large"
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Açıklama"
                        name="description"
                    >
                        <TextArea
                            placeholder="Opsiyonel detaylar..."
                            rows={2}
                            showCount
                            maxLength={200}
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Item>

                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Toplam Tutar"
                                name="totalAmount"
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    { required: true, message: 'Lütfen bir tutar giriniz!' },
                                    {
                                        validator: (_, value) => {
                                            if (value > 0) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Tutar 0\'dan büyük olmalıdır!'));
                                        },
                                    }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%', borderRadius: '8px' }}
                                    formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₺\s?|(,*)/g, '')}
                                    size="large"
                                    placeholder="0.00"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Personel Seçimi"
                                name="userIds"
                                rules={[{ required: true, message: 'Personel seçiniz!' }]}
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    showSearch
                                    loading={fetching}
                                    style={{ width: '100%' }}
                                    placeholder="Kişi seçin..."
                                    size="large"
                                    maxTagCount="responsive"
                                    optionFilterProp="label"
                                    onDropdownVisibleChange={handleDropdownVisibleChange}
                                    dropdownStyle={{ borderRadius: '8px' }}
                                >
                                    {users.map(u => (
                                        <Option key={u.id} value={u.id} label={u.username}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{u.username}</span>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {u.currentBalance} ₺
                                                </Text>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Harcama Fişi / Dekont"
                        extra="İsteğe bağlı olarak fiş görseli veya PDF ekleyebilirsiniz."
                    >
                        <Upload
                            beforeUpload={(file) => {
                                setFileList([file]);
                                return false;
                            }}
                            onRemove={() => setFileList([])}
                            fileList={fileList}
                            maxCount={1}
                            accept="image/*,.pdf"
                        >
                            <Button
                                icon={<UploadOutlined />}
                                size="large"
                                style={{ borderRadius: '8px', width: '100%' }}
                            >
                                Dosya Seç
                            </Button>
                        </Upload>
                    </Form.Item>

                    <Divider style={{ margin: '12px 0 24px 0' }} />

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                            icon={<TeamOutlined />}
                            style={{
                                height: '50px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                background: '#1890ff'
                            }}
                        >
                            Harcamayı Kaydet
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default TransactionForm;