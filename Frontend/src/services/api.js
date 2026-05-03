import axios from 'axios';

let injectedStore;
export const injectStore = (_store) => {
    injectedStore = _store;
};

// Dev default: localhost. Set VITE_API_URL in .env for staging/production.
// Never hardcode a production URL here — it causes dev traffic to hit prod.
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,  // Send httpOnly cookie if available
});

// Request interceptor: attach bearer token as fallback for cross-domain scenarios
api.interceptors.request.use((config) => {
    // Try Redux token first (in-memory), then fall back to sessionStorage
    const reduxToken = injectedStore ? injectedStore.getState().auth.token : null;
    const token = reduxToken || sessionStorage.getItem('auth_token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const errorCode = error.response?.data?.errorCode;
            const sessionExpired =
                errorCode === 'TOKEN_EXPIRED' ||
                errorCode === 'INVALID_TOKEN' ||
                errorCode === 'NO_TOKEN';

            if (sessionExpired && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


export const extractErrorMessage = (
    err,
    fallback = 'An unexpected error occurred. Please try again.'
) => {
    if (err.code === 'ERR_NETWORK' || !err.response) {
        return 'Unable to reach the server. Please check your connection and try again.';
    }
    return err.response?.data?.error || err.response?.data?.message || fallback;
};

export default api;
