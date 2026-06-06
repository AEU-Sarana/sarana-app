import { createSlice } from '@reduxjs/toolkit';

const settingSlice = createSlice({
  name: 'setting',
  initialState: {},
  reducers: {},
});

export default settingSlice.reducer;
export * from './types';
