import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setCredentials, logout } from './slices/authSlice';

export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    localStorage.setItem('auth_token', action.payload.token);
    localStorage.setItem('auth_role', action.payload.role);
  },
});

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
  },
});
