import React, { useEffect, useState } from 'react';
import { Modal, Result, Button } from 'antd';

const SessionTimeoutModal = () => {
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const handleAuthError = () => {
            if (!visible) setVisible(true);
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, [visible]);

    useEffect(() => {
        let timer;
        if (visible && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (visible && countdown === 0) {
            handleRedirect();
        }
        return () => clearInterval(timer);
    }, [visible, countdown]);

    const handleRedirect = () => {
        localStorage.clear();
        sessionStorage.clear();
        setVisible(false);
        // ✅ En kesin yönlendirme yöntemi
        window.location.replace('/login');
    };

    return (
        <Modal
            open={visible}
            footer={null}
            closable={false}
            centered
            width={500}
            maskClosable={false}
        >
            <Result
                status="warning"
                title="Oturum Süreniz Doldu"
                subTitle={
                    <div>
                        <p>Güvenliğiniz için oturumunuz sonlandırıldı.</p>
                        <p><b>{countdown}</b> saniye içinde giriş sayfasına yönlendirileceksiniz.</p>
                    </div>
                }
                extra={
                    <Button type="primary" key="console" onClick={handleRedirect}>
                        Şimdi Giriş Yap
                    </Button>
                }
            />
        </Modal>
    );
};

export default SessionTimeoutModal;