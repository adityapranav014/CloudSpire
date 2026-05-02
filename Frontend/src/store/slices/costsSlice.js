import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCostRecords = createAsyncThunk(
    'costs/fetchRecords',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await api.get('/costs', { params });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || err.message || 'Failed to load cost records');
        }
    }
);

export const fetchTeamBreakdown = createAsyncThunk(
    'costs/fetchTeamBreakdown',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/costs/team-breakdown');
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || err.message || 'Failed to load team breakdown');
        }
    }
);

const costsSlice = createSlice({
    name: 'costs',
    initialState: {
        records: [],
        teamBreakdown: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearCosts: (state) => {
            state.records = [];
            state.teamBreakdown = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCostRecords.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchCostRecords.fulfilled, (state, action) => {
                state.loading = false;
                state.records = action.payload?.records ?? action.payload ?? [];
            })
            .addCase(fetchCostRecords.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchTeamBreakdown.fulfilled, (state, action) => {
                state.teamBreakdown = action.payload?.breakdown ?? action.payload ?? [];
            });
    },
});

export const { clearCosts } = costsSlice.actions;

export const selectCostRecords   = (state) => state.costs.records;
export const selectTeamBreakdown = (state) => state.costs.teamBreakdown;
export const selectCostsLoading  = (state) => state.costs.loading;
export const selectCostsError    = (state) => state.costs.error;

export default costsSlice.reducer;
