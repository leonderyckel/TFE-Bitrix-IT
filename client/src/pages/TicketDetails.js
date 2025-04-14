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
  TextField
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { fetchTicket, addComment, closedTicket } from '../store/slices/ticketSlice';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTicket, loading, error } = useSelector((state) => state.tickets);

  useEffect(() => {
    if (id) {
      dispatch(fetchTicket(id));
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Ticket Details
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Ticket Info Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {currentTicket.title}
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AccessTimeIcon color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(currentTicket.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    Technician: {currentTicket.technician ? `${currentTicket.technician.firstName} ${currentTicket.technician.lastName}` : 'Not assigned'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CategoryIcon color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    Category: <Chip label={currentTicket.category} size="small" />
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FlagIcon color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    Priority: <Chip label={currentTicket.priority} color={getPriorityColor(currentTicket.priority)} size="small" />
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={currentTicket.status} color={getStatusColor(currentTicket.status)} size="small" />
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" paragraph>
              {currentTicket.description}
            </Typography>
          </Paper>
        </Grid>

        {/* Progress Tracking Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ticket Progress Tracking
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ width: '100%', my: 3 }}>
              <Stepper 
                activeStep={getActiveStepIndex(currentTicket)} 
                alternativeLabel
                sx={{
                  '& .MuiStepConnector-root': {
                    '& .MuiStepConnector-line': {
                      borderColor: 'warning.main',
                      borderTopWidth: '2px'
                    }
                  }
                }}
              >
                {getCompletedSteps(currentTicket).map((label, index) => {
                  const isInProgress = label === 'In Progress';
                  const isClosed = label === 'Closed';
                  
                  let textColor = {};
                  if (isInProgress) {
                    textColor = { color: 'warning.main', fontWeight: 'bold' };
                  } else if (isClosed) {
                    textColor = { color: 'success.main', fontWeight: 'bold' };
                  }
                  
                  return (
                    <Step 
                      key={index} 
                      completed={index < getActiveStepIndex(currentTicket)}
                      sx={{
                        '& .MuiStepIcon-root': {
                          color: isClosed ? 'success.main' : (isInProgress ? 'warning.main' : 'primary.main'),
                          '&.Mui-completed': {
                            color: 'primary.main'
                          },
                          '&.Mui-active': {
                            color: isClosed ? 'success.main' : 'warning.main'
                          },
                          '& text': {
                            fill: 'transparent' // Hide the numbers inside the circle
                          }
                        }
                      }}
                    >
                      <StepLabel
                        sx={{
                          '& .MuiStepLabel-label': textColor
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>

            {currentTicket.progress && currentTicket.progress.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Historique de progression
                </Typography>
                <List>
                  {currentTicket.progress.map((progress, index) => {
                    const statusMap = {
                      'logged': 'Logged',
                      'assigned': 'Assigned',
                      'quote-sent': 'Quote Sent',
                      'hardware-ordered': 'Hardware Ordered',
                      'scheduled': 'Scheduled', 
                      'rescheduled': 'Rescheduled',
                      'completed': 'Completed'
                    };
                    
                    return (
                      <ListItem key={index} divider={index < currentTicket.progress.length - 1}>
                        <ListItemText
                          primary={statusMap[progress.status] || progress.status}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {progress.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(progress.date).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Comments and Updates Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
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
  );
}

export default TicketDetails; 