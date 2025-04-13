import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  fromDate: null,
  toDate: null,
  searchValues: {},
};

const filterSettingsSlice = createSlice({
  name: 'filterSettings',
  initialState,
  reducers: {
    setFilterSettings(state, action) {
      const { fromDate, toDate, searchValues } = action.payload;
      state.fromDate = fromDate;
      state.toDate = toDate;
      state.searchValues = searchValues;
    },
  },
});

export const { setFilterSettings } = filterSettingsSlice.actions;
export default filterSettingsSlice.reducer;