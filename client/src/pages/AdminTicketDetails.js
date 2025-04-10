import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Chip, 
  Divider, TextField, Button, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardHeader
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AdminTicketDetails() {
  const { id } = useParams();
  const { token } = useSelector((state) => state.auth);
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading ticket details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button 
            variant="contained" 
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Ticket not found</Typography>
          <Button 
            variant="contained" 
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
       {/* Header */}
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Ticket: {ticket.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              ID: {ticket._id} | Created: {new Date(ticket.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </Button>
        </Box>

      <Grid container spacing={3}>
        {/* Left Column: Description */}
        <Grid item xs={12} md={7}>
          {/* Description Card */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Description" />
            <CardContent>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Info, Actions & Comments */}
        <Grid item xs={12} md={5}>
          {/* Ticket Info Card */}
          <Card sx={{ mb: 3 }}>
             <CardHeader title="Ticket Information" />
             <CardContent>
                <Grid container spacing={1.5}>
                  <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Status:</Typography></Grid>
                  <Grid item xs={7}>{getStatusChip(ticket.status)}</Grid>
                  
                  <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Priority:</Typography></Grid>
                  <Grid item xs={7}>{getPriorityChip(ticket.priority)}</Grid>
                  
                  <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Category:</Typography></Grid>
                  <Grid item xs={7}><Chip label={ticket.category} size="small" /></Grid>

                  <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Client:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2">{ticket.client?.firstName} {ticket.client?.lastName} ({ticket.client?.email})</Typography></Grid>
                  
                  <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Assigned To:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2">{ticket.technician ? `${ticket.technician.firstName} ${ticket.technician.lastName}` : 'Unassigned'}</Typography></Grid>
                </Grid>
             </CardContent>
          </Card>

          {/* Actions Card */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Actions" />
            <CardContent>
              {/* Assign Technician */}
              {ticket.status !== 'closed' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Assign Technician</Typography>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Select Technician</InputLabel>
                    <Select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      label="Select Technician"
                    >
                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                      {technicians.map((tech) => (
                        <MenuItem key={tech._id} value={tech._id}>
                          {tech.firstName} {tech.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    onClick={handleAssignTechnician}
                    disabled={submitting || !selectedTechnician || selectedTechnician === ticket.technician?._id}
                    sx={{ mt: 1 }}
                    size="small"
                  >
                    {submitting ? <CircularProgress size={20} /> : 'Assign'}
                  </Button>
                </Box>
              )}

              {/* Close Ticket */}
              {ticket.status !== 'closed' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Close Ticket</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Resolution Description (optional)"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button 
                    variant="contained" 
                    color="success" 
                    onClick={handleCloseTicket}
                    disabled={submitting}
                    size="small"
                  >
                    {submitting ? <CircularProgress size={20} /> : 'Close Ticket'}
                  </Button>
                </Box>
              )}
              {ticket.status === 'closed' && (
                <Box>
                    <Typography variant="subtitle1" gutterBottom>Resolution</Typography>
                    <Typography variant="body2" color="text.secondary">
                    This ticket is closed.
                    {ticket.resolutionDescription 
                        ? <><br/>Resolution: {ticket.resolutionDescription}</> 
                        : " (No resolution description provided)"}
                    </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Comments Card - MOVED HERE */}
          <Card>
            <CardHeader title="Comments" />
            <CardContent>
              <List sx={{ maxHeight: 350, overflow: 'auto', mb: 2, p: 0 }}>
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((comment) => (
                    <React.Fragment key={comment._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>{comment.author?.firstName?.[0] || 'U'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.content}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {comment.author?.firstName} {comment.author?.lastName} 
                                {comment.author?.isAdmin && <Chip label="Admin" size="small" sx={{ ml: 1 }} />}
                              </Typography>
                              {" — " + new Date(comment.createdAt).toLocaleString()}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No comments yet." />
                  </ListItem>
                )}
              </List>

              {/* Add Comment Form */}
              {ticket.status !== 'closed' && (
                  <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Add a comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                    <Button 
                      type="submit" 
                      variant="contained" 
                      disabled={submitting || !comment.trim()}
                      sx={{ mt: 1 }}
                      size="small"
                    >
                      {submitting ? <CircularProgress size={20} /> : 'Add Comment'}
                    </Button>
                  </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminTicketDetails; 