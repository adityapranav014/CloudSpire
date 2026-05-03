import axios from 'axios';

/**
 * Central Axios instance for all API calls.
 *
 * withCredentials: true — instructs the browser to send httpOnly cookies
 * on every cross-origin request. This is the only change needed on the
 * frontend for cookie-based auth; the browser handles everything else.
 *
 * There is NO Authorization header injection — the token lives in an
 * httpOnly cookie that JavaScript cannot read. That is the entire point.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
    withCredentials: true,
});

/**
 * Response interceptor — auto-redirect on session expiry.
 *
 * When the server returns 401 TOKEN_EXPIRED or INVALID_TOKEN, the session
 * is gone (cookie cleared server-side by the error handler or it expired
 * naturally). Redirect to /login so the user can re-authenticate.
 *
 * We do NOT dispatch a Redux logout action here because this interceptor
 * is module-level — it has no access to the store. Instead, the redirect
 * causes a full page reload which resets Redux state naturally.
 */
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

/**
 * Extracts a user-friendly error message from an Axios error.
 */
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
