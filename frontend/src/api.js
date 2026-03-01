import axios from 'axios';

// DETECÇÃO DINÂMICA DO ENDPOINT (Local vs Cloud)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
axios.defaults.baseURL = isLocal ? 'http://localhost:3000' : '';

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default axios;
