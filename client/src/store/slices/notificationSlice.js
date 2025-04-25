import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../../config/api'; // Correct the relative path to go up two levels

// Thunk to fetch notifications from the API
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token; // Get token from auth state
    if (!token) {
      return rejectWithValue('No token found');
    }
    try {
      const response = await axios.get(`${API_URL}/notifications`, { // Use API_URL
        headers: { Authorization: `Bearer ${token}` },
      });
      // Expecting response.data = { notifications: [], unreadCount: 0 }
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Thunk to mark a specific notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
      return rejectWithValue('No token found');
    }
    try {
      await axios.post(`${API_URL}/notifications/mark-read`, { ids: [notificationId] }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return notificationId; // Return the ID to update the state optimistically
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

// Thunk to mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
      return rejectWithValue('No token found');
    }
    try {
      await axios.post(`${API_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return; // No specific data needed on success
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Helper to generate unique IDs (or use a library like uuid)
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Synchronous action to add notification instantly from WebSocket
    addNotification: (state, action) => {
      const newNotification = {
        id: generateId(), // Use a temporary client-side ID or wait for fetch?
                      // Let's use temporary ID for now for immediate UI update
        _id: null, // DB id will come from fetch
        text: action.payload.text, 
        ticketId: action.payload.ticketId,
        read: false,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(), // Add createdAt for sorting consistency
        link: action.payload.ticketId ? `/tickets/${action.payload.ticketId}` : null // Generate link
      };
      // Prevent adding duplicates if socket messages arrive fast
      if (!state.items.some(item => item.text === newNotification.text && !item.read)) {
          state.items.unshift(newNotification);
          state.unreadCount = state.items.filter(item => !item.read).length;
      }
    },
    // clearNotifications can remain synchronous
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Replace items with fetched data, ensuring correct ID (_id from DB)
        state.items = action.payload.notifications; 
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.items.find(item => item._id === action.payload || item.id === action.payload); // Match DB or temp ID
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = state.items.filter(item => !item.read).length;
        }
      })
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach(item => { item.read = true; });
        state.unreadCount = 0;
      });
      // Note: Can add .pending and .rejected handlers for mark actions if needed
  },
});

// Export the synchronous action separately
export const { addNotification, clearNotifications } = notificationSlice.actions;

export default notificationSlice.reducer; 