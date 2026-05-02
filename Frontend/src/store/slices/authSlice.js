import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { extractErrorMessage } from '../../services/api';

const STORAGE_KEY = 'cloudspire_token';

// Async Thunks
export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    const newToken = res.data.token;
    localStorage.setItem(STORAGE_KEY, newToken);
    return { user: res.data.data.user, token: newToken };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Invalid email or password. Please try again.'));
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    const newToken = res.data.token;
    localStorage.setItem(STORAGE_KEY, newToken);
    return { user: res.data.data.user, token: newToken };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Registration failed. Please try again.'));
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

const initialState = {
  user: null,
  token: localStorage.getItem(STORAGE_KEY) || null,
  isLoadingAuth: true,
  error: null,
  rolesData: {
      ROLE_PERMISSIONS: {},
      PAGE_ACCESS: {}
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem(STORAGE_KEY);
      state.token = null;
      state.user = null;
      state.error = null;
    },
    switchRole: (state, action) => {
        if (state.user) {
            state.user.role = action.payload;
        }
    },
    setAuthLoading: (state, action) => {
        state.isLoadingAuth = action.payload;
    }
  },
  extraReducers: (builder) => {
    // loadUser
    builder.addCase(loadUser.pending, (state) => {
      state.isLoadingAuth = true;
      state.error = null;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoadingAuth = false;
    });
    builder.addCase(loadUser.rejected, (state, action) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem(STORAGE_KEY);
      state.isLoadingAuth = false;
      state.error = action.payload;
    });

    // login
    builder.addCase(login.pending, (state) => {
        state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.error = action.payload;
    });

    // register
    builder.addCase(registerUser.pending, (state) => {
        state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.error = action.payload;
    });

    // fetchRoles
    builder.addCase(fetchRoles.fulfilled, (state, action) => {
        state.rolesData = action.payload;
    });
  },
});

export const { logout, switchRole, setAuthLoading } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsLoadingAuth = (state) => state.auth.isLoadingAuth;
export const selectAuthError = (state) => state.auth.error;
export const selectRolesData = (state) => state.auth.rolesData;

export default authSlice.reducer;
