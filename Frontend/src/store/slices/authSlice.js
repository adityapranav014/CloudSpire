import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { extractErrorMessage } from '../../services/api';

/**
 * Auth slice — cookie-based session (Task 2).
 *
 * What changed from Task 1:
 *   - `token` removed from state entirely. The JWT lives in an httpOnly cookie;
 *     JavaScript cannot read it and Redux must not store it.
 *   - `localStorage` removed entirely. No token is ever written to local storage.
 *   - `isAuthenticated` boolean derived from whether `user` is non-null.
 *   - `logout` thunk hits the server first (clears cookie), then wipes local state.
 *   - `loadUser` is the ONLY way to determine if a session exists on page load —
 *     it calls GET /auth/me, which succeeds if the cookie is valid.
 */

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Attempt to restore session from existing cookie.
 * Called once in main.jsx on app boot. If the cookie is missing/expired,
 * the server returns 401 and this thunk rejects — user must log in.
 */
export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
    try {
        const res = await api.get('/auth/me');
        return res.data.data.user;
    } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
    }
});

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            // Server sets httpOnly cookie. We only store the user object in Redux.
            return res.data.data.user;
        } catch (error) {
            return rejectWithValue(
                extractErrorMessage(error, 'Invalid email or password. Please try again.')
            );
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.post('/auth/register', data);
            // Server sets httpOnly cookie. We only store the user object.
            return res.data.data.user;
        } catch (error) {
            return rejectWithValue(
                extractErrorMessage(error, 'Registration failed. Please try again.')
            );
        }
    }
);

/**
 * Logout — hits the server to clear the cookie, THEN wipes local state.
 * Order matters: if we wipe state first, the API call loses its credentials.
 * If the server call fails we still wipe local state — user is effectively
 * logged out from the frontend even if the cookie lingers until expiry.
 */
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await api.post('/auth/logout');
    } catch {
        // Non-fatal: proceed with local state wipe regardless
    }
});

export const fetchRoles = createAsyncThunk('auth/fetchRoles', async (_, { rejectWithValue }) => {
    try {
        const res = await api.get('/roles');
        return res.data.data || res.data;
    } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
    }
});

/**
 * Called at the end of the Onboarding flow.
 * Marks onboardingCompleted: true on the server and updates local user state.
 */
export const completeOnboarding = createAsyncThunk(
    'auth/completeOnboarding',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.patch('/auth/complete-onboarding');
            return res.data.data.user;
        } catch (error) {
            return rejectWithValue(
                extractErrorMessage(error, 'Could not complete onboarding. Please try again.')
            );
        }
    }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
    user: null,           // Full user object: { id, orgId, teamId, role, name, email, ... }
    isLoadingAuth: true,  // True during initial loadUser call — prevents flash of login page
    error: null,
    rolesData: {
        ROLE_PERMISSIONS: {},
        PAGE_ACCESS: {},
    },
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Dev-only: used in role-switcher debug panel. Never call in production flows.
        switchRole: (state, action) => {
            if (state.user) state.user.role = action.payload;
        },
        clearAuthError: (state) => {
            state.error = null;
        },
        // Used to skip the loading spinner if we know auth isn't needed
        setAuthLoading: (state, action) => {
            state.isLoadingAuth = action.payload;
        },
    },
    extraReducers: (builder) => {
        // ── loadUser ──────────────────────────────────────────────────────────
        builder
            .addCase(loadUser.pending, (state) => {
                state.isLoadingAuth = true;
                state.error = null;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isLoadingAuth = false;
            })
            .addCase(loadUser.rejected, (state) => {
                state.user = null;
                state.isLoadingAuth = false;
                // Silent: 401 on loadUser is expected when not logged in
            });

        // ── login ─────────────────────────────────────────────────────────────
        builder
            .addCase(login.pending, (state) => { state.error = null; })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.error = action.payload;
            });

        // ── registerUser ──────────────────────────────────────────────────────
        builder
            .addCase(registerUser.pending, (state) => { state.error = null; })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.error = action.payload;
            });

        // ── logout ────────────────────────────────────────────────────────────
        // Both fulfilled and rejected wipe state — user is logged out regardless
        builder
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state) => {
                state.user = null; // Still wipe state even if server call failed
                state.error = null;
            });

        // ── fetchRoles ────────────────────────────────────────────────────────
        builder.addCase(fetchRoles.fulfilled, (state, action) => {
            state.rolesData = action.payload;
        });

        // ── completeOnboarding ────────────────────────────────────────────────
        builder
            .addCase(completeOnboarding.fulfilled, (state, action) => {
                if (state.user) state.user = { ...state.user, ...action.payload };
            })
            .addCase(completeOnboarding.rejected, (_state, action) => {
                console.warn('[authSlice] completeOnboarding failed:', action.payload);
            });
    },
});

export const { switchRole, clearAuthError, setAuthLoading } = authSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = (state) => state.auth.user;
export const selectIsLoadingAuth = (state) => state.auth.isLoadingAuth;
export const selectAuthError = (state) => state.auth.error;
export const selectRolesData = (state) => state.auth.rolesData;

// Derived
export const selectIsAuthenticated = (state) => state.auth.user !== null;
export const selectOrgId = (state) => state.auth.user?.orgId ?? null;
export const selectTeamId = (state) => state.auth.user?.teamId ?? null;
export const selectUserRole = (state) => state.auth.user?.role ?? null;
export const selectOnboardingCompleted = (state) => state.auth.user?.onboardingCompleted ?? false;

// Removed: selectToken — token is in httpOnly cookie, never in Redux state

export default authSlice.reducer;
