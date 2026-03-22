import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401 || status === 403) {
            if (!window.location.pathname.includes('/login')) {

                console.warn(`${status} Hatası Yakalandı! Oturum sonlandırılıyor...`);

                window.dispatchEvent(new Event('auth-error'));

                return new Promise(() => {});
            }
        }
        return Promise.reject(error);
    }
);

export default api;