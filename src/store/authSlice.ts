// src/store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User} from '../types/models';
import { login, logout } from '../api/apiService';

// Define the state structure
interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

// Initial state, checking localStorage for a persisted session
const user = localStorage.getItem('user');
const initialState: AuthState = {
    user: user ? JSON.parse(user) : null,
    isLoading: false,
    error: null,
};

// --- Async Thunk for Login (handles API call and state update) ---
export const loginUser = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
    'auth/loginUser',
    async ({ email, password }, thunkAPI) => {
        try {
            // login function from apiService handles saving to localStorage
            const response = await login(email, password); 
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to login';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// --- Auth Slice ---
export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Reducer for immediate logout
        logoutUser: (state) => {
            state.user = null;
            logout(); // Clear localStorage via apiService
        },
    },
    extraReducers: (builder) => {
        builder
            // Pending state (when waiting for API response)
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            // Fulfilled state (successful login)
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            // Rejected state (login failed)
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.user = null;
                state.error = action.payload || 'Login failed.';
            });
    },
});

export const { logoutUser } = authSlice.actions;

// --- Selectors for easy state access ---
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.user;
export const selectIsBoss = (state: { auth: AuthState }) => state.auth.user?.role === 'Boss';
export const selectIsManager = (state: { auth: AuthState }) => state.auth.user?.role === 'Manager';

export default authSlice.reducer;