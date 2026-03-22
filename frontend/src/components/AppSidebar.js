import React, { useState, useEffect } from 'react';
import { Layout, Menu, Drawer } from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    BarChartOutlined,
    ShoppingCartOutlined,
    SettingOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ddoLogo from '../pages/Admin/admin_ddo_logo.jpeg';

const { Sider } = Layout;

const AppSidebar = ({ collapsed, setCollapsed, isDarkMode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = user?.role === 'ADMIN' ? [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/admin/users', icon: <TeamOutlined />, label: 'Personel Yönetimi' },
        { key: '/admin/bulk-transactions', icon: <ShoppingCartOutlined />, label: 'Toplu İşlemler' },
        { key: '/admin/raporlar', icon: <BarChartOutlined />, label: 'Raporlar' },
        { key: '/profil', icon: <SettingOutlined />, label: 'Profil Ayarlarım' },
    ] : [
        { key: '/personel/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/personel/bulk-transactions', icon: <HistoryOutlined />, label: 'Toplu İşlemler' },
        { key: '/personel/raporlar', icon: <BarChartOutlined />, label: 'Raporlar' },
        { key: '/profil', icon: <SettingOutlined />, label: 'Profil Ayarlarım' },
    ];


    const sidebarContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: 64, margin: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                    src={ddoLogo}
                    alt="Logo"
                    style={{
                        maxHeight: '40px',
                        width: 'auto',
                        display: (collapsed && !isMobile) ? 'none' : 'block',
                        pointerEvents: 'none'
                    }}
                />
                {(collapsed && !isMobile) && <span style={{ fontWeight: '900', color: '#1890ff', fontSize: '18px' }}>DDO</span>}
            </div>
            <Menu
                theme={isDarkMode ? 'dark' : 'light'}
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={({ key }) => {
                    navigate(key);
                    if (isMobile) setCollapsed(true);
                }}
                style={{ borderRight: 0, flex: 1 }}
            />
        </div>
    );


    if (isMobile) {
        return (
            <Drawer
                placement="left"
                onClose={() => setCollapsed(true)}
                open={!collapsed}
                closable={false}
                width={260}
                styles={{ body: { padding: 0, backgroundColor: isDarkMode ? '#001529' : '#fff' } }}
            >
                {sidebarContent}
            </Drawer>
        );
    }

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            theme={isDarkMode ? 'dark' : 'light'}
            style={{
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 1001,
                borderRight: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)'
            }}
        >
            {sidebarContent}
        </Sider>
    );
};

export default AppSidebar;