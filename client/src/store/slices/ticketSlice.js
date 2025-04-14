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
  async (ticketId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
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
  tickets: [],
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
    fetchTicketsSuccess: (state, action) => {
      state.tickets = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchTicketSuccess: (state, action) => {
      state.currentTicket = action.payload;
      state.loading = false;
      state.error = null;
    },
    createTicketSuccess: (state, action) => {
      state.tickets.unshift(action.payload);
      state.loading = false;
      state.error = null;
    },
    updateTicketSuccess: (state, action) => {
      state.tickets = state.tickets.map(ticket =>
        ticket._id === action.payload._id ? action.payload : ticket
      );
      state.currentTicket = action.payload;
      state.loading = false;
      state.error = null;
    },
    deleteTicketSuccess: (state, action) => {
      state.tickets = state.tickets.filter(ticket => ticket._id !== action.payload);
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
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch tickets';
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
        state.tickets.unshift(action.payload);
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
        state.tickets = state.tickets.map(ticket =>
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
        state.tickets = state.tickets.map(ticket =>
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
        const index = state.tickets.findIndex(ticket => ticket._id === updatedTicket._id);
        
        if (index !== -1) {
          state.tickets[index] = updatedTicket;
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
  fetchTicketsSuccess,
  fetchTicketSuccess,
  createTicketSuccess,
  updateTicketSuccess,
  deleteTicketSuccess
} = ticketSlice.actions;

export default ticketSlice.reducer; 