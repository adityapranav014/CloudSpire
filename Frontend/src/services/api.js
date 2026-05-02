import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api/v1',
    withCredentials: true // needed for JWT cookies or headers if used
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cloudspire_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.errorCode;
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        localStorage.removeItem('cloudspire_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from an Axios error.
 */
export const extractErrorMessage = (err, fallback = 'An unexpected error occurred. Please try again.') => {
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  return err.response?.data?.error || err.response?.data?.message || fallback;
};

export default api;
