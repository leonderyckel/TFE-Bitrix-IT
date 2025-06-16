import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const ADMIN_URL = process.env.REACT_APP_ADMIN_URL || '/api/admin';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Trying admin login with:', credentials.email);
      const response = await axios.post(`${ADMIN_URL}/login`, credentials);
      console.log('Admin login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const loadUserData = createAsyncThunk(
  'auth/loadUserData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token, isAdmin } = getState().auth;
      if (!token) throw new Error('No token found');

      // Choisir la bonne URL en fonction de isAdmin
      const url = isAdmin 
        ? `${ADMIN_URL}/profile` // Endpoint admin à créer
        : `${API_URL}/auth/me`;  // Endpoint utilisateur existant
      
      console.log(`Loading user data from ${isAdmin ? 'admin' : 'user'} API`);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Load user data error:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  isAdmin: localStorage.getItem('isAdmin') === 'true',
  registrationSuccess: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.isAdmin = false;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('isAdmin', 'false');
    },
    loginFailure: (state, action) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = action.payload;
      state.isAdmin = false;
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.isAdmin = false;
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    },
    loadUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.isAdmin = false;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('isAdmin', 'false');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.user = action.payload.admin;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.isAdmin = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('isAdmin', 'true');
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Admin login failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        // Ne pas connecter automatiquement l'utilisateur
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.isAdmin = false;
        state.registrationSuccess = true;
        // Ne pas sauvegarder le token dans localStorage
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Load User Data
      .addCase(loadUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load user data';
        if (action.payload?.message === 'No token found') {
          state.isAuthenticated = false;
          state.token = null;
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
        }
      });
  }
});

export const {
  loginSuccess,
  loginFailure,
  logout,
  loadUser,
  clearError,
  clearRegistrationSuccess
} = authSlice.actions;

export default authSlice.reducer; 