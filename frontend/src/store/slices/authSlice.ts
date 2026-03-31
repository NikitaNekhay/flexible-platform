import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'mentor' | 'viewer';

interface AuthState {
  token: string | null;
  role: UserRole;
}

const initialState: AuthState = {
  token: localStorage.getItem('auth_token'),
  role: (localStorage.getItem('auth_role') as UserRole) || 'mentor',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; role: UserRole }>) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      localStorage.setItem('auth_token', action.payload.token);
      localStorage.setItem('auth_role', action.payload.role);
    },
    logout(state) {
      state.token = null;
      state.role = 'viewer';
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
