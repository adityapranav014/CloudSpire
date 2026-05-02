import { createSlice } from '@reduxjs/toolkit';

/**
 * metricsSlice — stores real-time infrastructure metric snapshots.
 *
 * Updated every 3 seconds by the metrics:update socket event.
 * The dashboard Live Metrics panel reads from this slice.
 */

const initialState = {
    // Latest snapshot per server (keyed by serverId)
    // { [serverId]: { cpu, ram, disk, network, timestamp } }
    servers: {},

    // Cost delta accumulator (running total from cost:update events)
    costAccumulator: {
        amount: 0,
        currency: 'USD',
        lastUpdated: null,
    },

    // Which servers are actively streaming
    activeServerIds: [],
};

const metricsSlice = createSlice({
    name: 'metrics',
    initialState,
    reducers: {
        updateServerMetrics: (state, action) => {
            const { serverId, cpu, ram, disk, network, timestamp } = action.payload;
            state.servers[serverId] = { cpu, ram, disk, network, timestamp };

            if (!state.activeServerIds.includes(serverId)) {
                state.activeServerIds.push(serverId);
            }
        },

        accumulateCost: (state, action) => {
            const { amount, currency, timestamp } = action.payload;
            state.costAccumulator.amount += amount;
            state.costAccumulator.currency = currency || 'USD';
            state.costAccumulator.lastUpdated = timestamp;
        },

        resetCostAccumulator: (state) => {
            state.costAccumulator = initialState.costAccumulator;
        },

        removeServer: (state, action) => {
            const serverId = action.payload;
            delete state.servers[serverId];
            state.activeServerIds = state.activeServerIds.filter(id => id !== serverId);
        },

        clearAllMetrics: () => initialState,
    },
});

export const {
    updateServerMetrics,
    accumulateCost,
    resetCostAccumulator,
    removeServer,
    clearAllMetrics,
} = metricsSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectServerMetrics     = (serverId) => (state) => state.metrics.servers[serverId];
export const selectAllServerMetrics  = (state) => state.metrics.servers;
export const selectActiveServerIds   = (state) => state.metrics.activeServerIds;
export const selectCostAccumulator   = (state) => state.metrics.costAccumulator;

export default metricsSlice.reducer;
