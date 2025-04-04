import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Chip, 
  Divider, TextField, Button, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AdminTicketDetails() {
  const { id } = useParams();
  const { user, token } = useSelector((state) => state.auth);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resolution, setResolution] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/tickets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTicket(response.data);
        
        // Get technicians
        const techResponse = await axios.get(`${API_URL}/admin/admins`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Filter only technicians from admin users
        const technicianUsers = techResponse.data.filter(admin => admin.role === 'technician');
        setTechnicians(technicianUsers);
        
        if (response.data.technician) {
          setSelectedTechnician(response.data.technician._id);
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError('Failed to load ticket. ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, token]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_URL}/admin/tickets/${id}/comments`,
        { content: comment },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTicket(response.data);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_URL}/admin/tickets/${id}/assign`,
        { technicianId: selectedTechnician },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTicket(response.data);
    } catch (error) {
      console.error('Error assigning technician:', error);
      setError('Failed to assign technician. ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_URL}/admin/tickets/${id}/close`,
        { resolutionDescription: resolution },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTicket(response.data);
    } catch (error) {
      console.error('Error closing ticket:', error);
      setError('Failed to close ticket. ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'open':
        return <Chip label="Open" color="error" />;
      case 'in-progress':
        return <Chip label="In Progress" color="warning" />;
      case 'resolved':
        return <Chip label="Resolved" color="success" />;
      case 'closed':
        return <Chip label="Closed" color="default" />;
      default:
        return <Chip label={status} />;
    }
  };

  const getPriorityChip = (priority) => {
    switch (priority) {
      case 'low':
        return <Chip label="Low" color="success" />;
      case 'medium':
        return <Chip label="Medium" color="info" />;
      case 'high':
        return <Chip label="High" color="warning" />;
      case 'critical':
        return <Chip label="Critical" color="error" />;
      default:
        return <Chip label={priority} />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading ticket details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/admin')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Ticket not found</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/admin')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" gutterBottom>
                Ticket Details
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/admin')}
              >
                Back to Dashboard
              </Button>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Viewing ticket ID: {ticket._id}
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h5">{ticket.title}</Typography>
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Ticket Info</Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Status: </Typography>
                {getStatusChip(ticket.status)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Priority: </Typography>
                {getPriorityChip(ticket.priority)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Category: </Typography>
                <Chip label={ticket.category} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Created: </Typography>
                <Typography variant="body2" component="span">
                  {new Date(ticket.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Client: </Typography>
                <Typography variant="body2" component="span">
                  {ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" component="span" color="text.secondary">Assigned To: </Typography>
                <Typography variant="body2" component="span">
                  {ticket.technician ? `${ticket.technician.firstName} ${ticket.technician.lastName}` : 'Unassigned'}
                </Typography>
              </Box>
            </Paper>

            {/* Assign Technician Section */}
            {(ticket.status !== 'closed' && ticket.status !== 'resolved') && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>Assign Technician</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Select Technician</InputLabel>
                  <Select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    label="Select Technician"
                  >
                    {technicians.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>
                        {tech.firstName} {tech.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  disabled={!selectedTechnician || submitting}
                  onClick={handleAssignTechnician}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Assign'}
                </Button>
              </Paper>
            )}

            {/* Resolve Ticket Section */}
            {(ticket.status !== 'closed' && ticket.status !== 'resolved') && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>Close Ticket</Typography>
                <TextField
                  fullWidth
                  label="Resolution details"
                  multiline
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  fullWidth
                  disabled={submitting}
                  onClick={handleCloseTicket}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Close Ticket'}
                </Button>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Comments</Typography>
            
            {ticket.comments.length > 0 ? (
              <List>
                {ticket.comments.map((comment, index) => (
                  <ListItem key={index} alignItems="flex-start" divider={index < ticket.comments.length - 1}>
                    <ListItemAvatar>
                      <Avatar>{comment.user?.firstName?.charAt(0) || 'U'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {comment.user?.firstName} {comment.user?.lastName} 
                          <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                        >
                          {comment.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
            )}

            {/* Add Comment Form */}
            {(ticket.status !== 'closed') && (
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Add a comment"
                  multiline
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={!comment.trim() || submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Add Comment'}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default AdminTicketDetails; 