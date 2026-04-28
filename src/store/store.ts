// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productionReducer from './productionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        production: productionReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;