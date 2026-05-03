import axios from 'axios';
import { store } from '../store/index.js';

const DEFAULT_API_URL = 'https://cloudspire.onrender.com/api/v1';
const apiBaseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,  // Send httpOnly cookie if available
});

// Request interceptor: attach bearer token as fallback for cross-domain scenarios
api.interceptors.request.use((config) => {
    const token = store.getState().auth.token;
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
