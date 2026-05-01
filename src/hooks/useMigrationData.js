import useSWR from 'swr';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api/v1',
});

const fetcher = (url) => api.get(url).then(res => res.data);

export const useMigrationData = (endpoint) => {
    const { data, error, isLoading } = useSWR(endpoint, fetcher);

    return {
        data,
        isLoading,
        isError: error
    };
};