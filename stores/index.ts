import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from 'react-redux';
import authReducer from '../features/auth/authSlice';

// ─── Store Factory ────────────────────────────────────────────────────────────
// Using a factory function is the Next.js App Router recommended pattern.
// Each test or server render gets a fresh store; the browser gets a singleton
// via the StoreProvider component.

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// ─── Typed Hooks ──────────────────────────────────────────────────────────────
// Use these throughout the app instead of the plain `useDispatch` / `useSelector`
// hooks so TypeScript can infer the correct types automatically.

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;
