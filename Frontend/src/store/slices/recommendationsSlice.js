import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRecommendations = createAsyncThunk(
    'recommendations/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/optimizations');
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || err.message || 'Failed to load recommendations');
        }
    }
);

export const updateRecommendationStatus = createAsyncThunk(
    'recommendations/updateStatus',
    async ({ id, targetStatus }, { rejectWithValue }) => {
        try {
            const res = await api.put(`/optimizations/${id}`, { targetStatus });
            return res.data.data.schedule;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || err.message || 'Failed to update recommendation');
        }
    }
);

const recommendationsSlice = createSlice({
    name: 'recommendations',
    initialState: {
        // Grouped by type — matches the backend response shape from optimizationsController
        optimizationSummary: null,
        rightsizingRecommendations: [],
        reservedInstanceOpportunities: [],
        scheduledShutdowns: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearRecommendations: (state) => {
            state.optimizationSummary = null;
            state.rightsizingRecommendations = [];
            state.reservedInstanceOpportunities = [];
            state.scheduledShutdowns = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecommendations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload || {};
                state.optimizationSummary         = data.optimizationSummary ?? null;
                state.rightsizingRecommendations   = data.rightsizingRecommendations ?? [];
                state.reservedInstanceOpportunities = data.reservedInstanceOpportunities ?? [];
                state.scheduledShutdowns            = data.scheduledShutdowns ?? [];
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // After a status update, splice the updated recommendation in place
            .addCase(updateRecommendationStatus.fulfilled, (state, action) => {
                const updated = action.payload;
                if (!updated?._id) return;
                ['rightsizingRecommendations', 'reservedInstanceOpportunities', 'scheduledShutdowns'].forEach((key) => {
                    const idx = state[key].findIndex((r) => r._id === updated._id);
                    if (idx !== -1) state[key][idx] = { ...state[key][idx], ...updated };
                });
            });
    },
});

export const { clearRecommendations } = recommendationsSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectOptimizationSummary          = (state) => state.recommendations.optimizationSummary;
export const selectRightsizingRecommendations   = (state) => state.recommendations.rightsizingRecommendations;
export const selectReservedInstanceOpportunities = (state) => state.recommendations.reservedInstanceOpportunities;
export const selectScheduledShutdowns           = (state) => state.recommendations.scheduledShutdowns;
export const selectRecommendationsLoading       = (state) => state.recommendations.loading;
export const selectRecommendationsError         = (state) => state.recommendations.error;

// Derived: all pending recommendations across all types
export const selectOpenRecommendations = (state) => [
    ...state.recommendations.rightsizingRecommendations,
    ...state.recommendations.reservedInstanceOpportunities,
    ...state.recommendations.scheduledShutdowns,
].filter((r) => r.status === 'pending');

// Total potential savings from all pending recommendations
export const selectTotalPotentialSavings = (state) =>
    state.recommendations.optimizationSummary?.totalPotentialSavings
    ?? state.recommendations.optimizationSummary?.totalSavings
    ?? 0;

export default recommendationsSlice.reducer;
