import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../../config/api';

// Async thunks
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchTicket = createAsyncThunk(
  'tickets/fetchTicket',
  async ({ ticketId, isAdmin }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isAdmin 
        ? `${API_URL}/admin/tickets/${ticketId}` 
        : `${API_URL}/tickets/${ticketId}`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error fetching ticket' });
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tickets`, ticketData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/tickets/${ticketId}`, ticketData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addComment = createAsyncThunk(
  'tickets/addComment',
  async ({ ticketId, comment }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tickets/${ticketId}/comments`, { content: comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTicketProgress = createAsyncThunk(
  'tickets/updateTicketProgress',
  async ({ ticketId, progressData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;
      
      const response = await axios.post(
        `${API_URL}/admin/tickets/${ticketId}/progress`,
        progressData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  myTickets: [],
  companyTickets: [],
  currentTicket: null,
  loading: false,
  error: null
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchTicketSuccess: (state, action) => {
      state.currentTicket = action.payload;
      state.loading = false;
      state.error = null;
    },
    createTicketSuccess: (state, action) => {
      state.myTickets.unshift(action.payload);
      state.loading = false;
      state.error = null;
    },
    updateTicketSuccess: (state, action) => {
      state.currentTicket = action.payload;
      state.myTickets = state.myTickets.map(ticket =>
        ticket._id === action.payload._id ? action.payload : ticket
      );
      state.companyTickets = state.companyTickets.map(ticket =>
        ticket._id === action.payload._id ? action.payload : ticket
      );
      state.loading = false;
      state.error = null;
    },
    deleteTicketSuccess: (state, action) => {
      state.myTickets = state.myTickets.filter(ticket => ticket._id !== action.payload);
      state.companyTickets = state.companyTickets.filter(ticket => ticket._id !== action.payload);
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.myTickets = [];
        state.companyTickets = [];
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.myTickets = action.payload.myTickets || [];
        state.companyTickets = action.payload.companyTickets || [];
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch tickets';
        state.myTickets = [];
        state.companyTickets = [];
      })
      // Fetch Single Ticket
      .addCase(fetchTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch ticket';
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.myTickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create ticket';
      })
      // Update Ticket
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        state.myTickets = state.myTickets.map(ticket =>
          ticket._id === action.payload._id ? action.payload : ticket
        );
        state.companyTickets = state.companyTickets.map(ticket =>
          ticket._id === action.payload._id ? action.payload : ticket
        );
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update ticket';
      })
      // Add Comment
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        state.myTickets = state.myTickets.map(ticket =>
          ticket._id === action.payload._id ? action.payload : ticket
        );
        state.companyTickets = state.companyTickets.map(ticket =>
          ticket._id === action.payload._id ? action.payload : ticket
        );
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add comment';
      })
      // Handle updateTicketProgress
      .addCase(updateTicketProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Update the ticket with new progress information
        const updatedTicket = action.payload;
        const index = state.myTickets.findIndex(ticket => ticket._id === updatedTicket._id);
        
        if (index !== -1) {
          state.myTickets[index] = updatedTicket;
        }
        
        // If this is the currently viewed ticket, update it too
        if (state.currentTicket && state.currentTicket._id === updatedTicket._id) {
          state.currentTicket = updatedTicket;
        }
      })
      .addCase(updateTicketProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update ticket progress';
      });
  }
});

export const {
  setLoading,
  setError,
  fetchTicketSuccess,
  createTicketSuccess,
  updateTicketSuccess,
  deleteTicketSuccess
} = ticketSlice.actions;

export default ticketSlice.reducer; 