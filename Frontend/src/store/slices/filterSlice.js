import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  provider: 'all',
  dateRange: '30d',
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setProvider: (state, action) => {
      state.provider = action.payload;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
  },
});

export const { setProvider, setDateRange } = filterSlice.actions;
export default filterSlice.reducer;
