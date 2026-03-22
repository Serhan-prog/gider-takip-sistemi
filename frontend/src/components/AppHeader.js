import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Dropdown, Typography, Avatar } from 'antd';
import {
    MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
    LogoutOutlined, SunOutlined, MoonOutlined, DownOutlined, SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = ({ collapsed, setCollapsed, isDarkMode, setIsDarkMode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 480);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallMobile(window.innerWidth < 480);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const profileMenuItems = [
        {
            key: 'info',
            label: (
                <div style={{ padding: '4px 8px' }}>
                    <Text type="secondary" size="small">Giriş Yapan</Text>
                    <br />
                    <Text strong>{user?.username}</Text>
                </div>
            ),
            disabled: true
        },
        { type: 'divider' },
        { key: 'profile', icon: <SettingOutlined />, label: 'Profil Ayarlarım', onClick: () => navigate('/profil') },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Güvenli Çıkış', danger: true, onClick: logout },
    ];

    return (
        <Header style={{
            padding: '0 16px',
            background: isDarkMode ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: 64,
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`
        }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    fontSize: '18px',
                    width: 45,
                    height: 45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            />

            <Space size={isSmallMobile ? "small" : "middle"}>
                <Button
                    shape="circle"
                    icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{ border: 'none', background: 'transparent' }}
                />

                <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
                    <div style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        maxWidth: isSmallMobile ? '120px' : '200px'
                    }}>
                        <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1890ff', minWidth: '24px' }}
                        />
                        <Text
                            strong
                            style={{
                                display: 'inline-block',
                                maxWidth: isSmallMobile ? '60px' : '120px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {user?.username}
                        </Text>
                        <DownOutlined style={{ fontSize: '10px' }} />
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;