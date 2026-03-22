import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

const { Content } = Layout;

const MainLayout = ({ children, isDarkMode, setIsDarkMode }) => {

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [collapsed, setCollapsed] = useState(window.innerWidth < 1200);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);

            if (width < 992) {
                setCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const dynamicMarginLeft = isMobile ? 0 : (collapsed ? 80 : 260);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isDarkMode={isDarkMode}
            />
            <Layout style={{
                marginLeft: dynamicMarginLeft,
                transition: 'margin-left 0.2s ease-in-out',
                background: isDarkMode ? '#000' : '#f5f7fa',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <AppHeader
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                />
                <Content style={{
                    padding: isMobile ? '16px' : '24px',
                    margin: 0,
                    minHeight: 'calc(100vh - 64px)',
                    overflowX: 'hidden',
                    width: '100%'
                }}>
                    <div style={{
                        maxWidth: '100%',
                        margin: '0 auto'
                    }}>
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;