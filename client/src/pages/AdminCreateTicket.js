import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AdminCreateTicket() {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('software'); // Default category
  const [priority, setPriority] = useState('medium'); // Default priority
  
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setError(null);
        const response = await axios.get(`${API_URL}/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClients(response.data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoadingClients(false);
      }
    };

    if (token) {
      fetchClients();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !title || !description || !category || !priority) {
      setError('Please fill in all fields, including selecting a client.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const ticketData = {
        clientId: selectedClientId,
        title,
        description,
        category,
        priority,
      };

      const response = await axios.post(`${API_URL}/admin/tickets`, ticketData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Ticket created successfully for ${clients.find(c => c._id === selectedClientId)?.firstName || 'client'}. ID: ${response.data._id}`);
      // Optionally clear form or navigate away
      // navigate(`/admin/tickets/${response.data._id}`); // Navigate to new ticket details
      // Reset form fields
      setSelectedClientId('');
      setTitle('');
      setDescription('');
      setCategory('software');
      setPriority('medium');

    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Ticket for Client
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!selectedClientId && !!error}>
                <InputLabel id="client-select-label">Client</InputLabel>
                <Select
                  labelId="client-select-label"
                  id="client-select"
                  value={selectedClientId}
                  label="Client"
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={loadingClients}
                >
                  {loadingClients ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Clients...
                    </MenuItem>
                  ) : (
                    [
                      <MenuItem key="" value="" disabled><em>Select a client</em></MenuItem>,
                      ...clients.map((client) => (
                        <MenuItem key={client._id} value={client._id}>
                          {client.firstName} {client.lastName} ({client.email})
                        </MenuItem>
                      ))
                    ]
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                label="Ticket Title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!title && !!error}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!description && !!error}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!category && !!error}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="hardware">Hardware</MenuItem>
                  <MenuItem value="software">Software</MenuItem>
                  <MenuItem value="network">Network</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!priority && !!error}>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={submitting || loadingClients}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Ticket'}
          </Button>
          <Button 
             fullWidth
             variant="outlined"
             onClick={() => navigate('/admin')} // Or back to ticket list?
           >
             Cancel
           </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default AdminCreateTicket; 