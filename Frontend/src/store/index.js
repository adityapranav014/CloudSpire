import { configureStore } from '@reduxjs/toolkit';
import authReducer            from './slices/authSlice';
import filterReducer          from './slices/filterSlice';
import alertsReducer          from './slices/alertsSlice';
import metricsReducer         from './slices/metricsSlice';
import dashboardReducer       from './slices/dashboardSlice';
import costsReducer           from './slices/costsSlice';
import recommendationsReducer from './slices/recommendationsSlice';
import { injectStore } from '../services/api';

export const store = configureStore({
    reducer: {
        auth:            authReducer,
        filters:         filterReducer,
        alerts:          alertsReducer,
        metrics:         metricsReducer,
        dashboard:       dashboardReducer,
        costs:           costsReducer,
        recommendations: recommendationsReducer,
    },
});

injectStore(store);
