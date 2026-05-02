import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * dashboardSlice — caches the /api/v1/dashboard/summary response.
 *
 * Why Redux (not SWR)?
 *   - Dashboard summary is read by multiple components (KPI cards, header stats bar, etc.)
 *   - Socket events update sub-slices (alerts, metrics) independently;
 *     the summary needs to be re-fetchable without re-mounting components.
 *   - Consistent pattern with the rest of the data layer.
 */

export const fetchDashboardSummary = createAsyncThunk(
    'dashboard/fetchSummary',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/dashboard/summary');
            return res.data.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.error || err.message || 'Failed to load dashboard'
            );
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        summary: null,
        loading: false,
        error: null,
        lastFetchedAt: null,
    },
    reducers: {
        clearDashboard: (state) => {
            state.summary = null;
            state.error = null;
            state.lastFetchedAt = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload;
                state.lastFetchedAt = new Date().toISOString();
            })
            .addCase(fetchDashboardSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearDashboard } = dashboardSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectDashboardSummary    = (state) => state.dashboard.summary;
export const selectDashboardLoading    = (state) => state.dashboard.loading;
export const selectDashboardError      = (state) => state.dashboard.error;
export const selectDashboardLastFetch  = (state) => state.dashboard.lastFetchedAt;

export default dashboardSlice.reducer;
