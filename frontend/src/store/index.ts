import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { rtkErrorMiddleware } from './errorMiddleware';
import authReducer from './slices/authSlice';
import scenariosReducer from './slices/scenariosSlice';
import editorReducer from './slices/editorSlice';
import executionReducer from './slices/executionSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    scenarios: scenariosReducer,
    editor: editorReducer,
    execution: executionReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, rtkErrorMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
