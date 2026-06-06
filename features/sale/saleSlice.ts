import { createSlice } from '@reduxjs/toolkit';

const saleSlice = createSlice({
  name: 'sale',
  initialState: {},
  reducers: {},
});

export default saleSlice.reducer;
export * from './types';
