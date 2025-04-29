import React, { useEffect, useState, useRef } from 'react';
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
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import io from 'socket.io-client';
import API_URL from '../config/api';
import { addNotification } from '../store/slices/notificationSlice';

dayjs.extend(isSameOrBefore);

// Socket connection instance (create outside component to avoid re-creation)
let socket;

function TicketDetails() {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTicket, loading, error } = useSelector((state) => state.tickets);
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [liveTicket, setLiveTicket] = useState(null);
  const socketRef = useRef();
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicket({ ticketId, isAdmin: false }));
    }

    const serverBaseUrl = API_URL.substring(0, API_URL.indexOf('/api')) || API_URL;
    
    socketRef.current = io(serverBaseUrl, { 
    });
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (ticketId) {
        socket.emit('joinTicketRoom', ticketId);
        console.log('Emitted joinTicketRoom for:', ticketId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('ticket:updated', (payload) => {
      const updatedTicket = payload;
      const notificationText = payload.notificationText || `Ticket ${updatedTicket.title || 'untitled'} updated`;
      console.log('Received ticket:updated', updatedTicket);
      if (updatedTicket._id === ticketId) {
        setLiveTicket(updatedTicket);
        enqueueSnackbar(notificationText, { 
          variant: 'info' 
        });
        dispatch(addNotification({
          text: notificationText,
          ticketId: updatedTicket._id
        }));
      }
    });

    return () => {
      console.log('Disconnecting socket...');
      socket.disconnect();
    };
    
  }, [ticketId, dispatch, enqueueSnackbar]);

  const displayTicketData = liveTicket || currentTicket;

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

  const getCompletedSteps = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return ['Logged'];
    }
    
    const completedSteps = ticket.progress.map(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled', 
        'closed': 'Closed'
      };
      return statusMap[p.status] || p.status;
    });
    
    const isCompleted = ticket.status === 'closed';
    
    return isCompleted ? completedSteps : [...completedSteps, 'In Progress'];
  };

  const getActiveStepIndex = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return 0;
    }
    
    if (ticket.status === 'resolved' || ticket.status === 'closed' || 
        (ticket.progress.length > 0 && ticket.progress[ticket.progress.length - 1].status === 'completed')) {
      return getCompletedSteps(ticket).length - 1;
    }
    
    return getCompletedSteps(ticket).length - 1;
  };

  const getStepDescription = (step, ticket) => {
    if (!ticket || !ticket.progress) return '';
    
    const progressEntry = ticket.progress.find(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled',
        'closed': 'Closed'
      };
      return statusMap[p.status] === step;
    });
    
    return progressEntry ? progressEntry.description : '';
  };

  const progressStatusLabels = {
    'logged': 'Logged',
    'assigned': 'Assigned',
    'quote-sent': 'Quote Sent',
    'hardware-ordered': 'Hardware Ordered',
    'scheduled': 'Scheduled',
    'closed': 'Closed'
  };

  const completedSteps = getCompletedSteps(displayTicketData);
  const activeStep = getActiveStepIndex(displayTicketData);

  let displayLabel = "Not Planned Yet";
  let displayDate = null;
  let displayCalendar = false;
  let displayColor = 'text.secondary';

  if (displayTicketData) {
    const scheduledProgressEntry = displayTicketData.progress?.find(p => p.status === 'scheduled');
    const suggestedDateObj = displayTicketData.suggestedDate ? dayjs(displayTicketData.suggestedDate) : null;

    if (scheduledProgressEntry && scheduledProgressEntry.scheduledDate) {
      const confirmedDateObj = dayjs(scheduledProgressEntry.scheduledDate);
      if (confirmedDateObj.isValid()) {
        displayDate = confirmedDateObj;
        displayCalendar = true;
        if (suggestedDateObj && suggestedDateObj.isValid()) {
          if (confirmedDateObj.startOf('minute').isSame(suggestedDateObj.startOf('minute'))) {
            displayLabel = "Confirmed";
            displayColor = 'success.main';
          } else {
            displayLabel = "Technician Changed Schedule";
            displayColor = 'info.main';
          }
        } else {
          displayLabel = "Scheduled";
          displayColor = 'text.primary';
        }
      }
    } else if (suggestedDateObj && suggestedDateObj.isValid()) {
      displayLabel = "Not Confirmed";
      displayDate = suggestedDateObj;
      displayCalendar = true;
      displayColor = 'warning.main';
    } 
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      await dispatch(addComment({ ticketId, comment: newComment })).unwrap();
      setNewComment('');
    } catch (error) {
      setCommentError(error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading && !displayTicketData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !displayTicketData) {
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

  if (!displayTicketData) {
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          bgcolor: 'primary.main',
          borderRadius: '8px',
          color: 'primary.contrastText',
          p: 2
        }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 0, color: 'inherit', fontWeight: 'bold' }}>
              Ticket Details: {displayTicketData.title}
            </Typography>
          </Box>
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
          <Grid item xs={12} md={6}> 
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><AccessTimeIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(displayTicketData.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><PersonIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Technician: {displayTicketData.technician ? `${displayTicketData.technician.firstName} ${displayTicketData.technician.lastName}` : 'Not assigned'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><CategoryIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Category: <Chip label={displayTicketData.category} size="small" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><FlagIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Priority: <Chip label={displayTicketData.priority} color={getPriorityColor(displayTicketData.priority)} size="small" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><InfoIcon color="primary" /></ListItemIcon>
                    <Typography variant="body2" color="text.secondary">
                      Status: <Chip label={displayTicketData.status} color={getStatusColor(displayTicketData.status)} size="small" />
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {displayTicketData.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: displayColor, fontWeight: 'medium' }}>
                {displayLabel}
              </Typography>

              {displayCalendar && displayDate ? (
                <Box sx={{ mt: 1 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    readOnly
                    value={displayDate}
                    renderInput={(params) => <TextField {...params} sx={{ display: 'none' }} />}
                    sx={{
                      '& .MuiPickerStaticWrapper-root': { minWidth: 'auto' },
                      '& .MuiCalendarPicker-root': { width: '100%', maxHeight: '300px' },
                      bgcolor: 'transparent'
                    }}
                  />
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5,
                    gap: 0.5 
                  }}>
                    <AccessTimeIcon color="action" fontSize="small" />
                    <Typography variant="subtitle1">
                      {displayDate.format('HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                   {displayLabel === 'Not Planned Yet' ? displayLabel : ''} 
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Ticket Progress Tracking
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {completedSteps.map((label, index) => {
                  const isActive = index === activeStep;
                  const isInProgress = isActive && label === 'In Progress';

                  return (
                    <Step key={label} completed={index < activeStep}>
                      <StepLabel
                        StepIconProps={{
                          sx: {
                            '&.Mui-active': {
                              color: isInProgress ? 'warning.main' : undefined, 
                              '& .MuiStepIcon-text': { 
                                fill: isInProgress ? 'transparent' : undefined, 
                              }
                            },
                          },
                        }}
                        sx={{
                          '& .MuiStepLabel-label': {
                            '&.Mui-active': {
                              color: isInProgress ? 'warning.main' : undefined,
                              fontWeight: isInProgress ? 'medium' : undefined,
                            },
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

              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon fontSize="small" />
                Progress History
              </Typography>
              {displayTicketData.progress && displayTicketData.progress.length > 0 ? (
                <List dense sx={{ 
                  overflow: 'auto', 
                  bgcolor: 'background.paper', 
                  p: 0, 
                  flexGrow: 1
                }}>
                  {displayTicketData.progress.map((progress, index) => (
                    <ListItem key={index} divider={index < displayTicketData.progress.length - 1}>
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

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon fontSize="small" />
                Updates and Comments
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2, p: 0 }}>
                {displayTicketData.comments && displayTicketData.comments.length > 0 ? (
                  displayTicketData.comments.map((comment, index) => (
                    <ListItem key={index} alignItems="flex-start" divider={index < displayTicketData.comments.length - 1}>
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

              {displayTicketData && !['closed', 'cancelled'].includes(displayTicketData.status) ? (
                <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Add your comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={submittingComment || !newComment.trim()}
                    sx={{ mt: 1 }}
                    size="small"
                  >
                    {submittingComment ? <CircularProgress size={20} /> : 'Add Comment'}
                  </Button>
                   {commentError && <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>{commentError}</Typography>}
                </Box>
              ) : (
                <Typography sx={{ mt: 2 }} color="text.secondary" variant="body2">
                  Cannot add comments to a {displayTicketData?.status} ticket.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

export default TicketDetails; 