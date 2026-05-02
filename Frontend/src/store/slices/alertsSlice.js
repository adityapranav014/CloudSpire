import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeAlerts: [],
  isConnected: false,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setSocketConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    addNewAlert: (state, action) => {
      // Add to beginning of array
      state.activeAlerts.unshift(action.payload);
    },
    setInitialAlerts: (state, action) => {
      state.activeAlerts = action.payload;
    },
    removeAlert: (state, action) => {
      state.activeAlerts = state.activeAlerts.filter(alert => alert._id !== action.payload);
    }
  },
});

export const { setSocketConnected, addNewAlert, setInitialAlerts, removeAlert } = alertsSlice.actions;

// Selectors
export const selectActiveAlerts = (state) => state.alerts.activeAlerts;
export const selectSocketConnected = (state) => state.alerts.isConnected;

export default alertsSlice.reducer;
