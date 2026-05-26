import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage, UserSession } from '../../services/tokenStorage';

// ─── State Shape ──────────────────────────────────────────────────────────────

export interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// ─── Initial State (hydrate from localStorage on first load) ──────────────────

function getInitialState(): AuthState {
  // tokenStorage.getAccessToken / getUser are SSR-safe (check window === undefined)
  const user = tokenStorage.getUser();
  const accessToken = tokenStorage.getAccessToken();

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
  };
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState,
  reducers: {
    /**
     * Called after a successful login (or token refresh that surfaces user data).
     * Persists tokens and user to localStorage via tokenStorage, then updates
     * the Redux store so all components get the new state instantly.
     */
    setCredentials(
      state,
      action: PayloadAction<{ user: UserSession; accessToken: string }>
    ) {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;

      // Keep tokenStorage in sync so the API client can read the latest token
      tokenStorage.setUser(user);
      tokenStorage.setAccessToken(accessToken);
    },

    /**
     * Called on logout. Clears both the Redux state and the localStorage entries
     * so the API client no longer attaches a Bearer token to outgoing requests.
     */
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      tokenStorage.clear();
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;

export default authSlice.reducer;
