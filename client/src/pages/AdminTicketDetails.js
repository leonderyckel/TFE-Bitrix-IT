import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Chip, 
  Divider, TextField, Button, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardHeader,
  Stack, Alert
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { 
  fetchTicket, 
  updateTicket, 
  addComment, 
  updateTicketProgress
} from '../store/slices/ticketSlice';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CancelIcon from '@mui/icons-material/Cancel';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

function AdminTicketDetails() {
  const { id } = useParams();
  const { token } = useSelector((state) => state.auth);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState(null);
  const [resolution, setResolution] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [formData, setFormData] = useState(null);
  const [selectedTechnicianForAssign, setSelectedTechnicianForAssign] = useState('');
  const navigate = useNavigate();

  // State for inline date/description editing
  const [scheduleDate, setScheduleDate] = useState(null);

  const dispatch = useDispatch();

  // Définir toutes les étapes possibles de progression
  const allProgressSteps = [
    { value: 'logged', label: 'Logged', required: true },
    { value: 'assigned', label: 'Assigned', optional: true },
    { value: 'quote-sent', label: 'Quote Sent', optional: true },
    { value: 'hardware-ordered', label: 'Hardware Ordered', optional: true },
    { value: 'scheduled', label: 'Scheduled', optional: true, requiresDate: true },
    { value: 'rescheduled', label: 'Rescheduled', optional: true, requiresDate: true },
    { value: 'closed', label: 'Done', optional: true }
  ];

  // Fonction pour mettre à jour le statut de progression
  const handleUpdateProgress = async (progressStatus, description, technicianId = null, dateValue = null) => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        status: progressStatus,
        description: description,
      };

      if (technicianId) {
        payload.technicianId = technicianId;
      }
      if (dateValue && dayjs(dateValue).isValid()) {
        payload.scheduledDate = dayjs(dateValue).toISOString();
      }

      const response = await axios.post(
        `${API_URL}/admin/tickets/${id}/progress`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setTicket(response.data);
      
      dispatch(fetchTicket({ ticketId: id, isAdmin: true })).then(action => {
        if (fetchTicket.fulfilled.match(action)) {
          setTicket(action.payload);
        } else {
          console.error("Failed to re-fetch ticket details after progress update:", action.payload);
          setError("Progress updated, but failed to refresh details.");
        }
      });

      setScheduleDate(null);

    } catch (error) {
      console.error('Error adding progress update:', error);
      setError('Failed to add progress update. ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Vérifier si une étape a déjà été marquée comme complétée
  const isStepCompleted = (stepValue) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) return false;
    return ticket.progress.some(p => p.status === stepValue);
  };

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

  const handleCancelTicket = async () => {
    if (!cancellationReason.trim()) {
      setError('Cancellation reason is required.');
      return;
    }
    try {
      setCancelling(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/admin/tickets/${id}/cancel`,
        { reason: cancellationReason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTicket(response.data);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setError('Failed to cancel ticket. ' + (error.response?.data?.message || error.message));
    } finally {
      setCancelling(false);
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          {/* Combined Sections in a single full-width column */}
          <Grid item xs={12} md={12}>
            
            {/* Description Card */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Description" />
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>
              </CardContent>
            </Card>

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

                    {/* Display Suggested Date if available */}
                    {ticket.suggestedDate && (
                      <>
                        <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Suggested Date:</Typography></Grid>
                        <Grid item xs={7}><Typography variant="body2">{new Date(ticket.suggestedDate).toLocaleString()}</Typography></Grid>
                      </>
                    )}

                    <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Client:</Typography></Grid>
                    <Grid item xs={7}><Typography variant="body2">{ticket.client?.firstName} {ticket.client?.lastName} ({ticket.client?.email})</Typography></Grid>
                    
                    <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight="bold">Assigned To:</Typography></Grid>
                    <Grid item xs={7}>
                      <Typography variant="body2">
                        {ticket.technician && ticket.technician.firstName && ticket.technician.lastName
                          ? `${ticket.technician.firstName} ${ticket.technician.lastName}`
                          : ticket.technician 
                          ? 'Technician details not found' // Case where object exists but names are missing
                          : 'Unassigned' // Case where technician field is null/undefined
                        }
                      </Typography>
                    </Grid>
                  </Grid>
               </CardContent>
            </Card>

            {/* Progress Tracking Card */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Progress Tracking" />
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Check completed steps to make them visible to client
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {allProgressSteps.map((step) => (
                    <Box 
                      key={step.value}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Chip 
                          label={step.label} 
                          color={isStepCompleted(step.value) ? "primary" : "default"}
                          variant={isStepCompleted(step.value) ? "filled" : "outlined"}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, justifyContent: 'flex-end' }}>
                          {isStepCompleted(step.value) ? (
                            <Typography variant="body2" color="text.secondary">
                              Completed
                            </Typography>
                          ) : step.requiresDate ? (
                            <>
                               <DateTimePicker
                                label={`Select Date & Time`}
                                value={scheduleDate}
                                onChange={(newValue) => {
                                  setScheduleDate(newValue);
                                }}
                                renderInput={(params) => 
                                  <TextField {...params} 
                                    size="small" 
                                    sx={{ minWidth: 200 }} 
                                    required 
                                  />
                                }
                              />
                              <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => {
                                      if (scheduleDate && dayjs(scheduleDate).isValid()) {
                                          handleUpdateProgress(step.value, null, null, scheduleDate);
                                      } else {
                                          console.error("Invalid or missing date");
                                          setError("Please select a valid date and time.");
                                      }
                                  }}
                                  disabled={submitting || !scheduleDate || !dayjs(scheduleDate).isValid()}
                                >
                                  Save
                                </Button>
                            </>
                          ) : step.value === 'assigned' ? (
                            <>
                              <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id={`assign-tech-label-${step.value}`}>Assign To</InputLabel>
                                <Select
                                  labelId={`assign-tech-label-${step.value}`}
                                  value={selectedTechnicianForAssign}
                                  label="Assign To"
                                  onChange={(e) => setSelectedTechnicianForAssign(e.target.value)}
                                >
                                  <MenuItem value="">
                                    <em>Select Technician</em>
                                  </MenuItem>
                                  {technicians.map((tech) => (
                                    <MenuItem key={tech._id} value={tech._id}>
                                      {tech.firstName} {tech.lastName}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  const description = window.prompt(`Add description for ${step.label} step:`);
                                  if (description !== null) {
                                    handleUpdateProgress(step.value, description || `${step.label} completed`, selectedTechnicianForAssign);
                                  }
                                }}
                                disabled={submitting || !selectedTechnicianForAssign}
                              >
                                Mark as Done
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const description = window.prompt(`Add description for ${step.label} step:`);
                                 if (description !== null) {
                                  handleUpdateProgress(step.value, description || `${step.label} completed`);
                                }
                              }}
                              disabled={submitting}
                            >
                              Mark as Done
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
                
                {ticket && ticket.progress && ticket.progress.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Progress History
                    </Typography>
                    <List>
                      {ticket.progress.map((progress, index) => (
                        <ListItem key={index} divider={index < ticket.progress.length - 1}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2">
                                {allProgressSteps.find(s => s.value === progress.status)?.label || progress.status}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {progress.description}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {new Date(progress.date).toLocaleString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Comments Card */}
            <Card sx={{ mb: 3 }}>
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

                {ticket && !['closed', 'cancelled'].includes(ticket.status) ? (
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
                        disabled={submitting || cancelling || !comment.trim()}
                        sx={{ mt: 1 }}
                        size="small"
                      >
                        {submitting ? <CircularProgress size={20} /> : 'Add Comment'}
                      </Button>
                    </Box>
                ) : (
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Cannot add comments to a {ticket?.status} ticket.
                    </Typography>
                )}
              </CardContent>
            </Card>

            {/* Cancel Ticket Card */}
            {ticket && !['closed', 'cancelled'].includes(ticket.status) && (
              <Card>
                <CardHeader title="Cancel Ticket" />
                <CardContent>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Cancellation Reason (Required)"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    variant="outlined"
                    size="small"
                    error={!!error && !cancellationReason.trim()}
                    helperText={error && !cancellationReason.trim() ? error : ''}
                    sx={{ mb: 1 }}
                  />
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={handleCancelTicket}
                    disabled={cancelling || submitting || !cancellationReason.trim()}
                    fullWidth
                  >
                    {cancelling ? <CircularProgress size={24} /> : 'Confirm Cancellation'}
                  </Button>
                </CardContent>
              </Card>
            )}

          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

export default AdminTicketDetails; 