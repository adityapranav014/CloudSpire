import useSWR from 'swr';
import api from '../services/api';

const fetcher = (url) => api.get(url).then(res => res.data);

export const useMigrationData = (endpoint) => {
    const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher, {
        // Retry up to 3 times with exponential backoff before giving up
        errorRetryCount: 3,
        errorRetryInterval: 2000,
        // Deduplicate requests within 2 seconds
        dedupingInterval: 2000,
        // Don't throw on error — let components handle gracefully
        shouldRetryOnError: true,
        onError: (err) => {
            // Network errors (backend is down) — log but don't crash
            if (err.code === 'ERR_NETWORK') {
                console.warn(`[useMigrationData] Backend unreachable for ${endpoint}`);
            }
        }
    });

    return {
        data,
        isLoading,
        isError: error,
        // Expose a human-readable error message for UI display
        errorMessage: error
            ? (error.response?.data?.error || error.message || 'Failed to load data')
            : null,
        mutate
    };
};