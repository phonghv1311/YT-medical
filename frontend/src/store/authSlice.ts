import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/auth';
import { doctorsApi } from '../api/doctors';
import type { AuthState, User } from '../types';
import { getJwtExpiryMs, TOKEN_EXPIRES_AT_KEY } from '../utils/jwt';

const initialState: AuthState & { profileFetched?: boolean } = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  doctorId: typeof localStorage !== 'undefined' ? (() => { const v = localStorage.getItem('doctorId'); return v ? parseInt(v, 10) : null; })() : null,
  loading: false,
  error: null,
  profileFetched: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials);
      const payload = data.data || data;
      return payload;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string; packageId?: number }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(userData);
      return data.data || data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  },
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () => {
  const { data } = await authApi.getProfile();
  return data.data || data;
});

export const fetchDoctorId = createAsyncThunk('auth/fetchDoctorId', async () => {
  const { data } = await doctorsApi.getMe();
  const payload = data?.data ?? data;
  const id = payload?.id;
  if (typeof id !== 'number') throw new Error('Invalid doctor profile');
  return id;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.doctorId = null;
      state.error = null;
      (state as { profileFetched?: boolean }).profileFetched = false;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('doctorId');
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
      authApi.logout().catch(() => { });
    },
    setDoctorId(state, action: PayloadAction<number>) {
      state.doctorId = action.payload;
      localStorage.setItem('doctorId', String(action.payload));
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      const expiresAt = getJwtExpiryMs(action.payload.accessToken);
      if (expiresAt != null) {
        localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state: AuthState & { profileFetched?: boolean }, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
      state.profileFetched = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      const expiresAt = getJwtExpiryMs(action.payload.accessToken);
      if (expiresAt != null) {
        localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
      }
    };

    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, handleAuth)
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, handleAuth)
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        (state as { profileFetched?: boolean }).profileFetched = true;
        const p = action.payload as User & { role?: string | { name?: string }; customer?: unknown };
        const roleVal = p.role as string | { name?: string } | undefined;
        state.user = {
          ...p,
          role: typeof roleVal === 'string' ? roleVal : (roleVal != null && typeof roleVal === 'object' ? (roleVal as { name?: string }).name ?? 'customer' : 'customer'),
          customer: p.customer,
        } as User;
      })
      .addCase(fetchDoctorId.fulfilled, (state, action) => {
        state.doctorId = action.payload;
        localStorage.setItem('doctorId', String(action.payload));
      })
      .addCase(fetchDoctorId.rejected, (state) => {
        state.doctorId = null;
        localStorage.removeItem('doctorId');
      });
  },
});

export const { logout, setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
