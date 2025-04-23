import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Stepper, 
  Step, 
  StepLabel, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress,
  Card,
  CardContent,
  Button,
  List,
  ListItem, 
  ListItemText,
  ListItemIcon,
  TextField,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Comment as CommentIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { fetchTicket, addComment, closedTicket } from '../store/slices/ticketSlice';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs from 'dayjs';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTicket, loading, error } = useSelector((state) => state.tickets);

  useEffect(() => {
    if (id) {
      dispatch(fetchTicket({ ticketId: id, isAdmin: false }));
    }
  }, [id, dispatch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in-progress':
      case 'assigned':
      case 'diagnosing':
      case 'waiting-client':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <ErrorIcon color="error" />;
      case 'in-progress':
      case 'assigned':
      case 'diagnosing':
        return <SyncIcon color="warning" />;
      case 'waiting-client':
        return <AccessTimeIcon color="info" />;
      case 'resolved':
      case 'closed':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  // Fonction pour obtenir les étapes de progression terminées plus une étape "In Progress" si nécessaire
  const getCompletedSteps = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return ['Logged'];
    }
    
    // Récupérer les étapes complétées (en ordre d'ajout)
    const completedSteps = ticket.progress.map(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled', 
        'rescheduled': 'Rescheduled',
        'closed': 'Closed'
      };
      return statusMap[p.status] || p.status;
    });
    
    // Ne pas ajouter "In Progress" si le ticket est fermé
    const isCompleted = ticket.status === 'closed';
    
    // Ajouter "In Progress" uniquement si le ticket n'est pas completé
    return isCompleted ? completedSteps : [...completedSteps, 'In Progress'];
  };

  // Fonction pour obtenir l'index de l'étape active
  const getActiveStepIndex = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return 0;
    }
    
    // Si le ticket est terminé, l'étape active est la dernière étape
    if (ticket.status === 'resolved' || ticket.status === 'closed' || 
        (ticket.progress.length > 0 && ticket.progress[ticket.progress.length - 1].status === 'completed')) {
      return getCompletedSteps(ticket).length - 1;
    }
    
    // Sinon, l'étape active est "In Progress" (dernière étape dans le tableau)
    return getCompletedSteps(ticket).length - 1;
  };

  const getStepDescription = (step, ticket) => {
    if (!ticket || !ticket.progress) return '';
    
    // Trouver l'entrée de progression correspondante pour afficher sa description
    const progressEntry = ticket.progress.find(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled',
        'rescheduled': 'Rescheduled',
        'completed': 'Completed'
      };
      return statusMap[p.status] === step;
    });
    
    return progressEntry ? progressEntry.description : '';
  };

  // Map status values to more readable labels for the history list
  const progressStatusLabels = {
    'logged': 'Logged',
    'assigned': 'Assigned',
    'quote-sent': 'Quote Sent',
    'hardware-ordered': 'Hardware Ordered',
    'scheduled': 'Scheduled',
    'rescheduled': 'Rescheduled',
    'closed': 'Closed'
  };

  // Keep the Stepper logic for the top visual progress bar
  const completedSteps = getCompletedSteps(currentTicket);
  const activeStep = getActiveStepIndex(currentTicket);

  // --- Add logic to find the latest scheduled date ---
  let latestScheduledDate = null;
  if (currentTicket && currentTicket.progress) {
    // Iterate backwards to find the most recent relevant entry
    for (let i = currentTicket.progress.length - 1; i >= 0; i--) {
      const progress = currentTicket.progress[i];
      if (['scheduled', 'rescheduled'].includes(progress.status) && progress.scheduledDate) {
        const date = dayjs(progress.scheduledDate);
        if (date.isValid()) { // Check if the date is valid
          latestScheduledDate = date;
          break; // Found the latest one
        }
      }
    }
  }
  // --- End logic ---

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography color="error" variant="h6">
            Error: {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/tickets')}
            sx={{ mt: 2, alignSelf: 'flex-start' }}
          >
            Back to Tickets
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!currentTicket) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">
            No ticket found.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/tickets')}
            sx={{ mt: 2, alignSelf: 'flex-start' }}
          >
            Back to Tickets
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header matching TicketList style */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          bgcolor: 'primary.main', // Use primary blue color
          borderRadius: '8px', // Match TicketList explicit border radius
          color: 'primary.contrastText', // Set text color to white
          p: 2 // Match TicketList padding
        }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 0, color: 'inherit', fontWeight: 'bold' }}>
              Ticket Details: {currentTicket.title}
            </Typography>
          </Box>
          {/* Keep the existing outlined button style for now */}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => navigate('/tickets')}
            sx={{ 
              color: 'primary.contrastText', 
              borderColor: 'rgba(255, 255, 255, 0.5)', 
              '&:hover': { 
                borderColor: 'primary.contrastText', 
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              } 
            }}
          >
            Back to Tickets
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Combined Info / Description / Schedule Card */}
          <Grid item xs={12} md={6}> 
            <Paper sx={{ p: 3 }}>
              {/* 1. Ticket Info Section (Moved to top) */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Created Date */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><AccessTimeIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(currentTicket.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                {/* Technician */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><PersonIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Technician: {currentTicket.technician ? `${currentTicket.technician.firstName} ${currentTicket.technician.lastName}` : 'Not assigned'}
                    </Typography>
                  </Box>
                </Grid>
                 {/* Category */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><CategoryIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Category: <Chip label={currentTicket.category} size="small" />
                    </Typography>
                  </Box>
                </Grid>
                 {/* Priority */} 
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><FlagIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Priority: <Chip label={currentTicket.priority} color={getPriorityColor(currentTicket.priority)} size="small" />
                    </Typography>
                  </Box>
                </Grid>
                 {/* Status */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><InfoIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Status: <Chip label={currentTicket.status} color={getStatusColor(currentTicket.status)} size="small" />
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 2. Description Section */}
              <Typography variant="subtitle1" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {currentTicket.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />

              {/* 3. Scheduled Date Section (Moved here) */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Scheduled Date
              </Typography>
              {latestScheduledDate ? (
                <Box sx={{ mt: 1 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    readOnly
                    value={latestScheduledDate}
                    renderInput={(params) => <TextField {...params} sx={{ display: 'none' }} />}
                    sx={{
                      '& .MuiPickerStaticWrapper-root': { minWidth: 'auto' },
                      '& .MuiCalendarPicker-root': { width: '100%', maxHeight: '300px' },
                      bgcolor: 'transparent'
                    }}
                  />
                  {/* Enhanced Time Display */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 2,
                    gap: 1
                  }}>
                    <AccessTimeIcon color="action" />
                    <Typography variant="subtitle1">
                      {latestScheduledDate.format('HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Not planned yet
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Ticket Progress Tracking Card (Remains on the right) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Ticket Progress Tracking
              </Typography>
              {/* Restore specific styling for the Stepper */}
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {completedSteps.map((label, index) => {
                  const isActive = index === activeStep;
                  const isInProgress = isActive && label === 'In Progress'; // Check if it's the active In Progress step

                  return (
                    <Step key={label} completed={index < activeStep}>
                      <StepLabel
                        StepIconProps={{
                          sx: {
                            // Style the icon container for the active 'In Progress' step
                            '&.Mui-active': {
                              color: isInProgress ? 'warning.main' : undefined, 
                              // Hide the text number inside the active 'In Progress' icon
                              '& .MuiStepIcon-text': { 
                                fill: isInProgress ? 'transparent' : undefined, 
                              }
                            },
                            // Completed icons remain default (primary)
                            // Inactive icons remain default
                          },
                        }}
                        sx={{
                          // Style the label text for the active 'In Progress' step
                          '& .MuiStepLabel-label': {
                            '&.Mui-active': {
                              color: isInProgress ? 'warning.main' : undefined,
                              fontWeight: isInProgress ? 'medium' : undefined,
                            },
                            // Completed labels remain default
                            // Inactive labels remain default
                          },
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
              <Divider sx={{ my: 2 }} />

              {/* Progress History List (like admin view) */}
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon fontSize="small" />
                Progress History
              </Typography>
              {currentTicket.progress && currentTicket.progress.length > 0 ? (
                <List dense sx={{ 
                  overflow: 'auto', 
                  bgcolor: 'background.paper', 
                  p: 0, 
                  flexGrow: 1 // Allow list to take remaining vertical space
                }}>
                  {currentTicket.progress.map((progress, index) => (
                    <ListItem key={index} divider={index < currentTicket.progress.length - 1}>
                       <ListItemAvatar sx={{ minWidth: 40}}>
                         <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', fontSize: '0.8rem' }}>
                           {index + 1}
                         </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                             {progressStatusLabels[progress.status] || progress.status} 
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.secondary">
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
              ) : (
                <Typography variant="body2" color="text.secondary">No progress history yet.</Typography>
              )}
            </Paper>
          </Grid>

          {/* Updates and Comments Card (Remains full width below) */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon fontSize="small" />
                Updates and Comments
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <List>
                {currentTicket.comments && currentTicket.comments.length > 0 ? (
                  currentTicket.comments.map((comment, index) => (
                    <ListItem key={index} alignItems="flex-start" divider={index < currentTicket.comments.length - 1}>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {comment.user?.firstName} {comment.user?.lastName} 
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                          </Typography>
                        }
                        secondary={comment.content}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No comments yet"
                      secondary="Check back later for updates on your ticket"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

export default TicketDetails; 